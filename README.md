![banner](/rxdeep-banner.png)


**RxDeep** provides efficient and (mostly) precise reactive state management, in a flexible and unopinionated manner. It uses [RxJS](https://rxjs.dev) to precisely track changes across an object tree. This means you can freely issue changes anywhere on the tree and listen precisely for changes in a particular part of the tree.

- **Efficient**: Minimum computation for tracking changes, minimum memory consumption, minimum subscriptions.
- **Precise** (mostly<sup>*</sup>): Only receive change notification on a particular part of the object tree when it has really changed.
- **Flexible**: Make changes anywhere on the object tree. Have multiple object trees. Bind them together. Distribute object trees across network. etc.
- **Interoprable**: Central objects of **RxDeep** are `State`s, which are simultaenously [`Observable`](https://rxjs.dev/guide/observable)s and [`Observers`](https://rxjs.dev/guide/observer). This provides extreme interop with RxJS or other reactive programming tools/frameworks.
- **Type-Safe**: `State`s have strong type inference and type-safety.
- **Super-Thin**: Extremely thin API surface, extremely small code (and bundle) (min gzipped ~1KB, ~6.5KB with dependencies which is only RxJS).


> _(*)_ **RxDeep** is _mostly precise_ because you can still get some redundant change notifications. Avoiding this would mean deep comparison conducted on the object tree which goes against _efficiency_. If your use case demands absolute precision, then you can compromise efficiency and use deep comparison functions such as [`lodash.isEqual()`](https://lodash.com/docs/2.4.2#isEqual) in **RxDeep** as well.

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
