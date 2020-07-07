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

<br>

<span style="color: #fa163f">**DON'T:**</span>

```ts
state.value.push(x);
```

<span style="color: #27aa80">**DO:**</span>

```ts
state.value = state.value.concat(x);
// -- OR --
state.next(state.value.concat(x));
```

<br>

<span style="color: #fa163f">**DON'T:**</span>

```ts
state.value.x = 42;
```

<span style="color: #27aa80">**DO:**</span>

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

---

## Change History

You can subscribe to `.downstream` property of a `State` to listen for changes occuring to it
(instead of just updated values):

```ts
/*!*/team.sub('people').downstream.subscribe(console.log);
team.sub('people').sub(0).sub('name').value = 'Jackie';

// Logs:
// > {
// >   value: [ { id: 101, name: 'Jackie', id: 102, name: 'Jeremy' } ],
// >   from: 'Julia',
// >   to: 'Jackie',
// >   trace: { head: { sub: 0 } }, rest: { head: { sub: 'name' }, rest: undefined }
// > }
```

<br>

Each change object has the following properties:

```ts
type Change<T> = {
  value: T | undefined;           // --> value of current state if change was applied to it
  from: any;                      // --> the original value of the original state issuing the change
  to: any;                        // --> the updated value of the original state issuing the change
  trace?: ChangeTrace<T>;         // --> the trace of the change
}

type ChangeTrace<T> = {
  head: {                         // --> determines which sub-state the change bubbled up from
    sub: keyof T;                 // --> the sub-key of the sub-state
    ...
  },
  rest?: ChangeTrace<T>            // --> potentially the rest of the change trace
}
```

> :Buttons
> > :Button label=Read More About Changes, url=/docs/change

---

## Under the Hood

A `State` is constructed with an initial value, a _downstream_ (`Observable<Change>`), and an _upstream_ (`Observer<Change>`).
**Downstream** is basically where changes to this state come from.
**Upstream** is where this state should report its changes.

```ts
// In this example, the value of `state` is updated with a debounce, so
// changes made in rapid succession are supressed.

const echo = new Subject<Change<number>>();
/*!*/const state = new State(3, echo.pipe(debounceTime(300)), echo);

state.subscribe(console.log);

state.value = 4;                           // --> gets supressed
state.value = 10;                          // --> gets through
setTimeout(() => state.value = 15, 310);   // --> gets through
setTimeout(() => state.value = 17, 615);   // --> gets supressed
setTimeout(() => state.value = 32, 710);   // --> gets through

// Logs:
// > 3
// > 10
// > 15
// > 32
```
```ts
// In this example, the value of `state` will remained capped at 10.

const echo = new Subject<Change<number>>();
/*!*/const state = new State(3,
/*!*/  echo.pipe(map(change => ({
/*!*/    ...change,
/*!*/    value: Math.min(change.value!!, 10),
/*!*/  }))),
/*!*/  echo
/*!*/);

state.subscribe(console.log);

state.value = 4;    // --> ok
state.value = 12;   // --> changes to 10
state.value = 9;    // --> ok
state.value++;      // --> ok
state.value++;      // --> caps

// Logs:
// > 3
// > 4
// > 10
// > 9
// > 10
// > 10
```


<br>

When a new value is set on a `State`, it creates a [`Change`](/docs/change) object and passes it up the
upstream. The `State` **WILL NOT** immedialtely emit said value. Instead, it trusts that if the value
corresponding to a particular change should be emitted, it will eventually come down the downstream.
Thats how we are able to modify the value of requested changes in above examples.

The upstream and downstream of sub-states is set by the parent state. When a change is issued
to a sub-state, the parent state will pick up the change, add the corresponding sub-key to the
change trace, and send it through its own upstream. When a change comes down its downstream,
it will match it with sub-states using the sub-key specified in the change trace and down-propagate
it accordingly, removing the head of the change trace in the process.

> [**touch_app**](:Icon) **IMPORTANT**
>
> For performance reasons, a `State` will change its local `.value` when it is sending changes
> up the upstream, but will not emit them. This means if you want to completely reverse the effect
> of some particular change, you should emit a reverse change object on the downstream in response.
> Simply ignoring a change will cause the `State`'s value to go out of sync with the change history
> and the emission history.

<br>

### Trace-less Changes

It can happen that a received change lacks any trace. This is because the change was issued on the same
or lower depth of the state-tree. In such a case, the `State` cannot use the trace to determine which
sub-states should receive the change.

In this situation, the parent state would rely on equality checks to see if a particular change would
affect a particular sub-state. By default, the `===` operator is used. This is pretty fast and works
fine for most leaf-states (which typically have raw values). However, this might result in redundant emissions
by states whose value type is not raw (and hence `===` returns `false` despite the two objects being essentially the same).

If you need further emission precision on these cases as well, you can simply provide your own equality check
to `.sub()` method. Note that this will most probably incur some performance costs, in exchange for the added
precision it might provides:

```ts
import { isEqual } from 'lodash'; // @see [lodash.isEqual()](https://lodash.com/docs/4.17.15#isEqual)

const subState = state.sub(key, isEqual);
```

> :ToCPrevNext