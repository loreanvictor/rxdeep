import { State, KeyedState } from '../src';

const state = new State([{ id: 101, name: 'Jill' }, { id: 102, name: 'Jack' }]);

state.downstream.subscribe(console.log);    // --> Log changes
state.sub(1).sub('name').value = 'Dude';

