import { State } from '../src';
import { Keyed } from '../src/keyed';


// TODO: FIX

const a = new State([{ name: 'eugene', id: 1}, {name: 'jack', id: 2}]);
const k = new Keyed(a, _ => _.id);
// BUG: when the following line is commented,
//      the log result is "eugene, dude, dude" (which is wrong)
//      when it is uncommented, the log result is "eugene" (which is correct).
//      correctness of sub-keyed state value shouldn't be dependent on root state subscriptions.
a.subscribe();

// a.sub(1).sub('name').subscribe(console.log);
k.key(1).sub('name').subscribe(console.log);
// k.index(1).subscribe(console.log);

a.value = [a.value[1], a.value[0]];
a.sub(0).sub('name').value = 'dude';
a.sub(0).sub('name').value = 'dude';
