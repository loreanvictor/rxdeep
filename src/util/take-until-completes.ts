import { Observable } from 'rxjs';
import { takeUntil, startWith, last } from 'rxjs/operators';


export function takeUntilCompletes<T>(observable: Observable<T>) {
  return takeUntil<T>(observable.pipe(
    startWith(undefined),
    last()
  ));
}
