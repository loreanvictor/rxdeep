import { State, VerifiedState } from '../src';


const s = new State(12);
const v = new VerifiedState(s, change => change.from < change.to);

v.subscribe(console.log);
v.value = 10;
v.value = 14;
v.value = 8;
v.value = 13;
v.value = 15;