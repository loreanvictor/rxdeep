> :Banner


Fast and precise reactive state management, in a flexible and unopinionated manner. Make changes
to any part of your state tree, track changes, subscribe to specific node/sub-tree, track changes by entity keys, etc.

```bash
npm i rxdeep
```

---

# Quick Tour

Create state:

```ts
import { State } from 'rxdeep';
const state = new State([ { name: 'John' }, { name: 'Jack' }, { name: 'Jill' } ]);
```

<br>

Listen to sub-state:

```ts
state.sub(1).sub('name').subscribe(console.log); // --> subscribes to property `name` of object at index 1 of the array
```

<br>

Modify root state:
```ts
state.value = [ { name: 'Julia' }, ...state.value ]; // --> logs `John`, since `John` is index 1 now
```

... or mid-level states:

```ts
state.sub(1).value = { name: 'Josef' };              // --> logs `Josef`
```

... or leaf-states on the same address:
```ts
state.sub(1).sub('name').value = 'Jafet';            // --> logs `Jafet`
```

<br>

A `State` is an [`Observer`](https://rxjs.dev/guide/observer):

```ts
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

interval(1000)
.pipe(map(i => ({ name: `Jarvis #${i}`})))
.subscribe(state.sub(1));                            // --> logs `Jarvis #0`, `Jarvis #1`, `Jarvis #2`, ...
```

<br>

A `State` is an [`Observable`](https://rxjs.dev/guide/observable):

```ts
import { debounceTime } from 'rxjs/operators';

state.sub(1).pipe(debounceTime(1000)).subscribe(console.log); // --> debounces changes for 1 second
```

<br>

Track `keys` instead of indexes:

```ts
import { State, Keyed } from 'rxdeep';

const state = new State([{ id: 101, name: 'Jill' }, { id: 102, name: 'Jack' }]);
const keyed = new Keyed(state, p => p.id);

keyed.key(101).sub('name').subscribe(console.log);     // --> logs `Jill`

state.value = [state.value[1], state.value[0]];      // --> no log
state.sub(1).sub('name').value = 'John';             // --> logs `John`
```

<br>

Track index of a specific `key`:

```ts
keyed.index(101).subscribe(console.log);      // --> logs 0, 1
```

> :ToCPrevNext