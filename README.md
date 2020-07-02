![banner](/rxdeep-banner.png)

[![Build Status](https://badgen.net/travis/loreanvictor/rxdeep?label=build&cache=300&icon=travis)](https://travis-ci.org/loreanvictor/rxdeep)
[![Code Coverage](https://badgen.net/codecov/c/github/loreanvictor/rxdeep?cache=300&icon=codecov)](https://codecov.io/gh/loreanvictor/rxdeep)
[![Minzipped Size](https://badgen.net/bundlephobia/minzip/rxdeep@latest?icon=jsdelivr&color=purple)](https://bundlephobia.com/result?p=rxdeep@latest)
[![NPM Version](https://badgen.net/npm/v/rxdeep?cache=300&icon=npm)](https://www.npmjs.com/package/rxdeep)
[![Code Quality](https://badgen.net/codacy/grade/423972f1e78b453e8e69581ba4abc058?cache=300&icon=codacy)](https://www.codacy.com/manual/loreanvictor/rxdeep)
[![License](https://badgen.net/github/license/loreanvictor/rxdeep?icon=github)](LICENSE)

**RxDeep** provides fast and (mostly) precise reactive state management, in a flexible and unopinionated manner. It uses [RxJS](https://rxjs.dev) to precisely track changes across an object tree. This means you can freely issue changes anywhere on the tree and listen precisely for changes in a particular part of the tree.

- **Fast**: Minimum computation, memory allocation, subscriptions, etc.
- **Precise**<sup>*</sup>: Changes tracked automatically across object-tree and emitted only on affected nodes.
- **Flexible**: Make changes anywhere on the object tree. Have multiple object trees. Your state, your way.
- **Change History**: State is tracked through `Change` objects, so you can record changes, replay them, etc.
- **Interoprable**: Each node of the object-tree (called a `State`) is simply an [`Observable`](https://rxjs.dev/guide/observable) and an [`Observer`](https://rxjs.dev/guide/observer) at the same time, so full interop with anything working with observables and observers.
- **Extensible**: Each `State` is connected to the rest of the object-tree by a downstream (`Observable<Change>`) and an upstream (`Observer<Change>`). Provide your own upstream/downstream, tap into them to monitor state changes, create state trees distributed across websockets, etc.
- **Super-Thin**: Extremely thin API surface, extremely small code (and bundle) (min gzipped ~1KB, ~6.5KB with RxJS).
- **Type-Safe**: `State`s have strong type inference and type-safety.


> (*) **RxDeep** is _mostly precise_ because you might sometimes get some redundant change notifications. Avoiding this would mean deep comparison conducted on the object tree which has serious performance costs. Most of the time the precision provided by **RxDeep** by default should be more than enough. However it supports providing custom equality checks for change propagation such as [`lodash.isEqual()`](https://lodash.com/docs/2.4.2#isEqual), for situations where you would want to trade some performance for absolute precision.

<br>

**Example**:

```ts
import { State } from 'rxdeep';

// create a state object
const state = new State([ { name: 'John' }, { name: 'Jack' }, { name: 'Jill' } ]);

// listen to changes on `'name'` property of index 1 on the list.
state.sub(1).sub('name').subscribe(console.log);     // --> logs `Jack`

// You can modify the top-level state
state.value = [ { name: 'Julia' }, ...state.value ]; // --> logs `John`, since `John` is index 1 now

// ... or mid-level states
state.sub(1).value = { name: 'Josef' };              // --> logs `Josef`

// ... or another sub-state with the same address
state.sub(1).sub('name').value = 'Jafet';            // --> logs `Jafet`

// Sub-states are observers as well, so go crazy
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

interval(1000)
.pipe(map(i => ({ name: `Jarvis #${i}`})))
.subscribe(state.sub(1));                            // --> logs `Jarvis #0`, `Jarvis #1`, `Jarvis #2`, ...
```

---

**RxDeep** is still pretty early stage. DO NOT USE ON PRODUCTION, and email me (or open an issue) if you are interested, have questions, want to contribute, etc.
