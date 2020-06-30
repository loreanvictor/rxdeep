export type EqualityCheck<T> = (a: T | undefined, b: T | undefined) => boolean;

export interface Change<T> {
  value: T | undefined;
  trace: any[];
}

export type KeyFunc<T> = (t: T) => number | string;

export type KeyMap<T> = {[key: string]: { index: string, item: T }};

export type Addition<T> = {
  index: string;
  item: T;
};

export type Deletion<T> = {
  index: string;
  item: T;
};

export type Move<T> = {
  oldIndex: string;
  newIndex: string;
  item: T;
};

export type ListChanges<T> = {
  additions: Addition<T>[];
  deletions: Deletion<T>[];
  moves: Move<T>[];
}
