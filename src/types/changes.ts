export type ChangeTraceLeaf<T> = {
  from: T | undefined;
  to: T | undefined;
}

export type ChangeTraceNode<T> = {
  subs: (T extends any[] ? {
    [index: number]: ChangeTrace<T[number]> } :
    Partial<{[K in keyof T]: ChangeTrace<T[K]>}>) | {}
}

export type ChangeTrace<T> = ChangeTraceLeaf<T> | ChangeTraceNode<T>;

export interface Change<T> {
  value: T | undefined;
  trace?: ChangeTrace<T> | undefined;
}

export function isLeaf<T>(c: ChangeTrace<T> | undefined): c is ChangeTraceLeaf<T> | undefined {
  return !c || !(c as any).subs;
}
