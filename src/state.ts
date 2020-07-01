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
          if (change.value !== this._value) this._value = change.value; // --> maintain updated reference
          observer.next(change.value);                                  // --> pass value down
        },
        err => observer.error(err),
        () => observer.complete()
      );
    });

    this._value = initial;
    this.downstream = downstream;
    this.upstream = upstream || this.downstream as any as Observer<Change<T>>;
  }

  next(t: T | undefined) { this.upstream.next({ value: t }); }
  error(err: any) { this.upstream.error(err); }
  complete() { this.upstream.complete(); }

  get value() { return this._value as any; }
  set value(t: T) { this.next(t); }

  sub<K extends keyof T>(key: K, isEqual: EqualityCheck<T[K]> = (a, b) => a === b) {
    const _sub: State<T[K]> = new State(
      this.value ? this.value[key] : undefined,                   // --> initial value
      this.downstream.pipe(                                       // --> for changes reported from above
        map(change => ({
          trace: change.trace,
          value: change.value ? change.value[key] : undefined     // --> extract change's value for equality check
        })),
        filter(
          change => change.trace?.head?.sub === key               // --> check if change's address matches sub key
          || (
            !change.trace?.head                                   // --> or change is not targeted any more
            && !isEqual(change.value, _sub.value)                 // --> and equality check fails
          )
        ),
        map(change => ({ 
          value: change.value,
          trace: change.trace?.rest                                // --> pass down rest of the trace
        }))
      ),
      {
        next: change => {                                          // --> for changes coming from the sub
          this.value[key] = change.value!!;                        // --> update latest value
          this.upstream.next({
            value: this.value,
            trace: {
              head: { sub: key },                                   // --> add sub key as trace head
              rest: change.trace
            }
          });
        },
        error: err => this.upstream.error(err),
        complete: () => {},
      }
    );

    return _sub;
  }
}
