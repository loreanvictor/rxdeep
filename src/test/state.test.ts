import { should, expect } from 'chai'; should();
import { cloneDeep } from 'lodash';

import { Subject } from 'rxjs';

import { State } from '../state';
import { Change } from '../types';
import { ignore } from '../ignore';


describe('State', () => {
  it('should initialize with given initial value.', () => {
    const s = new State(42);
    s.value.should.equal(42);
  });

  it('should emit proper initial value.', done => {
    const s = new State(42);
    s.subscribe();
    s.value = 43;
    s.subscribe(v => {
      expect(v).to.equal(43);
      done();
    });
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
    const change = { value: 45, trace: { from: 42, to: 45 } };
    s.downstream.subscribe(c => r.push(c));
    s.upstream.next(change);
    r[0].should.eql(change);
  });

  it('should emit values received from downstream.', () => {
    const d = new Subject<Change<number>>();
    const s = new State(42, d, ignore());
    const r : number[] = [];
    s.subscribe(v => r.push(v!!));

    d.next({ value: 43, trace: { from: 42, to: 43 } });
    d.next({ value: 44, trace: { from: 43, to: 44 } });
    r.should.eql([42, 43, 44]);
  });

  it('should keep its `.value` in sync with latest incoming changes from downstream when subscribed to.', () => {
    const d = new Subject<Change<number>>();
    const s = new State(42, d, ignore());
    s.value.should.equal(42);
    d.next({ value: 43, trace: { from: 42, to: 43 } });
    s.value.should.equal(42);                 // --> not subscribed, not in sync
    s.subscribe();
    d.next({ value: 43, trace: { from: 42, to: 43 } });
    s.value.should.equal(43);
  });

  it('should send received values up its upstream.', () => {
    const r : Change<number>[] = [];
    const d = new Subject<Change<number>>();
    const s = new State(42, d, {
      next: change => { r.push(change); d.next(change); },
      error: () => {},
      complete: () => {},
    });

    s.subscribe();
    s.next(43);
    s.next(42);
    s.next(42);

    r.should.eql([
      { value: 43, trace: { from: 42, to: 43 } },
      { value: 42, trace: { from: 43, to: 42 } },
      { value: 42, trace: { from: 42, to: 42 } }
    ]);
  });

  it('should send values set by `.value` setter up its upstream.', () => {
    const r : Change<number>[] = [];
    const d = new Subject<Change<number>>();
    const s = new State(42, d, {
      next: change => { r.push(change); d.next(change); },
      error: () => {},
      complete: () => {},
    });

    s.subscribe();
    s.value = 43;
    s.value = 42;
    s.value = 42;

    r.should.eql([
      { value: 43, trace: { from: 42, to: 43 } },
      { value: 42, trace: { from: 43, to: 42 } },
      { value: 42, trace: { from: 42, to: 42 } }
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

  it('should close its own subscriptions when completed.', () => {
    const s = new State(undefined);
    const sub = s.subscribe();
    sub.closed.should.be.false;
    s.complete();
    sub.closed.should.be.true;
  });

  it('should close its subscriptions without closing subscriptions to parent states.', () => {
    const s = new State([1, 2, 3]);
    const s2 = s.sub(1);
    const sub1 = s.subscribe();
    const sub2 = s2.subscribe();

    sub1.closed.should.be.false;
    sub2.closed.should.be.false;
    s2.complete();
    sub1.closed.should.be.false;
    sub2.closed.should.be.true;
  });

  it('should close subscriptions to its sub-tree without affecting other sub-trees.', () => {
    const root = new State([{x: 2}, {x: 3}]);
    const s1 = root.sub(0);
    const s2 = root.sub(0);
    const sub1 = s1.sub('x').subscribe();
    const sub2 = s2.sub('x').subscribe();

    sub1.closed.should.be.false;
    sub2.closed.should.be.false;
    s2.complete();
    sub1.closed.should.be.false;
    sub2.closed.should.be.true;
  });

  it('should properly multi-cast to sub-state subscriptions.', () => {
    const r: number[] = [];
    const s = new State({x: 42});
    const sub = s.sub('x');
    sub.subscribe(n => r.push(n!!));
    sub.subscribe(n => r.push(n!!));

    s.value = {x : 43};
    r.should.eql([42, 42, 43, 43]);
  });

  it('should only emit when value has changed.', () => {
    const r: any[] = [];
    const r2: any[] = [];
    const s = new State({ x: { y: 2 }, z: 3 });
    s.sub('x').subscribe(v => r.push(v));
    s.sub('z').subscribe(v => r2.push(v));
    s.value = { x: { y: 2 }, z: 4 };
    r.should.eql([{y: 2}]);
    r2.should.eql([3, 4]);
  });

  it('should detect changes to arrays properly.', () => {
    const r: any[] = [];
    const r2: any[] = [];
    const r3: any[] = [];
    const s = new State({x: [1, 2, 3, 4], y: true });
    s.sub('x').subscribe(v => r.push(cloneDeep(v)));
    s.sub('x').sub(4).subscribe(v => r2.push(v));
    s.subscribe(v => r3.push(cloneDeep(v)));

    s.value = { x: [1, 2, 3, 4, 5], y: false};
    s.sub('x').value = [2, 3, 4, 5];
    r.should.eql([[1, 2, 3, 4], [1, 2, 3, 4, 5], [2 ,3, 4, 5]]);
    r2.should.eql([undefined, 5, undefined]);
    r3.should.eql([
      {x: [1, 2, 3, 4], y: true},
      {x: [1, 2, 3, 4, 5], y: false},
      {x: [2, 3, 4, 5], y: false}
    ]);
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
          expect(change.trace).to.eql({ subs: { 1: { from: 43, to: 44 } } });
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
          expect(change.trace).to.eql({
            subs: {
              1: {
                subs: {
                  num: { from: 43, to: 44 }
                }
              }
            }
          });
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
      d.next({ value: [45, 43], trace: { subs: { 0: { from: 42, to: 45 }} }});
      expect(r[0].value).to.equal(45);
      expect(r[0].trace).to.eql({ from: 42, to: 45 });
    });

    it('should not route changes not addressing the same key to the sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(1).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43], trace: { subs: { 0: { from: 42, to: 45 } } }});
      r.length.should.equal(0);
    });

    it('should properly adapt the trace of changes addressing a sub-state.', () => {
      const r : Change<{num: number}>[] = [];
      const d = new Subject<Change<{num: number}[]>>();
      const s = new State([{ num: 42 }, { num: 43 }], d, ignore());
      s.sub(0).downstream.subscribe(c => r.push(c));
      d.next({
        value: [{num: 45}, {num: 43}],
        trace: {
          subs: {
            0: {
              subs: {
                num: { from: 42, to: 45 }
              }
            }
          }
        }
      });
      expect(r[0].trace).to.eql({
        subs: {
          num: { from: 42, to: 45 }
        }
      });
    });

    it('should route changes without a trace that mutate sub-state value to sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(0).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43], trace: { from: [42, 43], to: [45, 43] }});
      expect(r[0].value).to.equal(45);
    });

    it('should not route changes without a trace that do not mutate sub-state value to sub-state downstream.', () => {
      const r : Change<number>[] = [];
      const d = new Subject<Change<number[]>>();
      const s = new State([42, 43], d, ignore());
      s.sub(1).downstream.subscribe(c => r.push(c));
      d.next({ value: [45, 43], trace: { from: [42, 43], to: [45, 43] } });
      r.length.should.equal(0);
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

    it('should only emit when value has changed.', () => {
      const r: any[] = [];
      const r2: any[] = [];
      const r3: any[] = [];
      const s = new State({ T: { x: { y: 2 }, z: 3 }, W: 1 });
      s.sub('T').sub('x').subscribe(v => r.push(v));
      s.sub('W').subscribe(v => r2.push(v));
      s.sub('T').sub('z').subscribe(v => r3.push(v));
      s.value = { T: { x: { y: 2 }, z: 4} , W: 1 };
      r.should.eql([{ y : 2 }]);
      r2.should.eql([ 1 ]);
      r3.should.eql([3, 4]);
    });
  });
});
