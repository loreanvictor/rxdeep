import { State, trace } from '../src';

const s = new State([1, 2, 3, 4]);
s.sub(4).subscribe(console.log);
s.value = [1, 3, 3, 4, 5];

