# Change

States in **RxDeep** keep their values updated using `Change` objects. A `Change` object
has the following properties:

```ts
interface Change<T> {
  value: T | undefined;               // --> the value of the change
  trace?: ChangeTrace<T> | undefined  // --> the trace of the change
}
```

The `.value` property denotes the value that a receiving state should update to,
and the `.trace` property denotes the [trace of the change](#change-trace), relative to current
state's position in the state-tree.

---

## Change Trace

The trace has a tree structure, with leaf nodes denoting changes directly to a state,
and non-leaf nodes denoting changes to some of the properties / indexes of the value of a state.
Each of these nodes also is represented by a trace object. 

When representing a leaf node,
we say the change trace is _leaf_, which means is of the following type:

```ts
type ChangeTraceLeaf<T> = {
  from: T | undefined;         // --> change from this value
  to: T | undefined;           // --> change to this value
}
```

Changing the value of a state, is equivalent of creating a change object with
a leaf trace and sending it up the state's upstream. So this:

```ts
state.value = x;
```

is equivalent of this:

```ts
state.upstream.next({
  value: x,
  trace: { from: state.value, to: x }
});
```

<br>

When not representing a leaf node, the change trace is of the following format:

```ts
// if T is an array:
type ChangeTraceNode<T> = {
  subs: {
    [index: number]: ChangeTrace<T[number]>;
  }
}

// if T is an object:
type ChangeTraceNode<T> = {
  subs: Partial<{
    [K in keyof T]: ChangeTrace<T[K]>;
  }>
}
```
Which means if `T` is an array, then the change trace's property `.subs` is a partial mapping of its indexes to
change traces of its elements, and when its an object, then the change trace's property `.subs` is a partial mapping
of its properties to change trace of those properties:
```ts
import { State } from '../src';

const state = new State({
  x: { y: false },
  z: 3
});

state.sub('x').sub('y').subscribe(console.log);

state.upstream.next({
  value: { x: { y: true }, z: 3 },
/*!*/  trace: {
/*!*/    subs: {
/*!*/      x: {
/*!*/        subs: {
/*!*/          y: { from: false, to: true }
/*!*/        }
/*!*/      }
/*!*/    }
/*!*/  }
});

// Logs:
// > false
// > true
```

---

## Creating Change Objects

You can utilize the `change()` function to create a `Change` object from given value to given value:

```ts
import { change } from 'rxdeep';

const c = change(
  {
    x: { y: false },
    z: 3
  },
  {
    x: { y: true },
    z: 3
  }
);

console.log(c);

// Logs:
// > {
// >   value: { x: { y: true }, z: 3 },
// >   trace: {
// >     subs: {
// >       x: {
// >         subs: {
// >           y: { from: false, to: true }
// >         }
// >       }
// >     }
// >   }
// > }
```

<br>

This allows updating multiple parts of the state-tree at once in an efficient manner,
by creating a change object and sending up a state's upstream instead of manually
changing sub-state values:

```ts
state.upstream.next(change(state.value, _NewValue));
```

<br>

You can also create only a change trace (instead of a full change object) using
the `trace()` function:

```ts
import { trace } from 'rxdeep';

trace(X, Y);
```

---

## Reverting Changes

You can use the `reverse()` function to create a change that would reverse the given change:

```ts
import { reverse, change } from 'rxdeep';

const c = change(X, Y);
const r = reverse(c);
```

<br>

The `reverse()` function is actually used by [`VerifiedState`](/docs/verified-state)
to revert rejected changes on the sub-tree.

---

## Recording Changes

As discussed [here](/docs/state#under-the-hood), each state is basically a downstream of changes
(coming from parent state) and an upstream of changes (the state announcing changes
to parent state). These literally are:

```ts
class State<T> {
  ...
  readonly downstream: Observable<Change<T>>;
  readonly upstream: Observer<Change<T>>;
}
```

With [`Observer`](https://rxjs.dev/guide/observer) and [`Observable`](https://rxjs.dev/guide/observable) being
the primary [RxJS](https://rxjs.dev) concepts. This means you can easily tap into the downstream of any state
and record its changes, or push recorded or manufactured changes to a state's upstream.

However, specifically for recording changes, you should note that **RxDeep** typically avoids creating new
objects and makes a lot of changes in-place. This means that if you are only holding a reference to a particular
change object, its actual properties might get altered. To avoid that, it is highly recommended to copy
the change objects you capture, either via JSON serialization / deserliaziation or using deep copy functions
such as [`lodash.cloneDeep()`](https://lodash.com/docs/4.17.15#cloneDeep).

> :ToCPrevNext