import { Change, isLeaf, ChangeTrace } from './types';


function clean<T>(l: T[]) {
  if (l[l.length - 1] === undefined) {
    l.length--;
    clean(l);
  }
}


export function reverse<T>(change: Change<T>): Change<T> {
  if (isLeaf(change.trace)) {
    return {
      value: change.trace!!.from,
      trace: {
        from: change.trace!!.to,
        to: change.trace!!.from,
      }
    };
  } else {
    const revalue = Array.isArray(change.value) ? [...change.value] : {...change.value };

    const retrace: ChangeTrace<T> = {
      subs: {}
    };

    for (let key in change.trace.subs) {
      const reversed = reverse({
        value: change.value ? (change.value as any)[key] : undefined,
        trace: (change.trace.subs as any)[key],
      })!!;

      (revalue as any)[key] = reversed.value;
      (retrace.subs as any)[key] = reversed.trace;
    }

    if (Array.isArray(revalue)) {
      clean(revalue);
    }

    return {
      value: revalue as T,
      trace: retrace,
    };
  }
}
