import { Observable, Observer, Subject } from 'rxjs';
import { map, filter, multicast, refCount, startWith, tap } from 'rxjs/operators';

import { State } from './state';
import { KeyFunc, ListChanges, Change, isLeaf, ChangeTraceNode, ChangeTrace } from './types';
import { Watcher } from './util/watcher';
import { trace } from './trace';


export class KeyedState<T> extends Observable<T[] | undefined> implements Observer<T[] | undefined> {
  private _changes: Observable<[Change<T[]>, ListChanges<T>]>;
  private _changesub: Subject<[Change<T[]>, ListChanges<T>]>;
  private _watcher: Watcher<T>;
  private _value: T[] = [];

  constructor(
    readonly state: State<T[]>,
    readonly keyfunc: KeyFunc<T>,
  ) {
    super((observer: Observer<T[] | undefined>) => {
      return this._changes.pipe(map(([change, _]) => change.value || []), startWith(this.value)).subscribe(observer);
    });

    this._watcher = new Watcher(state.value, keyfunc);
    this._value = state.value || [];
    this._changesub = new Subject<[Change<T[]>, ListChanges<T>]>();
    this._changes = this.state.downstream.pipe(
      map(change => [change, this._watcher.changes(change.value)] as [Change<T[]>, ListChanges<T>]),
      map(([change, listChanges]) => {
        if (listChanges.moves.length > 0 && !isLeaf(change.trace)) {
          const mapping = listChanges.moves.reduce((total, move) => {
            total[move.oldIndex] = move.newIndex;
            return total;
          }, <{[src: number]: number}>{});
          const _tr: ChangeTrace<T[]> = {subs:  { ... change.trace.subs } };
          Object.entries(mapping).forEach(([src, dest]) => {
            const subtrace = trace(this._value[src as any], change.value!![dest]);
            if (subtrace)
              (_tr.subs as any)[dest] = subtrace;
            else
              delete (_tr.subs as any)[dest];
          });
          return [{
            value: change.value,
            trace: _tr
          }, listChanges] as [Change<T[]>, ListChanges<T>];
        }
        return [change, listChanges] as [Change<T[]>, ListChanges<T>];
      }),
      tap(([change]) => {
        this._value = change.value || [];
      }),
      multicast(() => this._changesub),
      refCount(),
    );
  }

  next(t: T[] | undefined) {
    this.state.upstream.next({ value: t, trace: { from: this.value, to: t } });
  }

  error(err: any) { this.state.upstream.error(err); }
  complete() { this._changesub.complete(); }

  get value() { return this._value; }
  set value(t: T[]) { this.next(t); }

  key(key: number | string) {
    const sub: State<T> = new State(
      this._watcher.keymap[key]?.item,
      this.keyDownstream(key, () => sub.value),
      this.keyUpstream(key),
    );

    return sub;
  }

  keyDownstream(key: number | string, current: () => T | undefined) {
    return this._changes.pipe(
      map(([change, _]) => ({
        trace: change.trace,
        entry: this._watcher.keymap[key],
      })),
      filter(change => {
        /* istanbul ignore next */
        if (isLeaf(change.trace)) {
          return current() != change.entry.item;
        } else {
          return (!change.entry && !!current())
          || (change.entry && change.entry.index in change.trace.subs);
        }
      }),
      map(change => ({
        value: change.entry?.item,
        trace: isLeaf(change.trace) || !change.entry?
               undefined:
               ((change.trace as ChangeTraceNode<T>).subs as any)[change.entry.index]
      }))
    );
  }

  keyUpstream(key: number | string): Observer<Change<T>> {
    return {
      next: change => {
        const entry = this._watcher.keymap[key];
        this._value[entry.index] = change.value!!;
        this.state.upstream.next({
          value: this._value,
          trace: {
            subs: {
              [entry.index]: change.trace
            }
          }
        });
      },
      error: err => this.state.upstream.error(err),
      complete: () => {},
    }
  }

  index(key: number | string) {
    return this._changes.pipe(
      map(() => this._watcher.keymap[key]?.index),
      startWith(this._watcher.keymap[key]?.index)
    );
  }

  changes() {
    return this._changes.pipe(map(([_, listChanges]) => listChanges));
  }
}
