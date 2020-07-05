import { Observable } from 'rxjs';
import { takeUntil, startWith, last } from 'rxjs/operators';


export function takeUntilCompletes<T>(observable: Observable<any>) {
  return takeUntil<T>(observable.pipe(
    startWith(undefined),
    last()
  ));
}
