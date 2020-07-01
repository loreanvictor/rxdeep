export type EqualityCheck<T> = (a: T | undefined, b: T | undefined) => boolean;


export interface ChangeTraceElement<T> {
  sub: keyof T;
  keys?: {
    [key: string]: number | string;
  }
}


export interface ChangeTrace<T> {
  head: ChangeTraceElement<T>;
  rest?: ChangeTrace<any>;
}


export interface Change<T> {
  value: T | undefined;
  trace?: ChangeTrace<T>;
}


export type KeyFunc<T> = (t: T) => number | string;

export type KeyMap<T> = {[key: string]: { index: number; item: T }};

export type Addition<T> = {
  index: number;
  item: T;
};

export type Deletion<T> = {
  index: number;
  item: T;
};

export type Move<T> = {
  oldIndex: number;
  newIndex: number;
  item: T;
};

export type ListChanges<T> = {
  additions: Addition<T>[];
  deletions: Deletion<T>[];
  moves: Move<T>[];
}
