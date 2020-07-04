import { should, expect } from 'chai'; should();

import { VerifiedState } from '../verified';
import { State } from '../state';
import { Change } from '../types';
import { Subject } from 'rxjs';


describe('VerifiedState', () => {
  it('should allow verified changes to the state only.', () => {
    const r: number[] = [];
    const r2: number[] = [];
    const s = new State(42);
    const v = new VerifiedState(s, change => change.value!! % 2 === 0);

    v.subscribe(n => r.push(n!!));
    s.subscribe(n => r2.push(n!!));

    v.value = 43;
    v.value = 44;

    r.should.eql([42, 42, 44]); // --> v emits 42 an extra time for when trying to set 43
    r2.should.eql([42, 44]);
  });

  it('should only allow verified changes to the state from sub-states.', () => {
    const r: number[] = [];
    const r2: number[] = [];
    const s = new State([1, 2, 3]);
    const v = new VerifiedState(s, change => change.value?.reduce((t, i) => t + i)!! % 2 === 0);

    v.sub(0).subscribe(n => r.push(n!!));
    s.sub(0).subscribe(n => r2.push(n!!));

    const sub = v.sub(0); sub.subscribe(); // --> subscribe so that it picks up changes.
    sub.value = 2;
    sub.value.should.equal(1);

    v.sub(0).value = 3;
    sub.value.should.equal(3);

    r.should.eql([1, 1, 3]); // --> emits 1 an extra time for when trying to set 2
    r2.should.eql([1, 3]);
  });

  it('should only allow verified changes to state from sub-sub-states.', () => {
    const r: number[] = [];
    const r2: number[] = [];
    const s = new State([{ x: 1 }, { x : 2 }, { x: 3 }]);
    const v = new VerifiedState(s, change => change.value?.reduce((t, i) => t + i.x, 0)!! % 2 === 0);

    v.sub(0).sub('x').subscribe(n => r.push(n!!));
    s.sub(0).sub('x').subscribe(n => r2.push(n!!));

    const sub = v.sub(0); sub.subscribe();
    sub.value = { x: 2 };
    sub.value.should.eql({ x : 1 });

    const sub2 = v.sub(0).sub('x');; sub2.subscribe();
    sub2.value = 2;
    sub2.value.should.equal(1);
    sub.value.should.eql({ x: 1 });

    v.sub(0).sub('x').value = 3;
    sub2.value.should.equal(3);
    sub.value.should.eql({ x: 3 });

    r.should.eql([1, 1, 3]);
    r2.should.eql([1, 3]);
  });

  it('should not emit unverified changes upstream.', () => {
    const r: Change<number>[] = [];
    const d = new Subject<Change<number>>();
    const s = new State(42, d, {
      next: change => {
        r.push(change);
        d.next(change);
      },
      error: () => {},
      complete: () => {}
    });
    const v = new VerifiedState(s, change => change.value!! % 2 === 0);
    v.subscribe();

    v.value = 43;
    v.value = 44;

    r.length.should.equal(1);
    r.should.eql([{ value: 44, from: 42, to: 44 }]);
  });

  it('should allow non-verifable values from upstream / original state.', () => {
    const s = new State(42);
    const v = new VerifiedState(s, change => change.value!! % 2 === 0);
    v.subscribe();

    s.value = 43;
    v.value.should.equal(43);
  });

  it('should pass on errors to original state.', done => {
    const err = {};
    new VerifiedState(new State(undefined, new Subject<Change<undefined>>(), {
      next: () => {},
      error: e => {
        e.should.equal(err);
        done();
      },
      complete: () => {}
    }), () => false).error(err);
  });

  it('should complete when original state completes.', () => {
    const s = new State(undefined);
    const v = new VerifiedState(s, () => false);
    const sub = v.subscribe();
    sub.closed.should.be.false;
    s.complete();
    sub.closed.should.be.true;
  });

  it('should close all subscriptions to itself upon completion, but not those to original state.', () => {
    const s = new State(undefined);
    const v = new VerifiedState(s, () => false);
    const sub1 = v.subscribe();
    const sub2 = s.subscribe();
    sub1.closed.should.be.false;
    sub2.closed.should.be.false;
    v.complete();
    sub1.closed.should.be.true;
    sub2.closed.should.be.false;
  });

  describe('.bounce()', () => {
    it('should emit bounced changes.', () => {
      const r: Change<number>[] = [];

      const s = new State(42);
      const v = new VerifiedState(s, n => n.value!! % 2 === 0);

      v.bounce().subscribe(c => r.push(c));

      v.value = 43;
      v.value = 44;
      v.value = 45;
      v.value = 46;

      r.should.eql([
        { value: 43, from: 42, to: 43 },
        { value: 45, from: 44, to: 45 },
      ])
    });

    it('should close its subscriptions upon state completion.', () => {
      const s = new State(undefined);
      const v = new VerifiedState(s, () => false);
      const sub = v.bounce().subscribe();
      sub.closed.should.be.false;
      v.complete();
      sub.closed.should.be.true;
    });

    it('should close its subscriptions upon original state completion.', () => {
      const s = new State(undefined);
      const v = new VerifiedState(s, () => false);
      const sub = v.bounce().subscribe();
      sub.closed.should.be.false;
      s.complete();
      sub.closed.should.be.true;
    });
  });
});