# Key Tracking

When you have an array of objects, it often happens that you are interested on a particular
entity based on some identifier, regardless of its position within the array:

```ts
import { State } from 'rxdeep';

const state = new State([
  { id: 101, name: 'Jack' age: 32 },
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
  { id: 101, name: 'Jack' age: 32 },
  { id: 102, name: 'Jill', age: 67 },
  ...
]);

/*!*/const keyed = new KeyedState(state, person => person.id);
/*!*/keyed.key(101).subscribe(console.log);
```

In this example, the key function is `person => person.id`, i.e. each person is identified
by their `.id` property. `.key()` method behaves like `State.sub()` method, except that it represents
state of the entity matching given key instead of the entity on given index / property:

> :ToCPrevNext