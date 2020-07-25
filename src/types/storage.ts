import { Observable } from 'rxjs';


export interface Storage<T> {
  load(): Observable<T | undefined>;
  save(t: T | undefined): void;
}

export function isStorage<T>(whatevs: any): whatevs is Storage<T> {
  return whatevs && whatevs.load && typeof whatevs.load === 'function'
        && whatevs.save && typeof whatevs.save === 'function';
}
