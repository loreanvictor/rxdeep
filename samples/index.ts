import { State, Change } from '../src';
import { Subject, interval } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

const echo = new Subject<Change<number>>();
const state = new State(3,
  echo.pipe(map(change => ({
    ...change,
    value: Math.min(change.value!!, 10),
  }))),
  echo
);

state.subscribe(console.log);

state.value = 4;
state.value = 12;
state.value = 9;
state.value++;
state.value++;
