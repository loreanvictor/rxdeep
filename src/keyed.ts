import { Observable, Observer } from 'rxjs';
import { share, map, filter } from 'rxjs/operators';

import { State } from './state';
import { KeyFunc, ListChanges, Change, EqualityCheck } from './types';
import { Watcher } from './watcher';


export class Keyed<T>
  extends Observable<T[] | undefined>
  implements Observer<T[] | undefined> {
  private _changes: Observable<[Change<T[]>, ListChanges<T>]>;
  private _watcher: Watcher<T>;
  private _traceKey: string;

  constructor(
    readonly state: State<T[]>,
    readonly keyfunc: KeyFunc<T>,
  ) {
    super((observer: Observer<T[] | undefined>) => {
      return this._changes.pipe(map(([change, _]) => change.value)).subscribe(observer);
    });

    this._traceKey = Math.random().toString(36).substring(2, 15)
                    + Math.random().toString(36).substring(2, 15);
    this._watcher = new Watcher(state.value, keyfunc);
    this._changes = this.state.downstream.pipe(
      map(change => [change, this._watcher.changes(change.value)] as [Change<T[]>, ListChanges<T>]),
      share(),
    );
  }

  next(t: T[] | undefined) { this.state.upstream.next({ value: t }); }
  error(err: any) { this.state.upstream.error(err); }
  complete() { this.state.upstream.complete(); }

  get value() { return this._watcher.last; }
  set value(t: T[]) { this.next(t); }

  key(key: number | string, isEqual: EqualityCheck<T> = (a, b) => a === b) {
    const sub: State<T> = new State(
      this._watcher.keymap[key]?.item,
      this._changes.pipe(
        map(([change, _]) => ({ trace: change.trace, entry: this._watcher.keymap[key] })),
        filter(change =>
          change.trace?.head?.keys?.[this._traceKey] === key
          || change.trace?.head?.sub === change.entry.index
          || (
            !change.trace?.head
            && !isEqual(change.entry.item, sub.value)
          )
        ),
        map(change => ({
          value: change.entry.item,
          trace: change.trace?.rest
        }))
      ),
      {
        next: change => {
          const entry = this._watcher.keymap[key];
          this._watcher.last[entry.index] = change.value!!;
          this.state.upstream.next({
            value: this._watcher.last,
            trace: {
              head: { sub: entry.index, keys: { [this._traceKey]: key }},
              rest: change.trace,
            }
          });
        },
        error: err => this.state.upstream.error(err),
        complete: () => {},
      }
    );

    return sub;
  }

  index(key: number | string) {
    return this._changes.pipe(map(() => this._watcher.keymap[key].index));
  }
}
