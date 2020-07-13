import { map } from 'rxjs/operators';
import { Change, isLeaf } from '../types';
import { trace } from '../trace';


export function postTrace<T>() {
  return map((change: Change<T>) => {
    if (isLeaf(change.trace) && change.trace) {
      const post = trace(change.trace.from, change.trace.to);
      if (post) {
        return {
          value: change.value,
          trace: post,
        } as Change<T>;
      }
    }
    return change;
  });
}
