# Precision

**RxDeep** is designed to be extremely precise, meaning `State` objects should emit only when they have a good reason to. To be more
precise (pun unintended), absolute precision means a `State` emits values when and only when one of the following holds:

1. Its value has changed.

1. Its value is directly updated (possibly to the same value).

1. It points to the same address in state-tree as another `State` whose value is directly updated (possibly to the same value).

1. One of its descendent sub-states (a sub-state in its sub-tree) satisfies (2) or (3).

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

By this definition **RxDeep** is _absolutely precise_ if [object immutabilty](/docs/state#object-immutability)
is respected and objects passed to it are of [plain (non-circular) JavaScript objects](/docs/state#value-types).

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
**RxDeep** has no redundancy, meaning a `State` does not emit values without a good reason (without one of the aforementioned
criteria being true).

This is due to the fact that leaf-changes are fully traced and delivered only to affected sub-states, and arbitrary
changes are traced until their issuing depth and then [post-traced](/docs/performance#change-in-arbitrary-nodes) so that
the change trace is complete until leafs of the state-tree, allowing for precise propagation of the change.

---

## Performance

As discussed [here](/docs/performance), a leaf-change has [\Omicron(\log(n))](:Formula) complexity and
an arbitrary change at depth [\delta](:Formula) and above a sub-tree of [n_{\delta}](:Formula) nodes 
has [\Omicron(\log(n) + n_{\delta}\log(n_{\delta}))](:Formula) time complexity. For most day to day use cases
both of these are more than fast enough. 

However, in special cases you might need that additional performance. As (also) discussed [here](/docs/performance),
if the whole sub-tree needs to change, you need minimum of [\Omicron(\log(n) + n_{\delta}\log(n_{\delta}))](:Formula)
operations, as you need that many emissions to not be lossy. However, if your change affects a bounded number of leaf
states, for example [k](:Formula) leaf states, then the minimum number of operations is given by:

> :Formula
>
> \Omicron(\log(n) + (k - 1)\log(n_{\delta})) =
> \Omicron(\log(n))

A simple method of achieving that performance is identifying the [k](:Formula) leaf nodes and applying change
to them. Time-complexity of this solution is given by:

> :Formula
>
> \Omicron(k\log(n)) = \Omicron(\log(n))

However, this also results in [k](:Formula) emissions by all affected states (e.g. the root state will also
emit [k](:Formula) times).

```ts
const company = new State({
  teams: [{
    people: [{name: 'Jack', age: 42}, {name: 'Jill', age: 31}],
    name: 'Awesome Team',
  }, ...]
});

//
// Find all affected leaf changes and apply changes directly to them.
//
company.sub('teams').sub(0).sub('people').sub(0).sub('name').value = 'Jafar';
company.sub('teams').sub(0).sub('name').value = 'Pro Team';
```

<br>

A more efficient solution would be to:

1. Identify the top-most common ancestor of all affected leaf nodes,

1. Apply changes respecting maximal object immutability.

```ts
const company = new State({
  teams: [{
    people: [{name: 'Jack', age: 42}, {name: 'Jill', age: 31}],
    name: 'Awesome Team',
  }, ...]
});

//
// This is the top-most common ancestor:
//
const target = company.sub('teams').sub(0);

//
// Now lets apply changes with maximal object immutability:
//
target.value = {
  ...target.value,
  name: 'Pro Team',
  people: [
    {
      ...target.value.people[0],
      name: 'Jafar'
    }
    ...target.value.people.slice(1),
  ]
}
```

_Object immutability_ means that the reference of an object is changed **IF** its value has changed. \
_Maximal object immutability_ means the reference of an object is changed **IF AND ONLY IF** its value has changed.

The post-tracing algorithm of **RxDeep** makes quick reference checks to rule out identical objects, so when
making a change respecting maximal object immutability, and with the aforementioned criteria holding (constant [k](:Formula) leafs
are actual subjects of the change), post-tracing consumes [\Omicron(k\log(n_{\delta}))](:Formula) operations,
so the complexity of overall change propagation is given by:

> :Formula
>
> \Omicron(log(n) + (k - 1)log(n_{\delta})) = \Omicron(log(n))

Additionally, with this solution affected states emit exactly once.

> :ToCPrevNext