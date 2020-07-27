# Key Tracking

When you have an array of objects, it often happens that you are interested on a particular
entity based on some identifier, regardless of its position within the array:

```ts
import { state } from 'rxdeep';

const s = state([
  { id: 101, name: 'Jack', age: 32 },
  { id: 102, name: 'Jill', age: 67 },
  ...
]);
```

<br>

In this example, you might want a reactive state object that reflects state of _Jack_, independent
of where _Jack_ sits in the array. The `keyed()` method (or `KeyedState` class) allows you to track entities of an array
using some key function which helps identify each entitiy:

```ts
import { state, keyed } from 'rxdeep';

const k = keyed(state([
    { id: 101, name: 'Jack', age: 32 },
    { id: 102, name: 'Jill', age: 67 },
    ...
  ]),
  person => person.id
);

k.key(101).subscribe(console.log);
```

<br>

In this example, the key function is `person => person.id`, i.e. each person is identified
by their `.id` property. `.key()` method behaves like `State.sub()` method, except that it represents
state of the entity matching given key instead of the entity on given index / property:

```ts
k.value = [{ id: 103, name: 'James', age: 21 },  // --> no changes
           ...state.value];                      // --> no changes
k.value = [{ id: 103, name: 'James', age: 21},   // --> no changes
           { id: 101, name: 'Jack', age: 32 }];  // --> no changes
k.value = [{ id: 101, name: 'Jack', age: 33 }];  // --> change!!

// Logs only for the initial value and the last change:
// > { id: 101, name: 'Jack', age: 32 }
// > { id: 101, name: 'Jack', age: 33 }
```

<br>

The `.key()` method returns a typical [`State`](/docs/state), so you can similarly
use them to set values:

```ts
k.key(101).sub('age').value = 34;

// Logs:
// > { id: 101, name: 'Jack', age: 34 }
```

> [touch_app](:Icon) **NOTE**
>
> Similar to a sub-state, it is highly recommended to keep a keyed substate (result of `.key()` method)
> subscribed (having called its `.subscribe()` method) before issueing changes to it, to ensure that the
> state is in sync with the change history.

> [info](:Icon) **NOTE**
>
> Also you could use `KeyedState` constructor for creating keyed states:
> ```ts
> const k = new KeyedState(new State(...), ...);
> ```

---

## Index Tracking

You can also track the index of a particular key within the array using `.index()` method:

```ts
import { keyed, state } from 'rxdeep';

const k = keyed(state([
    { id: 101, name: 'Jack', age: 32 },
    { id: 102, name: 'Jill', age: 67 },
  ]),
  person => person.id
);

/*!*/k.index(101).subscribe(console.log);

k.value = [{ id: 103, name: 'James', age: 21 },
            ...state.value];
k.value = [{ id: 103, name: 'James', age: 21},
           { id: 101, name: 'Jack', age: 32 }];
k.value = [{ id: 101, name: 'Jack', age: 33 }];

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
import { state, keyed } from '../src';

const k = keyed(state([
    { id: 101, name: 'Jack', age: 32 },
    { id: 102, name: 'Jill', age: 67 },
  ]),
  person => person.id
);

/*!*/k.changes().subscribe(console.log);

k.value = [{ id: 103, name: 'James', age: 21 },
           ...k.value];
// Logs:
// > {
// >   additions: [{index: 0, item: {id: 103, name: 'James', age: 21}}],
// >   deletions: [],
// >   moves: [
// >     {oldIndex: 0, newIndex: 1, item: {id: 101, name: 'Jack', age: 32}},
// >     {oldIndex: 1, newIndex: 2, item: {id: 102, name: 'Jill', age: 67}}
// >   ]
// > }

k.value = [{ id: 103, name: 'James', age: 21},   // --> no changes
           { id: 101, name: 'Jack', age: 32 }];  // --> no changes
// Logs:
// > {
// >   additions: [],
// >   deletions: [{index: 2, item: {id: 102, name: 'Jill', age: 67}}],
// >   moves: []
// > }

k.value = [{ id: 101, name: 'Jack', age: 33 }];  // --> change!!
// Logs:
// > {
// >   additions: [],
// >   deletions: [{index: 0, item: {id: 103, name: 'James', age: 21}}],
// >   moves: [{oldIndex: 1, newIndex: 0, item: {id: 101, name: 'Jack', age: 32}}]
// > }

k.key(101).sub('age').value = 34;
// Logs:
// > {
// >   additions: [],
// >   deletions: [],
// >   moves: []
// > }
```

> :ToCPrevNext