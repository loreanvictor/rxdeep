![banner](/rxdeep-banner.png)

```bash
npm i rxdeep
```

**RxDeep** provides [fast](https://loreanvictor.github.io/rxdeep/docs/performance) and [precise](https://loreanvictor.github.io/rxdeep/docs/precision) 
reactive state management in JavaScript / TypeScript, in a flexible and unopinionated manner. 
Make changes at any point on the state tree, and listen to changes on particular parts of your tree, 
with a precision emission system that ensures you only get values when something has truly changed.

[👉 Read the docs for more info.](https://loreanvictor.github.io/rxdeep/)

<br><br>

## Example Usage

▷ Create a state object:

```ts
import { State } from 'rxdeep';

const state = new State([ { name: 'John' }, { name: 'Jack' }, { name: 'Jill' } ]);
```

▷ Listen to changes on `'name'` property of index 1 on the list:
```ts
state.sub(1).sub('name').subscribe(console.log);     // --> logs `Jack`
```

▷ You can modify the top-level state:
```ts
state.value = [ { name: 'Julia' }, ...state.value ]; // --> logs `John`, since `John` is index 1 now
```

▷ Or mid-level states:
```ts
state.sub(1).value = { name: 'Josef' };              // --> logs `Josef`
```

▷ Or another sub-state with the same address:
```ts
state.sub(1).sub('name').value = 'Jafet';            // --> logs `Jafet`
```

▷ [RxJS](https://rxjs.dev) interop:
```ts
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

interval(1000)
.pipe(map(i => ({ name: `Jarvis #${i}`})))
.subscribe(state.sub(1));                            // --> logs `Jarvis #0`, `Jarvis #1`, `Jarvis #2`, ...
```
```ts
import { debounceTime } from 'rxjs/operators';

state.sub(1).pipe(debounceTime(1000)).subscribe(console.log); // --> debounces changes for 1 second
```

[👉 Learn more.](https://loreanvictor.github.io/rxdeep/#quick-tour)

<br><br>

## UI Frameworks

**RxDeep** is completely framework agnostic. It is also by no means limited to use on frontend (though that is understandably most common use-case).
Due to it being based on [RxJS](https://rxjs.dev) and having high interop with it, you can easily use it anywhere that you can use RxJS.

<img src="https://reactjs.org/favicon.ico" width="16"/> [Use with React](https://loreanvictor.github.io/rxdeep/#react)

<img src="https://angular.io/assets/images/favicons/favicon.ico" width="16"/> [Use with Angular](https://loreanvictor.github.io/rxdeep/#angular)

<img src="https://vuejs.org/images/logo.png" width="16"/> [Use with Vue.js](https://loreanvictor.github.io/rxdeep/#vuejs)

Because of its precise change emissions, using **RxDeep** in conjuction with popular UI frameworks should actually speed them up (since
it results in less burden for the underlying change detection mechanisms of these frameworks).

[👉 Learn more.](https://loreanvictor.github.io/rxdeep/#ui-frameworks)

<br><br>

## Prior Work

**RxDeep** is not necessarily a replacement / alternative to many existing state management libraries. Typically these libraries provide / enforce some particular patterns which might or might not be useful to a particular application, while **RxDeep** avoids
any such constraints, instead focusing on providing a performant and precise reactive state tree.

Here is how **RxDeep** compares / relates to some of the most well-known state management libraries:

<br>

### [Redux](https://redux.js.org/)

Redux is a particular state management pattern (and a library providing it), while **RxDeep** is not. You actually can implement
the Redux pattern using **RxDeep** state-trees if you so choose to.

Redux as a library doesn't have a concept of precision, i.e. you cannot listen to changes on a particular part of the state-tree in isolation.
This is simply because Redux was designed primarily to be coupled with React, and so delegates figuring actual scope of changes to its Virtual DOM
mechanism.

In contrast, precision is the main feature of **RxDeep**, which means surgically precise changes reach the final UI layer.
With **RxDeep** the scope of each change is computed much more efficiently on the data layer (on the state-tree itself),
instead of it being passed down to some external underlying library.

<br>

### [MobX](https://mobx.js.org/README.html)

**RxDeep** and MobX share some core design philosophies in terms of being unopinionated reactive state management solutions. The main difference
is MobX's implicit approach for automatically deducing state / expression dependencies, while **RxDeep** relies on the power of RxJS for explicitly
defining / manipulating streams.

This brings much more fine grained control and extensibility, at the expense of face-value learnability (as RxJS does seem more complicated to newcomers). 
However in practice MobX syntax (e.g. [computed values](https://mobx.js.org/README.html#computed-values)),
doesn't differ much from the equivalent RxJS syntax (e.g. [the map pipe](https://www.learnrxjs.io/learn-rxjs/operators/transformation/map)). In fact,
MobX's implicit deduction approach [raises implicit constraints and considerations](https://mobx.js.org/refguide/computed-decorator.html), while the explicit approach of RxJS avoids that, and the actual added complexity of RxJS kicks in for operations beyond the scope of MobX.

<br>

### [Focal](https://github.com/grammarly/focal)

Amongst mentioned libraries, **RxDeep** shares most concepts and ideas with Focal. Focal, however, is specifically designed specifically to work with
React, while **RxDeep** is completely framework agnostic. This also means that similar to Redux, precision is not a priority for Focal, while it is
the main focus of **RxDeep**.

<br><br>

[![Build Status](https://badgen.net/travis/loreanvictor/rxdeep?label=build&cache=300&icon=travis)](https://travis-ci.org/loreanvictor/rxdeep)
[![Code Coverage](https://badgen.net/codecov/c/github/loreanvictor/rxdeep?cache=300&icon=codecov)](https://codecov.io/gh/loreanvictor/rxdeep)
[![Minzipped Size](https://badgen.net/bundlephobia/minzip/rxdeep@latest?icon=jsdelivr&color=purple)](https://bundlephobia.com/result?p=rxdeep@latest)
[![NPM Version](https://badgen.net/npm/v/rxdeep?cache=300&icon=npm)](https://www.npmjs.com/package/rxdeep)
[![Code Quality](https://badgen.net/codacy/grade/423972f1e78b453e8e69581ba4abc058?cache=300&icon=codacy)](https://www.codacy.com/manual/loreanvictor/rxdeep)
[![License](https://badgen.net/github/license/loreanvictor/rxdeep?icon=github)](LICENSE)
