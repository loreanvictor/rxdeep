import { Subject, defer, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { State } from './state';
import { Change } from './types/changes';
import { reverse } from './reverse';
import { takeUntilCompletes } from './util/take-until-completes';


export class VerifiedState<T> extends State<T> {
  private _bounce = new Subject<Change<T>>();

  constructor(
    readonly state: State<T>,
    readonly verifier: (change: Change<T>) => boolean,
  ) {
    super(
      state.value,
      defer(() => merge(
        state.downstream.pipe(takeUntilCompletes(this._bounce)),
        this._bounce.pipe(map(reverse), takeUntilCompletes(state.downstream)
      ))),
      {
        next: change => {
          if (!verifier(change)) {
            this._bounce.next(change);
          } else {
            state.upstream.next(change);
          }
        },
        error: err => state.upstream.error(err),
        complete: () => this._bounce.complete(),
      }
    );
  }

  bounce() {
    return merge(
      this.downstream.pipe(filter(() => false), takeUntilCompletes(this._bounce)),
      this._bounce.pipe(takeUntilCompletes(this.downstream))
    );
  }
}


export function verified<T>(state: State<T>, verifier: (change: Change<T>) => boolean) {
  return new VerifiedState(state, verifier);
}
