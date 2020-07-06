import { Observable, Observer, Subject } from 'rxjs';
import { filter, map, tap, multicast, refCount } from 'rxjs/operators';

import { Change, EqualityCheck, ChangeTraceRest } from './types';


export class State<T> extends Observable<T | undefined> implements Observer<T | undefined> {
  private _value: T | undefined;
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
      tap(change => {
        if (change.value !== this._value) this._value = change.value;
      }),
      multicast(() => this._changesub),
      refCount(),
    );
    this.upstream = upstream || downstream as any as Observer<Change<T>>;
  }

  next(t: T | undefined) { this.upstream.next({ value: t, from: this.value, to: t }); }
  error(err: any) { this.upstream.error(err); }
  complete() { this.upstream.complete(); this._changesub.complete(); }

  get value() { return this._value as any; }
  set value(t: T) { this.next(t); }

  sub<K extends keyof T>(key: K, isEqual: EqualityCheck<T[K]> = (a, b) => a === b) {
    const _sub: State<T[K]> = new State(
      this.value ? this.value[key] : undefined,                   // --> initial value,
      this.subDownstream(key, v => !isEqual(v, _sub.value)),
      this.subUpstream(key),
    );

    return _sub;
  }

  subDownstream<K extends keyof T>(key: K, hasChanged: (v: T[K] | undefined) => boolean) {
    return this.downstream.pipe(                                // --> for changes reported from above
      map(change => ({
        trace: change.trace, from: change.from, to: change.to,
        value: change.value ? change.value[key] : undefined     // --> extract change's value for equality check
      })),
      filter(
        change => change.trace?.head?.sub === key               // --> check if change's address matches sub key
        || (
          !change.trace?.head                                   // --> or change is not targeted any more
          && hasChanged(change.value)                           // --> and value has changed
        )
      ),
      map(change => ({ 
        value: change.value, from: change.from, to: change.to,
        trace: change.trace?.rest                               // --> pass down rest of the trace
      }))
    )
  }

  subUpstream<K extends keyof T>(key: K): Observer<Change<T[K]>> {
    return {
      next: change => {                                          // --> for changes coming from the sub
        this.value[key] = change.value!!;                        // --> update latest value
        this.upstream.next({
          value: this.value,
          from: change.from, to: change.to,
          trace: {
            head: { sub: key },                                   // --> add sub key as trace head
            rest: change.trace as ChangeTraceRest<T>
          }
        });
      },
      error: err => this.upstream.error(err),
      complete: () => {},
    }
  }
}
