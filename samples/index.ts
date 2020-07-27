import { state, verified, isLeaf } from '../src';


const ascending = verified(state(3), 
  change => !!change.value                         // --> not changing to `undefined
  && isLeaf(change.trace)
  && change?.trace?.from!! < change?.trace?.to!!           // --> we are changing to a larger value
)

ascending.subscribe(console.log);

ascending.value = 2;             // --> rejected
ascending.value = 4;             // --> accepted
ascending.value = 7;             // --> accepted
ascending.value = 5;             // --> rejected