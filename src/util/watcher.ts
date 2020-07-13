import { KeyFunc, KeyMap, ListChanges } from '../types';


export class Watcher<T> {
  private _keymap: KeyMap<T>;

  constructor(initial: T[] | undefined, readonly keyFunc: KeyFunc<T>) {
    this._keymap = {};
    this.changes(initial);
  }

  changes(list: T[] = []) {
    const changes: ListChanges<T> = {
      additions: [],
      deletions: [],
      moves: [],
    };

    const keymap = list.reduce((map, item, index) => {
      const _key = this.keyFunc(item);
      map[_key] = { index, item };
      if (!(_key in this._keymap))
        changes.additions.push({ index, item });
      return map;
    }, <KeyMap<T>>{});

    Object.entries(this._keymap).forEach(([_key, entry]) => {
      if (!(_key in keymap)) changes.deletions.push(entry);
      else {
        const _newEntry = keymap[_key];
        if (_newEntry.index !== entry.index) 
          changes.moves.push({
            oldIndex: entry.index,
            newIndex: _newEntry.index,
            item: entry.item
          });
      }
    });

    this._keymap = keymap;

    return changes;
  }

  public get keymap() { return this._keymap; }
}
