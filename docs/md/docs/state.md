# State

A state represents a value that can change, i.e. a _reactive_ value (as in "it reacts to stuff"):

```ts
/*!*/import { state } from 'rxdeep';

const a = state(42);
const b = state([1, 2, 3, 4]);
const c = state({
  name: 'Awesome Team',
  people: [
    { id: 101, name: 'Jeremy' },
    { id: 102, name: 'Julia' }
  ],
  ...
})
```

You can also create states using the `State` class constructor:

```ts
import { State } from 'rxdeep';

const a = new State(42);
```

<br>

A state is an [`Observable`](https://rxjs.dev/guide/observable), so you can subscribe to it and read
its values as they change over time:

```ts
const a = state(42);
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

You can change the value of a state using its `.value` property:

```ts
a.value = 44;
```

Or using its `.next()` method:

```ts
a.next(44);
```

<br>

You can also read current value of a state using its `.value` property:

```ts
const a = state(42);
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
> `.value` will not be up to date with state's latest changes unless the state is _subscribed to_,
> which means either `.subscribe()` method of the state should have been called or that of one of its sub-states
> (or proxy states).
>
> So this will NOT work:
> ```ts
> const a = state(42);
> a.value = 43;
> console.log(a.value); // --> logs 42!!!
>
> // Logs:
> // > 42
> ```

<br>

A state is also an [`Observer`](https://rxjs.dev/guide/observer), which means it can subscribe to 
another [`Observable`](https://rxjs.dev/guide/observable):

```ts
import { interval } from 'rxjs';

const a = new Subject(0);
interval(1000).subscribe(a);
```

---

## Object Immutability

**ALWAYS** make changes to the state that respect object immutability. You **MUST** always ensure that you are changing the 
reference when changing the value of a state.

This happens automatically with raw values (`number`, `boolean`, `string`, etc.). For more complex values (objects and arrays),
use the rest operator `...` or methods that create a new reference.

<br>

<span style="color: #fa163f">**DON'T:**</span>

```ts
/*~*/s.value.push(x)/*~*/;
```

<span style="color: #27aa80">**DO:**</span>

```ts
s.value = s.value.concat(x);
// -- OR --
s.next(s.value.concat(x));
```

<br>

<span style="color: #fa163f">**DON'T:**</span>

```ts
/*~*/s.value.x = 42/*~*/;
```

<span style="color: #27aa80">**DO:**</span>

```ts
s.value = { ...s.value, x: 42 }
// -- OR --
s.sub('x').value = 42;
// -- OR --
s.next({ ...s.value, x : 42 });
// -- OR --
s.sub('x').next(42);
```

---

## Sub-States

Take this state:

```ts
const team = state({
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
result is another state object, reflecting the state of that particular property.

<br>

Sub-states pick up changes made to their parent states:

```ts
const team = state({
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
const team = state({
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

## Value Types

**RxDeep** requires the state-tree to be represented by plain JavaScript objects, i.e.
numbers, booleans, strings, `Date` objects, `undefined`, `null`, or arrays / objects
of other plain JavaScript objects, without any circular references:

```ts
type PlainJavaScriptObject = null | undefined | number | string | boolean | Date
                            | PlainJavaScriptObject[]
                            | {[key: string]: PlainJavaScriptObject}
```

This is essential since otherwise **RxDeep** is unable to perform [post-tracing](/docs/performance#change-in-arbitrary-nodes)
on changed objects.

---

## Change History

You can subscribe to `.downstream` property of a state to listen for changes occuring to it
(instead of just updated values):

```ts
/*!*/team.sub('people').downstream.subscribe(console.log);
team.sub('people').sub(0).sub('name').value = 'Jackie';

// Logs:
// > {
// >   value: [ { id: 101, name: 'Jackie', id: 102, name: 'Jeremy' } ],
// >   trace: {
// >     subs: {
// >       people: {
// >         subs: {
// >           0: {
// >             subs: {
// >               name: { from: 'Jeremy', to: 'Jackie' }
// >             }
// >           }
// >         }
// >       }
// >     }
// >   }
// > }
```
> :Buttons
> > :Button label=Read More About Changes, url=/docs/change

---

## Under the Hood

A state is constructed with an initial value, a _downstream_ (`Observable<Change>`), and an _upstream_ (`Observer<Change>`).
**Downstream** is basically where changes to this state come from.
**Upstream** is where this state should report its changes.

```ts
// In this example, the value of `s` is updated with a debounce, so
// changes made in rapid succession are supressed.

const echo = new Subject<Change<number>>();
/*!*/const s = new State(3, echo.pipe(debounceTime(300)), echo);

s.subscribe(console.log);

s.value = 4;                           // --> gets supressed
s.value = 10;                          // --> gets through
setTimeout(() => s.value = 15, 310);   // --> gets through
setTimeout(() => s.value = 17, 615);   // --> gets supressed
setTimeout(() => s.value = 32, 710);   // --> gets through

// Logs:
// > 3
// > 10
// > 15
// > 32
```
```ts
// In this example, the value of `s` will remained capped at 10.

const echo = new Subject<Change<number>>();
/*!*/const s = new State(3,
/*!*/  echo.pipe(map(change => ({
/*!*/    ...change,
/*!*/    value: Math.min(change.value!!, 10),
/*!*/  }))),
/*!*/  echo
/*!*/);

s.subscribe(console.log);

s.value = 4;    // --> ok
s.value = 12;   // --> changes to 10
s.value = 9;    // --> ok
s.value++;      // --> ok
s.value++;      // --> caps

// Logs:
// > 3
// > 4
// > 10
// > 9
// > 10
// > 10
```


<br>

When a new value is set on a state, it creates a [`Change`](/docs/change) object and passes it up the
upstream. The state **WILL NOT** immedialtely emit said value. Instead, it trusts that if the value
corresponding to a particular change should be emitted, it will eventually come down the downstream.
Thats how we are able to modify the value of requested changes in above examples.

The upstream and downstream of sub-states is set by the parent state. When a change is issued
to a sub-state, the parent state will pick up the change, add the corresponding sub-key to the
change trace, and send it through its own upstream. When a change comes down its downstream,
it will match it with sub-states using the sub-key specified in the change trace and down-propagate
it accordingly, removing the head of the change trace in the process.

> [touch_app](:Icon) **IMPORTANT**
>
> For performance reasons, a state will change its local `.value` when it is sending changes
> up the upstream, but will not emit them. This means if you want to completely reverse the effect
> of some particular change, you should emit a reverse change object on the downstream in response.
> Simply ignoring a change will cause the state's value to go out of sync with the change history
> and the emission history.
>
> > :Buttons
> > > :Button label=Learn More, url=/docs/change#reverting-changes

> [info](:Icon) **NOTE**
>
> Note that if you want to create a state by providing specific upstream and downstream parameters,
> you need to use `State` class constructor.

<br>

### Post-Tracing

When a change is issued to a non-leaf node, the change trace that is collected is up to that particular point of the
state-tree, and not further down. As a result, a state does not know how to down propagate this change to its
sub-states.

In such a case, the state will actually retrace the change based on given values, adding a complete trace to the
change object, and then routing it accordingly. This operation only happens at the depth that the change was made,
since further down the trace is complete down to leaf-states. Additionally, due to efficient object-tree diffing,
this single operation does not slow down the propagation of change by any means. Checkout the [post on performance](/docs/performance)
to see how in details, but intuitively if the change is not properly traced, then all of the sub-tree would have to
emit it in order to not be lossy (not emit when something is truly changed), which equals to a full sweep of the sub-tree,
which could be used to diff the sub-tree instead.

> :Buttons
> > :Button label=Learn More, url=/docs/performance

> :ToCPrevNext