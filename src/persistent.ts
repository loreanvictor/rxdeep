import { merge, OperatorFunction } from 'rxjs';
import { tap, filter, take } from 'rxjs/operators';

import { Storage, isPush, PushStorage } from './types/storage';
import { Change } from './types/changes';
import { State } from './state';


export class PersistentState<T> extends State<T> {
  private _received: T | undefined;

  constructor(
    readonly state: State<T>,
    readonly storage: Storage<T> | PushStorage<T>,
    readonly transform?: OperatorFunction<Change<T>, Change<T>>,
  ) {
    super(
      state.value,
      merge(
        state.downstream,
        state.downstream.pipe(
          filter(change => this._received !== change.value),
          transform || (_ => _),
          tap(change => {
            this._received = change.value;
            storage.save(change.value);
          }),
          filter(() => false),
        ),
        ...(isPush(storage) ? [
          storage.changes().pipe(
            tap(value => this._receive(value)),
            filter(() => false),
          )
        ] : [])
      ),
      state.upstream,
    );

    const stored = storage.load();
    if (stored) {
      stored.pipe(take(1)).subscribe(t => {
        this._value = t;
        this._receive(t);
      })
    } else {
      storage.save(state.value);
    }
  }

  private _receive(t: T | undefined) {
    this._received = t;
    this.next(t);
  }
}
