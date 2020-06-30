import { Observable, Observer, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Change, EqualityCheck } from './types';


export class State<T> extends Observable<T | undefined> implements Observer<T | undefined> {
  private _value: T | undefined;
  readonly downstream: Observable<Change<T>>;
  readonly upstream: Observer<Change<T>>;

  constructor(initial: T | undefined);
  constructor(initial: T | undefined, downstream: Observable<Change<T>>, upstream: Observer<Change<T>>);
  constructor(initial: T | undefined,
    downstream: Observable<Change<T>> = new Subject<Change<T>>(),
    upstream?: Observer<Change<T>>
  ) {
    super((observer: Observer<T | undefined>) => {
      observer.next(this._value);
      return downstream.subscribe(change => {
          if (change.value !== this._value) this._value = change.value;
          observer.next(change.value);
        },
        err => observer.error(err),
        () => observer.complete()
      );
    });

    this._value = initial;
    this.downstream = downstream;
    this.upstream = upstream || this.downstream as any as Observer<Change<T>>;
  }

  next(t: T | undefined) { this.upstream.next({ value: t, trace: [] }); }
  error(err: any) { this.upstream.error(err); }
  complete() { this.upstream.complete(); }

  get value() { return this._value as any; }
  set value(t: T) { this.next(t); }

  sub<K extends keyof T>(key: K, isEqual: EqualityCheck<T[K]> = (a, b) => a === b) {
    const _sub: State<T[K]> = new State<T[K]>(
      this.value ? this.value[key] : undefined,
      this.downstream.pipe(
        map(change => ({ trace: change.trace, value: change.value ? change.value[key] : undefined })),
        filter(
          change => change.trace[0] === key
          || (change.trace.length === 0 && !isEqual(change.value, _sub.value))),
        map(change => ({ value: change.value, trace: change.trace.slice(1) }))
      ),
      {
        next: change => {
          this.value[key] = change.value!!;
          this.upstream.next({ value: this.value, trace: [key, ...change.trace]});
        },
        error: err => this.upstream.error(err),
        complete: () => {},
      }
    );

    return _sub;
  }
}
