import { ChangeTrace, Change } from './types';


function isRaw(v: any) {
  return v === null || v === undefined
    || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
    || v instanceof Date;
}


export function trace<T>(src: T, dest: T): ChangeTrace<T> | undefined {
  if (src === dest) return undefined;

  if (!isRaw(src) && !isRaw(dest)) {
    const tr: ChangeTrace<T> = { subs: { } };
    const seen = new Set();
    let changed = false;

    for (let key in src) {
      seen.add(key);
      const subTrace = trace(src[key], dest[key]);
      if (subTrace) {
       (tr.subs as any)[key] = subTrace;
       changed = true;
      }
    }

    for (let key in dest) {
      if (seen.has(key)) continue;
      (tr.subs as any)[key] = trace(src[key], dest[key]);
      changed = true;
    }

    if (changed)
      return tr;
    else return undefined;
  }

  if (src instanceof Date && dest instanceof Date && +src !== +dest) {
    return { from: src, to: dest };
  }

  /* istanbul ignore next */
  if (src !== dest) {
    return { from: src, to: dest };
  }
}


export function change<T>(src: T, dest: T): Change<T> | undefined {
  const _trace = trace(src, dest);
  if (_trace) return {
    value: dest, trace: _trace
  };
}
