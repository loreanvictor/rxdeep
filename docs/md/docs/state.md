# State

A `State` represents a value that can change, i.e. a _reactive_ value (as in "it reacts to stuff"):

```ts
/*!*/import { State } from 'rxdeep';

const a = new State(42);
const b = new State([1, 2, 3, 4]);
const c = new State({
  name: 'Awesome Team',
  people: [
    { id: 101, name: 'Jeremy' },
    { id: 102, name: 'Julia' }
  ],
  ...
})
```

<br>

A `State` is an [`Observable`](https://rxjs.dev/guide/observable), so you can subscribe to it and read
its values as they change over time:

```ts
const a = new State(42);
/*!*/a.subscribe(console.log); // --> log values from a

a.value = 43;             // --> logs 43
a.value = 44;             // --> logs 44
a.value = 44;             // --> logs 44

// Logs:
// > 42
// > 43
// > 44
// > 44
```

<br>

You can change the value of a `State` using its `.value` property:

```ts
a.value = 44;
```

Or using its `.next()` method:

```ts
a.next(44);
```

<br>

You can also read current value of a `State` using its `.value` property:

```ts
const a = new State(42);
/*!*/a.subscribe();           // --> this is important!

/*!*/console.log(a.value);    // --> logs 42
a.value = 43;
/*!*/console.log(a.value);    // --> logs 43

// Logs:
// > 42
// > 43
```

> [warning](:Icon) **WARNING**
>
> `.value` will not be up to date with `State`'s latest changes unless the `State` is _subscribed to_,
> which means either `.subscribe()` method of the `State` should have been called or that of one of its sub-states
> (or proxy states).
>
> So this will NOT work:
> ```ts
> const a = new State(42);
> a.value = 43;
> console.log(a.value); // --> logs 42!!!
>
> // Logs:
> // > 42
> ```

<br>

A `State` is also an [`Observer`](https://rxjs.dev/guide/observer), which means it can subscribe to 
another [`Observable`](https://rxjs.dev/guide/observable):

```ts
import { interval } from 'rxjs';

const a = new Subject(0);
interval(1000).subscribe(a);
```

---

## Change Immutability

**ALWAYS** make changes to the state that respect object immutability. You **MUST** always ensure that you are changing the 
reference when changing the value of a `State`.

This happens automatically with raw values (`number`, `boolean`, `string`, etc.). For more complex values (objects and arrays),
use the rest operator `...` or methods that create a new reference.

**DONT**:

```ts
state.value.push(x);
```

**DO**:

```ts
state.value = state.value.concat(x);
// -- OR --
state.next(state.value.concat(x));
```

<br>

**DONT**:

```ts
state.value.x = 42;
```

**DO**:

```ts
state.value = { ...state.value, x: 42 }
// -- OR --
state.sub('x').value = 42;
// -- OR --
state.next({ ...state.value, x : 42 });
// -- OR --
state.sub('x').next(42);
```

---

## Sub-States

Take this `State`:

```ts
const team = new State({
  name: 'Awesome Team',
  people: [
    { id: 101, name: 'Julia' },
    { id: 102, name: 'Jeremy' },
  ]
})
```

The whole `team` is a value that changes over time, but so is its `.name`, or its `.people`. Also the `.length` of the `.name` is a value
that changes over time, so is the first person in `.people` list.

You can represent all these reactive values with `State` objects as well, using `team`'s `.sub()` method:

```ts
const name = team.sub('name');

const nameLength = name.sub('length');
const nameLength = team.sub('name').sub('length');

const people = team.sub('people');

const firstPerson = people.sub(0);
const firstPerson = team.sub('people').sub(0);

const firstPersonsName = people.sub(0).sub('name');
const firstPersonsName = team.sub('people').sub(0).sub('name');
```

In this example, `team` is the _parent state_ of all (also called the _root state_), and `name` is its _sub-state_ (or _child state_).
`nameLength` is also a sub-state of `name`, you could call it a _grandchild_ of `team`.

You can use `sub` method with any possible key (index, string key, symbol, etc) of the objects of the parent state. The
result is another `State` object, reflecting the state of that particular property.

<br>

Sub-states pick up changes made to their parent states:

```ts
const team = new State({
  name: 'Awesome Team',
  people: [
    { id: 101, name: 'Julia' },
    { id: 102, name: 'Jeremy' },
  ]
});

team.sub('name').sub('length').subscribe(console.log);
team.value = {
  name: 'That Other Team',
  people: [...]
};

// Logs:
// > 12
// > 15
```

<br>

A sub-state only emits values when its value has really changed:

```ts
team.sub('people').sub(0).sub('name').subscribe(console.log);

team.value = {
  name: team.value.name, // --> do not change the name
  people: [
    {id: 101, name: 'Julia'},
    {id: 103, name: 'Jaber'},
    {id: 102, name: 'Jeremy'},
  ]
}

team.sub('people').sub(0).value = { id: 104, name: 'Jin' }

// Logs:
// > Julia
// > Jin
```

Or when a change is issued at the same address of the tree:

```ts
team.sub('people').sub(0).sub('name').subscribe(console.log);
team.sub('people').sub(0).sub('name').value = 'Julia';

// Logs:
// > Julia
// > Julia
```

<br>

You can make changes in sub-states while listening to them on parent states:

```ts
const team = new State({
  name: 'Awesome Team',
  people: [
    { id: 101, name: 'Julia' },
    { id: 102, name: 'Jeremy' },
  ]
});

team.subscribe(console.log);
team.sub('name').value = 'That Other Team';

// Logs:
// > { name: 'Awesome Team', people: [...] }
// > { name: 'That Other Team', people: [...] }
```

> [touch_app](:Icon) **IMPORTANT**
>
> It is a good idea to ensure sub-states are _subscribed to_ before you
> change their value. The `.value` property of a sub-state might also be out of sync
> if it is not subscribed to. When you change its value, it will issue a change to
> the state-tree regardless of whether or not it is subscribed, the change
> might have the wrong history if `.value` is not in sync.

> :ToCPrevNext