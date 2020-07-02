import { Observer } from 'rxjs';


export function ignore() {
  return <Observer<any>> {
    next: () => {},
    error: () => {},
    complete: () => {},
  }
}
