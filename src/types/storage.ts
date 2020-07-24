import { Observable } from 'rxjs';


export interface Storage<T> {
  load(): Observable<T | undefined> | undefined;
  save(t: T | undefined): void;
}

export function isStorage<T>(whatevs: any): whatevs is Storage<T> {
  return whatevs && whatevs.load && typeof whatevs.load === 'function'
        && whatevs.save && typeof whatevs.save === 'function';
}


export interface PushStorage<T> extends Storage<T> {
  changes(): Observable<T | undefined>;
}

export function isPush<T>(storage: Storage<T>): storage is PushStorage<T> {
  return (storage as any).changes && typeof (storage as any).changes === 'function';
}

export function isPushStorage<T>(whatevs: any): whatevs is PushStorage<T> {
  return isStorage(whatevs) && isPush(whatevs);
}
