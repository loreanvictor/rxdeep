# Precision

**RxDeep** is designed to be extremely precise, meaning `State` objects should emit only when they have a good reason to. To be more
precise (pun unintended), absolute precision means a `State` emits values when and only when one of the following holds:

1. Its value has changed.

2. Its value is directly updated (possibly to the same value).

3. It points to the same address in state-tree as another `State` whose value is directly updated (possibly to the same value).

4. One of its descendent sub-states (a sub-state in its sub-tree) satisfies (2) or (3).

<br>

```ts
const root = new State([
  { name: 'Jack', address: { city: 'Java', country: 'Indonesia' } },
  { name: 'Jafar', address: { city: 'Jiroft', country: 'Iran' } },
]);

const mid1 = root.sub(0);
const mid2A = mid1.sub('address');                     // --> shares tree address with mid2B
const mid2B = root.sub(0).sub('address');              // --> shares tree address with mid2A
const leaf1 = root.sub(0).sub('address').sub('city');  // --> shares tree address with leaf2
const leaf2 = mid2A.sub('city');                       // --> shares tree address with leaf1

leaf1.value = leaf1.value;                             // --> issue update without value change

// As a result:
// > leaf1 will emit (due to (2))
// > leaf2 will emit (due to (3))
// > mid2A, mid2B, mid1, and root will emit (due to (4))
```

<br>

By this definition, **RxDeep** is _mostly_ precise (but not absolutely). It will be outlined in detail why and when it would
become imprecise and how it could be customized for further precision later on this post. But generally speaking, 
the precision it provides out of the box suffices for most common use-cases, and further precision would simply bring about
unwaranted complexity / performance overhead.

While there are solutions which would provide absolute precision with similar
_worst-case performance_, they would bring about much further complexity to **RxDeep** while also still having a negative impact
on typical case performance.

---

## Lossiness

