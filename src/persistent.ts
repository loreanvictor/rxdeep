import { merge, OperatorFunction } from 'rxjs';
import { tap, filter } from 'rxjs/operators';

import { Storage } from './types/storage';
import { Change } from './types/changes';
import { State } from './state';


export class PersistentState<T> extends State<T> {
  private _received: T | undefined;

  constructor(
    readonly state: State<T>,
    readonly storage: Storage<T> ,
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
        storage.load().pipe(
          tap(value => {
            this._received = value;
            this.next(value);
          }),
          filter<any>(() => false),
        ),
      ),
      state.upstream,
    );
  }
}


export function persistent<T>(state: State<T>, storage: Storage<T>) {
  return new PersistentState(state, storage);
}
