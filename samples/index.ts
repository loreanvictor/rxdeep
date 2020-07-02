import { State } from '../src';
import { Keyed } from '../src/keyed';


const a = new State([{ name: 'eugene', id: 1}, {name: 'jack', id: 2}]);
const k = new Keyed(a, _ => _.id);

// a.subscribe();

k.key(1).sub('name').subscribe(console.log);

a.sub(0).sub('name').value = 'JACK';

a.value = [a.value[1], a.value[0]];
// console.log(a.value);
// console.log(a.sub(0).value);
a.sub(0).sub('name').value = 'dude';
a.sub(0).sub('name').value = 'dude';
