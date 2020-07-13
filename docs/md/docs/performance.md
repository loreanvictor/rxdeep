# Performance

To obtain a proper analysis of **RxDeep**'s performance (and generally complexity of the problem it tries to solve),
we need to establish a few definitions first. Assume we have a state tree looking like this:

```ts
{                                 // --> root of the state-tree
  name: 'Cool Team',              // --> a leaf node
  people: [                       // --> a middle node
    {                             // --> a middle node
      name: 'Jerome',             // --> a leaf node
      age: 42,                    // --> a leaf node
      address: {                  // --> a middle node
        city: 'Jersey',           // --> a leaf node
        country: 'Jibuti'         // --> a leaf node
      },
    },
    {                             // --> a middle node
      name: 'Jacqueline',         // --> a leaf node
      age: 27,                    // --> a leaf node
      address: {                  // --> a middle node
        city: 'Jakarta',          // --> a leaf node
        country: 'Jamaica'        // --> a leaf node
      }
    }
  ]
}
```

Two parameters of this tree are particularly important to analyzing complexity of the reactive change propagation
problem:

- Number of leaf nodes, in this case 9 (name of the team, name and age of each person, and the city and country of their address).
We denote this number by letter [n](:Formula).

- Depth of the tree, in this case 4 (you need 4 property resolutions to get from the root of the object to the deepest leaf node).
We denote this number by letter [d](:Formula).

