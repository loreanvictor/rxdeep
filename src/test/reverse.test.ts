import { should, expect } from 'chai'; should();

import { reverse } from '../reverse';
import { change } from '../trace';


describe('reverse()', () => {
  it('should properly reverse a leaf change.', () => {
    const r = reverse({value: 43, trace: { from: 42, to: 43 }});
    expect(r.value).to.eql(42);
    expect(r.trace).to.eql({ from: 43, to: 42 });
  });

  it('should properly reverse a node change.', () => {
    const r = reverse(change({ x: 42 }, { x : 43 })!!);
    expect(r.value).to.eql({ x: 42 });
    expect(r.trace).to.eql({
      subs: {
        x: { from: 43, to: 42 }
      }
    });
  });

  it('should properly reverse a really deep change.', () => {
    const r = reverse(change({
      x: 21,
      l: [1, 2, {x: 5}],
    }, {
      x: 22,
      l: [1, 2, {x: 6}, 23],
    })!!);

    expect(r.value).to.eql({
      x: 21,
      l: [1, 2, {x: 5}]
    });
    expect(r.trace).to.eql({
      subs: {
        x: { from: 22, to: 21 },
        l: {
          subs: {
            2: {
              subs: {
                x: { from: 6, to: 5 }
              }
            },
            3: { from: 23, to: undefined }
          }
        }
      }
    });
  });

  it('should properly handle collapsing objects to undefined.', () => {
    const r = reverse({
      value: undefined,
      trace: {
        subs: {
          x: { from: 3, to: undefined }
        }
      }
    });
    expect(r.value).to.eql({x : 3});
    expect(r.trace).to.eql({
      subs: {
        x: { from: undefined, to: 3 }
      }
    });
  });

  it('should cancel itself out.', () => {
    const c = change({
      x: 21,
      l: [1, 2, {x: 5}, 23],
    }, {
      x: 22,
      l: [1, 2, {x: 6}],
    });

    reverse(reverse(c!!)).should.eql(c);
  });
});