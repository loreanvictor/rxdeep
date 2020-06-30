import { KeyFunc, KeyMap, ListChanges } from './types';


export class KeyWatcher<T> {
  private _keymap: KeyMap<T>;

  constructor(initial: T[], readonly keyFunc: KeyFunc<T>) {
    this._keymap = {};
    this.changes(initial);
  }

  changes(list: T[]) {
    const changes: ListChanges<T> = {
      additions: [],
      deletions: [],
      moves: [],
    };

    const keymap = Object.entries(list).reduce((map, [index, item]) => {
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
        if (_newEntry.index != entry.index) 
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
