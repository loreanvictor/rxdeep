import { State, KeyedState } from '../src';


const s = new State([{ id: 21, name: 'eugene'}, { id: 22, name: 'john' }]);
const k = new KeyedState(s, p => p.id);

k.key(22).sub('name').subscribe(console.log);
s.value = [s.value[1], s.value[0]];
s.sub(0).value = { id: 22, name: 'jack' };