# Change Verification

Sometimes you might want to verify changes before they are broadcast.
The `VerifiedState` class facilitates such verifications by only accepting 
changes from sub-states that are verified by given verification function.

For example, imagine you want a state whose value can only increase:

```ts
/*!*/import { State, VerifiedState } from 'rxdeep';

const state = new State(3);
const ascending = new VerifiedState(state, 
  change => !!change.value                         // --> not changing to `undefined
  && change.trace.from < change.trace.to           // --> we are changing to a larger value
)

state.subscribe(console.log);
ascending.subscribe();           // --> subscribe so history is in sync

ascending.value = 2;             // --> rejected
ascending.value = 4;             // --> accepted
ascending.value = 7;             // --> accepted
ascending.value = 5;             // --> rejected

// Logs:
// > 3
// > 4
// > 7
```

<br>

Each `VerifiedState` is a child of [`State`](/docs/state) with all the same methods and attributes.
The only difference is that it executeds the given verification method on each incoming change,
and if the change is rejected, it will not send it upstream, but instead reverse the change
and broadcast the reverse downstream so that sub-states correct their corresponding values.


> :ToCPrevNext