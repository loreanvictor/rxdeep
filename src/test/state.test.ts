import { should, expect } from 'chai'; should();

import { Subject } from 'rxjs';

import { State } from '../state';
import { Change } from '../types';
import { ignore } from '../ignore';


describe('State', () => {
  it('should initialize with given initial value.', () => {
    const s = new State(42);
    s.value.should.equal(42);
  });

  it('should track its most recent values if is root state and is subscribed to.', () => {
    const s = new State(41);
    s.value.should.equal(41);
    s.next(42);
    s.value.should.equal(41);    // --> no update
    s.subscribe();
    s.next(42);
    s.value.should.equal(42);
  });

  it('should emit its values when root state.', () => {
    const r : number[] = [];
    const s = new State(41);
    s.subscribe(v => r.push(v!!));
    s.next(42);
    s.next(43);
    s.next(42);
    s.next(42);
    r.should.eql([41, 42, 43, 42, 42]);
  });

  it('should emit values set by `.value` setter when root state.', () => {
    const r : number[] = [];
    const s = new State(41);
    s.subscribe(v => r.push(v!!));
    s.value = 42;
    s.value = 43;
    s.value = 42;
    s.value = 42;
    r.should.eql([41, 42, 43, 42, 42]);
  });

  it('should echo received changes in upstream back to downstream when root state.', () => {
    const r : Change<number>[] = [];
    const s = new State(42);
    const change = { value: 45 };
    s.downstream.subscribe(c => r.push(c));
    s.upstream.next(change);
    r[1].should.equal(change);              // --> change # 0 is change for initial value.
  });

  it('should emit values received from downstream.', () => {
    const d = new Subject<Change<number>>();
    const s = new State(42, d, ignore());
    const r : number[] = [];
    s.subscribe(v => r.push(v!!));

    d.next({ value: 43 });
    d.next({ value: 44 });
    r.should.eql([42, 43, 44]);
  });

  it('should keep its `.value` in sync with latest incoming changes from downstream when subscribed to.', () => {
    const d = new Subject<Change<number>>();
    const s = new State(42, d, ignore());
    s.value.should.equal(42);
    d.next({ value: 43 });
    s.value.should.equal(42);                 // --> not subscribed, not in sync
    s.subscribe();
    d.next({ value: 43 });
    s.value.should.equal(43);
  });

  it('should send received values up its upstream.', () => {
    const r : Change<number>[] = [];
    const s = new State(42, new Subject<Change<number>>(), {
      next: change => r.push(change),
      error: () => {},
      complete: () => {},
    });

    s.next(43);
    s.next(42);
    s.next(42);

    r.should.eql([
      { value: 43 },
      { value: 42 },
      { value: 42 }
    ]);
  });

  it('should send values set by `.value` setter up its upstream.', () => {
    const r : Change<number>[] = [];
    const s = new State(42, new Subject<Change<number>>(), {
      next: change => r.push(change),
      error: () => {},
      complete: () => {},
    });

    s.value = 43;
    s.value = 42;
    s.value = 42;

    r.should.eql([
      { value: 43 },
      { value: 42 },
      { value: 42 }
    ]);
  });

  it('should send received errors upstream.', done => {
    const err = {};
    new State(undefined, new Subject<Change<undefined>>(), {
      next: () => {},
      error: e => {
        e.should.equal(err);
        done();
      },
      complete: () => {},
    }).error(err);
  });

  it('should send complete signal upstream.', done => {
    new State(undefined, new Subject<Change<undefined>>(), {
      next: () => {},
      error: () => {},
      complete: () => done(),
    }).complete();
  });

  describe('.sub()', () => {
    it('should set the initial value correctly based given key and its own value.', () => {
      new State('hellow').sub(1).value.should.equal('e');
    });

    it('should set initial value to `undefined` when the key cannot be found in value.', () => {
      expect(new State([]).sub(1).value).to.be.undefined;
    });

    it('should set the initial value to `undefined` when its own value is `undefined`.', () => {
      expect(new State<never[]>(undefined).sub(1).value).to.be.undefined;
    });

    it('should add proper trace to changes coming from sub-state upstream.', done => {
      new State([42, 43], new Subject<Change<number[]>>(), {
        next: change => {
          expect(change.value).to.eql([42, 44]);
          expect(change.trace?.head?.sub).to.equal(1);
          expect(change.trace?.rest).to.be.undefined;
          done();
        },
        error: () => {},
        complete: () => {},
      }).sub(1).value = 44;
    });

    it('should add proper trace to changes coming from sub-sub-state upstream.', done => {
      new State([{num: 42}, {num: 43}], new Subject<Change<{num: number}[]>>(), {
        next: change => {
          expect(change.value).to.eql([{num: 42}, {num: 44}]);
          expect(change.trace?.head?.sub).to.equal(1);
          expect(change.trace?.rest?.head?.sub).to.equal('num');
          expect(change.trace?.rest?.rest).to.be.undefined;
          done();
        },
        error: () => {},
        complete: () => {},
      }).sub(1).sub('num').value = 44;
    });

    it('should route changes addressing the same key to the sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(0).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43], trace: { head: { sub: 0 } }});
      expect(r[1].value).to.equal(45);
      expect(r[1].trace).to.be.undefined;
    });

    it('should not route changes not addressing the same key to the sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(1).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43], trace: { head: { sub: 0 } }});
      r.length.should.equal(1);
      expect(r[0].value).to.equal(43);
    });

    it('should properly adapt the trace of changes addressing a sub-state.', () => {
      const r : Change<{num: number}>[] = [];
      const d = new Subject<Change<{num: number}[]>>();
      const s = new State([{ num: 42 }, { num: 43 }], d, ignore());
      s.sub(0).downstream.subscribe(c => r.push(c));
      d.next({ value: [{num: 45}, {num: 43}], trace: { head: { sub: 0 }, rest: { head: { sub: 'num' } } } });
      expect(r[1].trace?.head?.sub).to.equal('num');
      expect(r[1].trace?.rest).to.be.undefined;
    });

    it('should route changes without a trace that mutate sub-state value to sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(0).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43] });
      expect(r[1].value).to.equal(45);
      expect(r[1].trace).to.be.undefined;
    });

    it('should not route changes without a trace that do not mutate sub-state value to sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(1).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43] });
      r.length.should.equal(1);
      expect(r[0].value).to.equal(43);
    });

    it('should invoke passed equality check to determine whether sub-state value mutates by a trace-less change.', 
    () => {
      const r : Change<number>[] = [];
      const r2 : [number, number][] = [];
      const s = new State([42, 43]);
      s.sub(0, (_new, _old) => {
        r2.push([_new!!, _old!!]);
        return true;
      }).downstream.subscribe(c => r.push(c));
      s.value = [45, 43];
      r.length.should.equal(1);        // --> only initial value change, since rest of changes are denied on equality
      expect(r[0].value).to.equal(42);
      r2.should.eql([[42, 42], [45, 42]]);
    });

    it('should set the value of undefined for sub-sub-states for changes that make the sub-state undefined.', () => {
      const r : (number | undefined)[] = [];
      const s = new State([{num: 42}, {num: 43}]);
      s.sub(1).sub('num').subscribe(v => r.push(v));
      s.value = [{num: 45}];
      r.should.eql([43, undefined]);
    });

    it('should pass up errors on sub-states to the upstream.', done => {
      const err = {};
      new State([], new Subject<Change<never[]>>(), {
        next: () => {},
        error: e => {
          e.should.equal(err);
          done();
        },
        complete: () => {},
      }).sub(1).error(err);
    });
  });
});
