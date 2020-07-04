import { should, expect } from 'chai'; should();

import { reverse } from '../reverse';
import { Change } from '../types';


describe('reverse()', () => {
  it('should properly reverse a change.', () => {
    const o = { value: 42, from: 43, to: 42 };
    const r = reverse(o);
    expect(r.value).to.equal(43);
    expect(r.from).to.equal(42);
    expect(r.to).to.equal(43);
    reverse(r).should.eql(o);
  });

  it('should properly reverse a deep change.', () => {
    const o = {
      value: [42, 44],
      trace: { head: { sub: 0 }},
      from: 43,
      to: 42,
    }
    const r = reverse(o);

    expect(r.value).to.eql([43, 44]);
    expect(r.trace?.head?.sub).to.equal(0);
    expect(r.from).to.equal(42);
    expect(r.to).to.equal(43);
    reverse(r).should.eql(o);
  });

  it('should properly reverse a deep-deep change.', () => {
    const o = {
      value: [{ x: 42 }, { x: 44 }],
      trace: { head: { sub: 0 }, rest: { head: { sub: 'x' as keyof {x: number} } } },
      from: 43,
      to: 42,
    }
    const r = reverse(o);

    expect(r.value).to.eql([{x : 43 }, { x: 44 }]);
    expect(r.trace?.head.sub).to.equal(0);
    expect(r.trace?.rest?.head.sub).to.equal('x');
    reverse(r).should.eql(o);
  });

  it('should properly handle undefined change values.', () => {
    const o: Change<{x : number}[]> = {
      value: undefined,
      trace: { head: { sub: 0 }, rest: { head: { sub: 'x' } } },
      from: 43,
      to: 42
    };
    const r = reverse(o);

    expect(r.value).to.be.undefined;
    expect(r.from).to.equal(42);
    expect(r.to).to.equal(43);
    expect(r.trace).to.eql(o.trace);
    reverse(r).should.eql(o);
  });
});