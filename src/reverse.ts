import { Change } from './types';


export function reverse<T>(change: Change<T>): Change<T> {
  if (!change.trace) {
    return {
      value: change.from, from: change.to, to: change.from
    }
  } else {
    const subreversed = reverse({
      from: change.from, to: change.to,
      value: change.value ? change.value[change.trace.head.sub] : undefined,
      trace: change.trace.rest
    });

    const value: T | undefined = change.value ? (
      Array.isArray(change.value) ? [...change.value] as any as T : {...change.value}
    ) : undefined;

    if (value)
      value[change.trace.head.sub] = subreversed.value!!;

    return {
      value,
      from: subreversed.from, to: subreversed.to,
      trace: change.trace
    }
  }
}
