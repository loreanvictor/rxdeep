# Change Verification

Sometimes you might want to verify changes before they are broadcast.
The `verified()` method (and the `VerifiedState` class) facilitates such verifications by only accepting 
changes from sub-states that are verified by given verification function.

For example, imagine you want a state whose value can only increase:

```ts
/*!*/import { state, verified } from 'rxdeep';

const ascending = verified(state(3), 
  change => !!change.value                         // --> not changing to `undefined
  && change.trace.from < change.trace.to           // --> we are changing to a larger value
)

ascending.subscribe(console.log);

ascending.value = 2;             // --> rejected
ascending.value = 4;             // --> accepted
ascending.value = 7;             // --> accepted
ascending.value = 5;             // --> rejected

// Logs:
// > 3
// > 3 --> for the rejected 2
// > 4
// > 7
// > 7 --> for the rejected 5
```

> [info](:Icon) **NOTE**
>
> You can also utilize `VerifiedState` class constructor instead of `verified()` function.

<br>

Each `VerifiedState` (created with `verified()`) is a child of [`State`](/docs/state) with all 
the same methods and attributes. The only difference is that it executeds the given verification 
method on each incoming change, and if the change is rejected, it will not send it upstream, 
but instead reverse the change and broadcast the reverse downstream so that sub-states correct 
their corresponding values.


> :ToCPrevNext