We will express complexity and performance of algorithms using the [_Big O notation_](https://en.wikipedia.org/wiki/Big_O_notation),
which is displayed with [\Omicron(f(n, d))](:Formula) syntax, since the complexity is always expressed as a function of [n](:Formula)
and [d](:Formula).

Parameters [n](:Formula) and [d](:Formula) are independent. State-tree can be an array with a thousand strings, where we would have
[n](:Formula) = 1000, [d](:Formula) = 1, or it can be a single string nested in 1000 arrays (`[[[...['x']...]]]`), where we would have
[n](:Formula) = 1, [d](:Formula) = 1000. We say a state-tree is _typical_, if [d](:Formula) is in the order of [\log(n)](:Formula), i.e. 

> :Formula
>
> \Omicron(d) = \Omicron(\log(n)).

In practice, most of the time you have lower bounds and upper bounds on average number of childs each node of the state-tree has, which would mean
that in practice most state-trees are typical.

---

## Change in Leaf Nodes

For changes in a single leaf node, the node itself should emit a change, its parent should emit a change, the parent of its parent
should emit a change, and all the path from the node to the root state should emit changes:

```ts
const root = [{address: { city: 'Jakarta' }}];
const mid1 = root.sub(0);
const mid2 = mid1.sub('address');
const leaf = mid2.sub('city');

leaf.value = 'Jacksonville';

// Now leaf, mid2, mid1 and root must emit changes.
```

This means that each change in a leaf node must result in at least [\Omicron(d)](:Formula) operations, independent of the underlying
algorithm. For a typical state-tree, that would be [\Omicron(\log(n))](:Formula) operations.

For each such change, **RxDeep** performs one assignment by reference (to update local state's value) without emission,
and constructs a trace object, passing the change with the trace object to the upstream. This would result in [\Omicron(d)](:Formula)
operations until the change reaches the root of the state-tree (alongside [\Omicron(d)](:Formula) trace objects).

The root state then typically bounces the change back. Each recepient state will emit the new value, and perform equality
checks between all of its generated sub-keys and head of received trace. On match, it will extract the downstream trace
and pass down the resulting change to the matching sub-key. Assuming an average number of [k](:Formula) sub-states per state,
this yields [\Omicron(kd)](:Formula) equality checks and [\Omicron(d)](:Formula) emissions until the change is fully
propagated across the state-tree.

Since [k](:Formula) is a constant, this overall yields [\Omicron(d)](:Formula) operations to fully propagate each change across
the state-tree, [\Omicron(\log(n))](:Formula) for typical state-trees, matching the lower complexity bound for any solution.

---

## Change in Arbitrary Nodes

Change in an arbitrary node might result in a change in all of the nodes of a state-tree, which subsequently
should result in [\Omicron(nd)](:Formula) change emissions ([\Omicron(n \log(n))](:Formula) for a typical state-tree).

More specifically, if a change is issued at a node at depth [\delta](:Formula), with a sub-tree of [n_{\delta}](:Formula)
nodes, then nodes on the path from the changed node up to the root should emit a change ([\Omicron(\delta)](:Formula) emissions),
and possibly the whole sub-tree under the changed node should also emit ([\Omicron((d - \delta)n_{\delta})](:Formula) emissions).
Overall this would amount to [\Omicron(\delta + (d - \delta)n_{\delta})](:Formula) operations. Assuming a typical tree,
we would have:

> :Formula
>
> \Omicron(\log(n_{\delta})) = \Omicron(\log(n) - \delta)

Which would give the minimum number of operations for change at depth [\delta](:Formula) at:

> :Formula
>
> \Omicron(\log(n) + (n_{\delta} - 1)\log(n_{\delta})) =
> \Omicron(\delta + (d - \delta)2^{d - \delta})

Maximized on [\delta = 0](:Formula) or [n_{\delta} = n](:Formula), i.e. on the root state,
and minimized on [\delta = d](:Formula) or [n_{\delta} = 1](:Formula), i.e. a leaf state.

<br>

```ts
const root = [{address: { city: 'Jakarta', country: 'Indonesia' }}];
const mid1 = root.sub(0);
const mid2 = mid1.sub('address');
const leaf1 = mid2.sub('city');
const leaf2 = mid2.sub('country');

mid2.value = { city: 'Jambi', country: 'Indonesia' };

// due to this change, mid2 itself, mid1, root and leaf1 should re-emit.
// however the value for leaf2 hasn't changed and it shall not re-emit.
```

From the changed state upwards (towards the root), **RxDeep** behaves as before as it can fully
track changes, resulting in [\Omicron(\delta)](:Formula) or [\Omicron(\log(n) - \log(n_{\delta}))](:Formula)
operations (the latter holding for a typical state-tree).

For downward propagation, the state conducts a sweep of its sub-tree and complete the trace. This is called
_post-tracing_, and in worst-case scenario it requires [\Omicron(n_{\delta}\log(n_{\delta}))](:Formula) operations.
After that changes can be down-propagated precisely, and since in worst-case all of the sub-tree nodes would need
to emit due to changes, adding another [\Omicron(n_{\delta}\log(n_{\delta}))](:Formula) emissions.

This means in total the change propagation mechanism requires [\Omicron(\log(n) + (2n_{\delta} - 1)\log(n_{\delta}))](:Formula)
operations, which is of the same order at the minimum calculated above, i.e.

> :Formula
>
> \Omicron(\log(n) + n_{\delta}\log(n_{\delta}))

---

## Keyed States

A [`Keyed State`](/docs/keyed-state) will track changes based on mapping of objects of it
content array to particular keys using a given key function instead of using indexes. While doing
so, it also produces detailed `ListChange` objects outlining exactly how the array has changed
in terms of additions, deletions and items being moved from a particular index to another.

For doing so, `KeyedState` conducts [\Omicron(n)](:Formula) operations, also maintaining a key map
of [\Omicron(n)](:Formula) size holding quick-access references by keys to elements producing
those keys for the previous value. Here, [n](:Formula) denotes not the number of leafs of the whole
state-tree but the number of elements of the array assigned to a particular `KeyedState`.

For each change to the array, all elements are mapped once to their corresponding keys using
the provided key function. The key function is supposed to be extremely light in nature, fetching
a particular parameter of each element or doing a simple and fast computation:

```ts
// a key function should be something in lines of these:
p => p.id;
n => n % 17;
```

If the key function does not have complexity of [\Omicron(1)](:Formula), say [\Omicron(\lambda)](:Formula)
for some non-constant [\lambda](:Formula), then upon each change the `KeyedState` would be conducting
[\Omicron(\lambda n)](:Formula) operations.

When indexed items in the array are moved around, the `KeyedState` also conducts partial retracing
to generate a change trace invariant to its keys. This does not involve invoking the key function,
but worst-case can add [\Omicron(n\log(n))](:Formula) operations to change propagation
process. 

This worst case only occurs when all of the items of the array are shifted and their corresponding
values are also mutated all the way to the leafs. In a typical case when the items of the array are
moved without being modified themselves, then this lowers to [\Omicron(n)](:Formula) operations.

> :ToCPrevNext