import { State } from '../src/state';


const a = new State({x : 2, y : 3});
const b = new State({x: 3, z: 4});

a.sub('x').subscribe(b.sub('x'));
b.sub('x').subscribe(a.sub('x'));

b.subscribe(console.log);
a.sub('x').value = 5;