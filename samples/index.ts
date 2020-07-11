import { State } from '../src';
import { isEqual } from 'lodash';

const s = new State({ x: { y: 2 }, z: 4});
s.sub('x').subscribe(console.log);
// s.sub('x').sub('y').subscribe(console.log);
// s.value = {x : {y: 2}, z: 3};
s.upstream.next({
  from: 4, to: 3,
  value: { z: 3, x: { y: 2 } },
  trace: {
    head: { sub: 'z' }
  }
});
// s.value = { ...s.value, z: 3 };


