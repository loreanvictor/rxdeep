import { State } from '../src';


const a = new State([{ name: 'eugene'}, {name: 'jack'}]);
a.subscribe(console.log);
a.sub(0).sub('name').subscribe(console.log);
a.sub(0).subscribe(console.log);
a.value = a.value.slice(0, 1);
