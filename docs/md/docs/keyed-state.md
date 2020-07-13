# Key Tracking

When you have an array of objects, it often happens that you are interested on a particular
entity based on some identifier, regardless of its position within the array:

```ts
import { State } from 'rxdeep';

const state = new State([
  { id: 101, name: 'Jack', age: 32 },
  { id: 102, name: 'Jill', age: 67 },
  ...
]);
```

<br>

In this example, you might want a reactive state object that reflects state of _Jack_, independent
of where _Jack_ sits in the array. The `KeyedState` class allows you to track entities of an array
using some key function which helps identify each entitiy:

```ts
/*!*/import { State, KeyedState } from 'rxdeep';

const state = new State([
  { id: 101, name: 'Jack', age: 32 },
  { id: 102, name: 'Jill', age: 67 },
  ...
]);

/*!*/const keyed = new KeyedState(state, person => person.id);
/*!*/keyed.key(101).subscribe(console.log);
```

<br>

In this example, the key function is `person => person.id`, i.e. each person is identified
by their `.id` property. `.key()` method behaves like `State.sub()` method, except that it represents
state of the entity matching given key instead of the entity on given index / property:

```ts
state.value = [{ id: 103, name: 'James', age: 21 },  // --> no changes
               ...state.value];                      // --> no changes
keyed.value = [{ id: 103, name: 'James', age: 21},   // --> no changes
               { id: 101, name: 'Jack', age: 32 }];  // --> no changes
state.value = [{ id: 101, name: 'Jack', age: 33 }];  // --> change!!

// Logs only for the initial value and the last change:
// > { id: 101, name: 'Jack', age: 32 }
// > { id: 101, name: 'Jack', age: 33 }
```

<br>

The `.key()` method returns a typical [`State`](/docs/state), so you can similarly
use them to set values:

```ts
keyed.key(101).sub('age').value = 34;

// Logs:
// > { id: 101, name: 'Jack', age: 34 }
```

> [touch_app](:Icon) **NOTICE**
>
> Similar to a sub-state, it is highly recommended to keep a keyed substate (result of `.key()` method)
> subscribed (having called its `.subscribe()` method) before issueing changes to it, to ensure that the
> state is in sync with the change history.

---

## Index Tracking

You can also track the index of a particular key within the array using `.index()` method:

```ts
import { State, KeyedState } from '../src';

const state = new State([
  { id: 101, name: 'Jack', age: 32 },
  { id: 102, name: 'Jill', age: 67 },
]);
const keyed = new KeyedState(state, person => person.id);
/*!*/keyed.index(101).subscribe(console.log);

state.value = [{ id: 103, name: 'James', age: 21 },
               ...state.value];
keyed.value = [{ id: 103, name: 'James', age: 21},
               { id: 101, name: 'Jack', age: 32 }];
state.value = [{ id: 101, name: 'Jack', age: 33 }];

// Logs:
// > 0
// > 1
// > 0
```

---

## Detailed Array Changes

The `KeyedState` class also comes with `.changes()` method which provides a detailed change
profile of the array in terms of additions, deletions and moved items:

```ts
import { State, KeyedState } from '../src';

const state = new State([
  { id: 101, name: 'Jack', age: 32 },
  { id: 102, name: 'Jill', age: 67 },
]);
const keyed = new KeyedState(state, person => person.id);
/*!*/keyed.changes().subscribe(console.log);

state.value = [{ id: 103, name: 'James', age: 21 },
               ...state.value];
// Logs:
// > {
// >   additions: [{index: 0, item: {id: 103, name: 'James', age: 21}}],
// >   deletions: [],
// >   moves: [
// >     {oldIndex: 0, newIndex: 1, item: {id: 101, name: 'Jack', age: 32}},
// >     {oldIndex: 1, newIndex: 2, item: {id: 102, name: 'Jill', age: 67}}
// >   ]
// > }

keyed.value = [{ id: 103, name: 'James', age: 21},   // --> no changes
               { id: 101, name: 'Jack', age: 32 }];  // --> no changes
// Logs:
// > {
// >   additions: [],
// >   deletions: [{index: 2, item: {id: 102, name: 'Jill', age: 67}}],
// >   moves: []
// > }

state.value = [{ id: 101, name: 'Jack', age: 33 }];  // --> change!!
// Logs:
// > {
// >   additions: [],
// >   deletions: [{index: 0, item: {id: 103, name: 'James', age: 21}}],
// >   moves: [{oldIndex: 1, newIndex: 0, item: {id: 101, name: 'Jack', age: 32}}]
// > }

keyed.key(101).sub('age').value = 34;
// Logs:
// > {
// >   additions: [],
// >   deletions: [],
// >   moves: []
// > }
```

> :ToCPrevNext