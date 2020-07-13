import { State, change } from '../src';

const c = change(
  {
    x: { y: false },
    z: 3
  },
  {
    x: { y: true },
    z: 3
  }
);

console.log(c);

// const state = new State({
//   x: { y: false },
//   z: 3
// });

// state.sub('x').sub('y').subscribe(console.log);

// state.upstream.next({
//   value: { x: { y: true }, z: 3 },
//   trace: {
//     subs: {
//       x: {
//         subs: {
//           y: { from: false, to: true }
//         }
//       }
//     }
//   }
// });
