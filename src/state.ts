import { Observable, Observer, Subject } from 'rxjs';
import { filter, map, tap, multicast, refCount } from 'rxjs/operators';

import { Change, isLeaf, ChangeTraceNode } from './types/changes';
import { postTrace } from './util/post-trace';


export class State<T> extends Observable<T | undefined> implements Observer<T | undefined> {
  protected _value: T | undefined;
  readonly downstream: Observable<Change<T>>;
  readonly upstream: Observer<Change<T>>;
  private _changesub: Subject<Change<T>>;

  constructor(initial: T | undefined);
  constructor(initial: T | undefined, downstream: Observable<Change<T>>, upstream: Observer<Change<T>>);
  constructor(initial: T | undefined,
    downstream: Observable<Change<T>> = new Subject<Change<T>>(),
    upstream?: Observer<Change<T>>
  ) {
    super((observer: Observer<T | undefined>) => {
      observer.next(this.value);
      return this.downstream.pipe(map(change => change.value)).subscribe(observer)
    });

    this._value = initial;
    this._changesub = new Subject<Change<T>>();
    this.downstream = downstream.pipe(
      postTrace<T>(),
      tap(change => {
        if (change.value !== this._value) {
          this._value = change.value;
        }
      }),
      multicast(() => this._changesub),
      refCount(),
    );
    this.upstream = upstream || downstream as any as Observer<Change<T>>;
  }

  next(t: T | undefined) { this.upstream.next({ value: t, trace: { from: this.value, to: t } }); }
  error(err: any) { this.upstream.error(err); }
  complete() { this.upstream.complete(); this._changesub.complete(); }

  get value() { return this._value!!; }
  set value(t: T) { this.next(t); }

  sub<K extends keyof T>(key: K) {
    const _sub: State<T[K]> = new State(
      this.value ? this.value[key] : undefined,
      this.subDownstream(key, () => _sub.value),
      this.subUpstream(key),
    );

    return _sub;
  }

  subDownstream<K extends keyof T>(key: K, current: () => T[K] | undefined) {
    return this.downstream.pipe(
      map(change => ({
        value: change.value ? change.value[key] : undefined,
        trace: change.trace,
      })),
      filter(change => {
        if (isLeaf(change.trace)) {
          return current() !== change.value;
        } else {
          return key in change.trace.subs;
        }
      }),
      map(change => ({
        value: change.value,
        trace: isLeaf(change.trace)?undefined:((change.trace as ChangeTraceNode<T>).subs as any)[key]
      }))
    )
  }

  subUpstream<K extends keyof T>(key: K): Observer<Change<T[K]>> {
    return {
      next: change => {
        if (this.value) {
          this.value[key] = change.value!!;
        }

        this.upstream.next({
          value: this.value,
          trace: {
            subs: {
              [key]: change.trace
            } as any
          }
        });
      },
      error: err => this.upstream.error(err),
      complete: () => {},
    }
  }
}
