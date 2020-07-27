> :Banner


Fast and precise reactive state management for JavaScript / TypeScript, in a flexible and unopinionated manner. Make changes
to any part of your state tree, track changes, subscribe to specific node/sub-tree, track changes by entity keys, verify changes,
etc.

```bash
npm i rxdeep
```

---

# Quick Tour

Create a [state](/docs/state):

```ts
import { state } from 'rxdeep';
const s = state([ { name: 'John' }, { name: 'Jack' }, { name: 'Jill' } ]);
```

<br>

Listen to a [sub-state](/docs/state#sub-states):

```ts
s.sub(1).sub('name').subscribe(console.log); // --> subscribes to property `name` of object at index 1 of the array
```

<br>

Modify root state:
```ts
s.value = [ { name: 'Julia' }, ...s.value ]; // --> logs `John`, since `John` is index 1 now
```

... or mid-level states:

```ts
s.sub(1).value = { name: 'Josef' };              // --> logs `Josef`
```

... or leaf-states on the same address:
```ts
s.sub(1).sub('name').value = 'Jafet';            // --> logs `Jafet`
```

<br>

[Verify changes](/docs/verified-state) to the state:

```ts
import { state, verified } from 'rxdeep';

const v = verified(state(12), change => change.from < change.to); // --> only increasing numbers

v.subscribe(console.log);

v.value = 10; // --> logs 12
v.value = 14; // --> logs 14
v.value = 9;  // --> logs 14
v.value = 13; // --> logs 14
v.value = 15; // --> logs 15
```

<br>

A state is an [`Observer`](https://rxjs.dev/guide/observer):

```ts
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

interval(1000)
.pipe(map(i => ({ name: `Jarvis #${i}`})))
.subscribe(s.sub(1));                            // --> logs `Jarvis #0`, `Jarvis #1`, `Jarvis #2`, ...
```

<br>

A state is an [`Observable`](https://rxjs.dev/guide/observable):

```ts
import { debounceTime } from 'rxjs/operators';

s.sub(1).pipe(debounceTime(1000)).subscribe(console.log); // --> debounces changes for 1 second
```

<br>

[Track keys instead of indexes](/docs/keyed-state):

```ts
import { state, keyed } from 'rxdeep';

const k = keyed(state(
    [{ id: 101, name: 'Jill' }, { id: 102, name: 'Jack' }]
  ), p => p.id
);

k.key(101).sub('name').subscribe(console.log);     // --> logs `Jill`

k.value = [k.value[1], k.value[0]];                // --> no log
k.sub(1).sub('name').value = 'John';               // --> logs `John`
```

<br>

Track index of a specific key:

```ts
k.index(101).subscribe(console.log);      // --> logs 0, 1
```

---

# UI Frameworks

**RxDeep** is not by any means limited to frontend use. However most backend designs
are state-less or with dedicated services managing states, which means its most common use-case is in the frontend.

**RxDeep** is also completely framework agnostic, with a precise emission system that allows
surgical updates even if you are using pure JavaScript without the need for a Virtual DOM, passive change detection, etc.

These precise emissions also should reduce the change detection / DOM reconcilliation load on
most popular frameworks, as re-renders can be requested only when something has truly changed, and specifically
on the DOM sub-tree that have really changed.

<br>

## ![](https://reactjs.org/favicon.ico) React

You can use [RxJS-hooks](https://github.com/LeetCode-OpenSource/rxjs-hooks) for fetching and rendering states in [React](https://reactjs.org/) components.
This _should_ also result in better performance as it should reduce number of redundant tree diffs conducted by React.

```tsx
/*!*/import { useObservable } from 'rxjs-hooks';

const s = state(...);

function MyComponent(...) {
/*!*/  const value = useObservable(() => s.sub('something')) || {};
/*!*/  return <div>{value.property}</div>
}
```
> :Buttons
> > :Button label=Real World Example, url=https://stackblitz.com/edit/react-rxdeep

<br>

## ![](https://angular.io/assets/images/favicons/favicon.ico) Angular

You can use [Angular](https://angular.io/)'s [async pipe](https://angular.io/guide/observables-in-angular) to render states or
sub-states:

```html
<div>{{s | async}}</div>
<div>{{s.sub('property') | async}}</div>
```

You can also utilize [Angular](https://angular.io/)'s `[(ngModel)]` syntax to bind states to inputs:

```html
<input [(ngModel)]="s.sub('property').value" type="text" />
```

> :Buttons
> > :Button label=Real World Example, url=https://stackblitz.com/edit/angular-rxdeep

<br>

## ![](https://vuejs.org/images/logo.png) Vue.js

You can use [vue-rx](https://github.com/vuejs/vue-rx) to render states in your Vue apps, which should (I don't know if it would)
yield similar performance improvements:

```ts
/*!*/import VueRx from 'vue-rx';
/*!*/Vue.use(VueRx);

new Vue({
  el: '#app',
/*!*/  subscriptions: {
/*!*/    s,
/*!*/    name: s.sub('name')
/*!*/  }
});
```

```html
<div>{{ s }}</div>
<div>{{ name }}</div>
```

You can use `v-model` syntax to directly bind inputs and states:

```ts
new Vue({
  ...
  subscriptions: { ... },
/*!*/  data: { state }
})
```
```html
/*!*/<input type="text" v-model="s.sub('name').value"/>
```

> :Buttons
> > :Button label=Real World Example, url=https://stackblitz.com/edit/vue-rxdeep

<br>

## ![](https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg) Pure JavaScript

As mentioned above, **RxDeep** provides precision change emission, which means you can directly listen to the
state changes and surgically update DOM tree accordingly:

```js
s.sub('name').subscribe(name => nameElement.textContent = name);
```

Specifically, you can utilize `KeyedState` (`keyed()`) and its `.changes()` method to receive [detailed
array changes](#change-history) that enable you to precisely modify dynamic DOM trees based on collections
and arrays.

> :Buttons
> > :Button label=Real World Example, url=https://stackblitz.com/edit/vanilla-rxdeep

---

# Features

Here are the design goals/features of **RxDeep**, setting aside from other reactive state management libraries:

<br>

## Performance

**RxDeep** is extremely fast and light-weight in terms of memory consumption and computation, utilizing pure (multicasted) mappings
on the root of the state-tree for reading/writing on the whole tree.

Note that user-provided functions are utilized during particular operations, which might result in some loss of performance
if said functions aren't fast enough.

> :Buttons
> > :Button label=Learn More, url=/docs/performance

<br>

## Precision

**RxDeep** enables subscribing to a particular sub-state of the state tree. These sub-states only
emit values when the value of the sub-state has changed, or when there is a change issued directly
to them, a state with the same address, or one of their descendants. 

This means you could subscribe heavy-weight operations (such as DOM re-rendering)
on sub-states.


> :Buttons
> > :Button label=Learn More, url=/docs/precision

<br>

## Flexibility

**RxDeep**, unlike libraries such as [Redux](https://redux.js.org/), doesn't require your changes to be funneled
through specific channels. You can freely issue changes to any part of the state-tree, so for example you can only
expose relevant parts of the state-tree to modules/components.

The only limitations (similar to [Redux](https://redux.js.org/)) are that you need to 
keep state as plain JavaScript objects (`number | string | boolean | undefined | Date`, or arrays and plain objects
of these values), and respect object immutability.
Basically do not change an object without changing its reference.

<br>

<span style="color: #fa163f">**DON'T:**</span>

```ts
/*~*/s.value.push(x)/*~*/;                   // --> WRONG!
/*~*/s.value.x = y/*~*/;                     // --> WRONG!
```

<span style="color: #27aa80">**DO:**</span>

```ts
s.value = s.value.concat(x);   // --> CORRECT!
s.sub('x').value = y;               // --> CORRECT!
s.value = { ...s.value, x: y } // --> CORRECT!
```

> :Buttons
> > :Button label=Learn More, url=/docs/state#object-immutability

<br>

## Change History

State tree is kept in sync by tracking changes (via `Change` objects). This simply means you can track changes
directly, record them, replay them, etc.

```ts
s.downstream.subscribe(console.log);    // --> Log changes
s.sub(1).sub('name').value = 'Dude';

// This object will be logged:
{ 
  value: [{...}, { name: 'Dude', ... }, ...],
  trace: {
    subs: {
      1: {
        subs: {
          name: { from: ..., to: 'Dude' }
        }
      }
    }
  }
}
```

> :Buttons
> > :Button label=Learn More, url=/docs/change

Furthermore, keyed states provide detailed array changes, i.e. additions/deletions on particular indexes,
or items being moved from one index to another.

```ts
const k = keyed(state(
    [{ id: 101, name: 'Jack' }, { id: 102, name: 'Jill' }]
  ), p => p.id
);

k.changes().subscribe(console.log);        // --> Log changes

k.value = [
  { id: 102, name: 'Jill' },
  { id: 101, name: 'Jack' },
  { id: 103, name: 'Jafet' }
];

// This object will be logged:
{
  additions: [{
    index: 2,
    item: { id: 103, name: 'Jafet' }
  }],
  deletions:[],
  moves:[
    { oldIndex: 0, newIndex:1, item: { id: 101, name: 'Jack'} },
    { oldIndex: 1, newIndex:0, item: { id: 102, name: 'Jill'} }
  ]
}
```

> :Buttons
> > :Button label=Learn More, url=/docs/keyed-state#detailed-array-changes

<br>

## Change Verification

You can verify changes occuring on the state-tree (or on a particular sub-tree). **RxDeep** will utilize
the change history to revert unverified changes on affected sub-states:

```ts
const v = verified(
  state([{ val: 21 }, { val: 22 }, { val: 23 }]),
  change => change.value.reduce((t, i) => t + i.val) % 2 === 0
);

v.sub(0).sub('val').value = 22; // --> change denied, local changes automatically reverted
v.sub(0).sub('val').value = 23; // --> change accepted and routed through the state-tree
```

> :Buttons
> > :Button label=Learn More, url=/docs/verified-state

<br>

## Extensibility

An **RxDeep** state is an [RxJS](https://rxjs.dev) [`Observable`](https://rxjs.dev/guide/observable) 
and an [`Observer`](https://rxjs.dev/guide/observer), providing great interoperability with lots of existing tools.

Additionally, each state basically relies on a downstream observable and an upstream observer for keeping track of changes
and keeping data in sync. By providing custom downstream / upstreams, you can greatly extend **RxDeep** for use
in any particular use case (for example you can easily distribute state-trees across a network).

> :Buttons
> > :Button url=/docs/state#under-the-hood, label=Learn More

<br>

## Thin and Type Safe

**RxDeep** has a bundle size of `~8Kb`, which includes its only dependency [RxJS](https://rxjs.dev) (tree-shaken).
Since [RxJS](https://rxjs.dev) is already included in lots of frontend bundles, contribution of **RxDeep** to your
bundle size will most probably be under `2Kb` (which is the raw library without dependencies).

This small size is due to extremely thin API surface of the library, focusing only on providing deep state management
and minor utilities for that. This in turn makes **RxDeep** pretty easy to learn.

**RxDeep** is written in [TypeScript](https://www.typescriptlang.org/) with detailed type annotations, 
which should greatly improve development experience even if you use it in JavaScript (error highlighting, autocompletes, etc).

> :MetaOverride target=description
>
> Reactive state-management using RxJS. Manage complex state-trees in a fast, precise and 
> flexible manner. Monitor changes at any part of the state-tree, issue changes at any part of
> the state tree, verify changes, record them, replay them, distribute your state tree across network, etc.

> :ToCPrevNext