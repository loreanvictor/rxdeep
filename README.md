![banner](/rxdeep-banner.png)

```bash
npm i rxdeep
```

**RxDeep** provides fast and precise[<sup>*</sup>](#precision) reactive state management, in a flexible and unopinionated manner. Make changes at any point on the state tree, and listen to changes on particular parts of your tree, with a precision emission system that ensures you only get values when something has truly changed[<sup>*</sup>](#precision).

[👉 Read the docs for more info.](https://loreanvictor.github.io/rxdeep/)

<br><br>

### Example Usage

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

[👉 Learn more.](https://loreanvictor.github.io/rxdeep/#quick-tour)

<br><br>

### UI Frameworks

**RxDeep** is completely framework agnostic. It is also by no means limited to use on frontend (though that is understandably most common use-case).
Due to it being based on [RxJS](https://rxjs.dev) and having high interop with it, you can easily use it anywhere that you can use RxJS.

<img src="https://reactjs.org/favicon.ico" width="16"/> [Use with React](https://loreanvictor.github.io/rxdeep/#react)

<img src="https://angular.io/assets/images/favicons/favicon.ico" width="16"/> [Use with Angular](https://loreanvictor.github.io/rxdeep/#angular)

<img src="https://vuejs.org/images/logo.png" width="16"/> [Use with Vue.js](https://loreanvictor.github.io/rxdeep/#vuejs)

Because of its precise change emissions, using **RxDeep** in conjuction with popular UI frameworks should actually speed them up (since
it results in less burden for the underlying change detection mechanisms of these frameworks).

[👉 Learn more.](https://loreanvictor.github.io/rxdeep/#ui-frameworks)

<br><br>

### Precision

Precision means that `State`s (nodes on the state-tree) only emit values when there is a change to them (or when a change is directly issued
to them or some other `State` representing the same address on the state-tree). **RxDeep** is as precise as it can get without sacrificing performance.
This precision is sufficient for most common use-cases. However, if you need absolutely precise emissions on a particular use-case, 
it allows you to trade-off performance for that extra precision.

[👉 Learn more.](https://loreanvictor.github.io/rxdeep/docs/state#trace-less-changes)

<br><br>

[![Build Status](https://badgen.net/travis/loreanvictor/rxdeep?label=build&cache=300&icon=travis)](https://travis-ci.org/loreanvictor/rxdeep)
[![Code Coverage](https://badgen.net/codecov/c/github/loreanvictor/rxdeep?cache=300&icon=codecov)](https://codecov.io/gh/loreanvictor/rxdeep)
[![Minzipped Size](https://badgen.net/bundlephobia/minzip/rxdeep@latest?icon=jsdelivr&color=purple)](https://bundlephobia.com/result?p=rxdeep@latest)
[![NPM Version](https://badgen.net/npm/v/rxdeep?cache=300&icon=npm)](https://www.npmjs.com/package/rxdeep)
[![Code Quality](https://badgen.net/codacy/grade/423972f1e78b453e8e69581ba4abc058?cache=300&icon=codacy)](https://www.codacy.com/manual/loreanvictor/rxdeep)
[![License](https://badgen.net/github/license/loreanvictor/rxdeep?icon=github)](LICENSE)