A _Loss_ is when a `State` should emit (according to the outlined criteria) but it doesn't. **RxDeep** is not lossy by default,
only **IF** [object immutability is respected](/docs/state#object-immutability). Simply put, you must not change the value of a `State`
without changing its reference, as otherwise there is no mechanism for **RxDeep** to pickup those changes and distinguish
what has changed.

> :Buttons
> > :Button label=Learn More, url=/docs/state#object-immutability

---

## Redundancy

_Redundancy_ refers to situations when a `State` emits without a good reason for doing so (i.e. none of the outline criteria hold up).
**RxDeep** almost has no redundancy, meaning a `State` typically does not emit values without a good reason. This is 100% true
for any `State` (or sub-state) holding a _raw_ value (i.e. `number | boolean | string`), so leaf-states are always absolutely
precise.

There are, however, situations where upper-level states might emit values redundantly. This specifically happens when a state
receives [trace-less changes](/docs/state#trace-less-changes). In such a case, the state does not have any information on which of
its sub-states would be affected by the received change. To resolve the issue, it conducts equality checks to assess whether a change
would affect a particular sub-state (and hence the sub-state should receive the change). For maintaining performance, `===` operator
is used as the default equality check, which, for complex values (objects and arrays) returns `false` when the reference of the
objects vary, even if the actual content is the same.

```ts
const state = new State({ 
  x: {
    y: 2
  },
  z: 4
});

state.sub('x').subscribe(console.log);
state.value = { 
  x: {
    y: 2
  },
  z: 3
};

// Logs:
// > { y: 2 }
// > { y: 2 }
```

Trace-less changes occur when a non-leaf state's value is updated directly. False equality checks occur
when a sub-tree of the object tree of the set value is the same but has a different reference. This means
in **RxDeep**, a `State` does redundant emissions when and only when all the following hold:

- It holds complex values (objects, arrays)

- The change is initiated at a state-tree address of lower depth

- The change includes an identical-by value version of the state's value with a different reference

<br>

So in the example demonstrated above, the redundant emission wouldn't have occured if:

- We were listening to a leaf state:

```ts
state.sub('x').sub('y').subscribe(console.log);
```

- Or the change was issued to a higher-depth node:

```ts
state.sub('x').sub('z').value = 4;
```

- Or the corresponding part of the state-tree wasn't copied with a different reference:

```ts
state.value = { ...state.value, z: 4 };
```

<br>

For most common use-cases, it is rather easy to either issue changes at leaf states, maintain
the reference of unchanged parts of the state-tree when changing it from higher up in the tree,
or be redundancy tolerant when subscribing to non-leaf states.

If however, the requirements of your particular use-case necessitates absolute precision for 
aforementioned mutation strategies, there are ways of achieving that in **RxDeep**, though
all acompany some performance penalty:

<br>

### Deep Equality Checks

The easiest method is using deep equality checks, via functions such as [`lodash.isEqual()`](https://lodash.com/docs/4.17.15#isEqual).
For any sub-state you create, you can provide your own custom equality check, which
will then be utilized when deciding whether a particular trace-less change does affect that particular
sub-state:

```ts
/*!*/import { isEqual } from lodash;

const state = new State({ 
  x: {
    y: 2
  },
  z: 4
});

/*!*/state.sub('x', isEqual).subscribe(console.log);
state.value = { 
  x: {
    y: 2
  },
  z: 3
};

// Logs:
// > { y: 2 }
```

Deep equality checks are obviously slower than reference checks. Such algorithms typically have a
time-complexity of [\Omicron(n\log(n))](:Formula) for a [typical](/docs/performance) object-tree
with [n](:Formula) nodes (or [\Omicron(nd)](:Formula) for an arbitrary object tree of [n](:Formula) leafs
and max-depth [d](:Formula)).

This means if ALL of your sub-states were using deep equality checks instead of reference checks,
then time complexity of change propagation for changes made to arbitrary nodes of the tree
at depth [\delta](:Formula) denoting a sub-tree of [n_{\delta}](:Formula) leafs would be given by:

> :Formula
>
> \Omicron(\delta + n_{\delta}^2\log^2(n_{\delta}))

Which peaks on changes to root state with [\Omicron(n^2\log^2(n))](:Formula). \
Compared to [default complexity of](/docs/performance#change-in-arbitrary-nodes):

> :Formula
>
> \Omicron(\log(n) + (n_{\delta} - 1)\log(n_{\delta}))

Peaking at [\Omicron(n\log(n))](:Formula) for changes to root state, this might be a noticeable
performance penalty for really large state trees. As a result, it is highly recommended
to use deep equality checks on select points on the state-tree, standing on increased but not yet
absolute precision for lesser performance costs.

<br>

### Post-Tracing Changes

Instead of conducting extensive deep equality checks, you could instead automatically
trace the changes that would result from a given change value and apply them instead of
a single trace-less change. This is basically emulating changes as if they were conducted
on the corresponding leaf states:

```ts
// instead of this:
state.value = { ... }

// do something like this:
state.upstream.next({
  from: 4, to: 3,
  value: { z: 3, x: { y: 2 } },
  trace: {
    head: { sub: 'z' }
  }
});
```

In worst-case scenario (conducting changes to root-state), this is equivalent of conducting
one deep equality check of the whole state-tree generating necessary _post-traced_ changes, 
with complexity of [\Omicron(n\log(n))](:Formula),
and submitting maximum [n](:Formula) leaf changes, [each with complexity of](docs/performance#change-in-leaf-nodes)
[\Omicron(\log(n))](:Formula), which in total yields a worst-case complexity of [\Omicron(n\log(n))](:Formula),
matching the minimum worst-case complexity of issuing changes on root states. 

Note that this approach requires writing your own custom deep equality check function that would 
produce aforementioned change objects along the way.

For an arbitrary node at depth [\delta](:Formula), this approach yields the following time-complexity:

> :Formula
>
> \Omicron(n_{\delta}(\log(n) + \log(n_{\delta})))

It is possible to even achieve better typical-case performance. You could create a custom `State` proxy
that upon receiving untraced changes from the downstream, post-traces them across all active sub-keys,
and then emits generated stream of changes for each sub-state to its downstream, which would yield
complexity of:

> :Formula
>
> \Omicron(\log(n) + n_{\delta}\log(n_{\delta}))

which is on par with worst-case complexity of issuing changes to such a node on the default case.

> [touch_app](:Icon) **NOTE**
>
> Despite the worst-case scenario of the latest approach (proxy _precision_ states) has the same _order_ of
> performance as the default approach, it is still slower (specifically on a typical case) due to it always running
> partial deep equality checks on untraced-changes.
>
> In practice, its almost always choice to be precise with change references and mutation points
> or to be redundancy tolerant on non-leaf states. In pretty rare cases, utilizing a few deep equality
> checks on a sparse collection of sub-states should give any application all necessary precision.
>
> This means the extreme rarity of cases that do require solutions such as post-tracing does not warrant
> overhead complexity / performance loss of offering the solution as part of **RxDeep**. However,
> on the astronomical chance that someone does find need for that, this section should act as a proper guide
> of implementing such a solution.

> :ToCPrevNext