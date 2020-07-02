import { State, Keyed } from '../src';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';


const a = new State([{ name: 'eugene', id: 1}, {name: 'jack', id: 2}]);
const k = new Keyed(a, _ => _.id);

// // a.subscribe();

k.changes().subscribe(console.log);
// a.sub(0).sub('name').subscribe(console.log);

a.value = [{ name: 'Ahmad', id: 3 }, ...a.value];
a.value = [a.value[1], a.value[0]];
// // console.log(a.value);
// // console.log(a.sub(0).value);
// k.key(1).sub('name').value = 'dude';
// k.key(1).sub('name').value = 'dude';
