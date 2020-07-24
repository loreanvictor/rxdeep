import { should, expect } from 'chai'; should();
import { Subject, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { PersistentState } from '../persistent';
import { State } from '../state';
import { Change } from '../types/changes';


describe('PersistentState', () => {
  it('should pick up the initial value of given state if provided storage doesn\'t have values.', () => {
    const p = new PersistentState(new State(42), {
      load() { return undefined },
      save() {},
    });

    p.value.should.equal(42);
  });

  it('should pick up the initial value from given storage if it has value.', () => {
    const p = new PersistentState(new State(42), {
      load() { return of(undefined) },
      save() {},
    });

    expect(p.value).to.be.undefined;
  });

  it('should pass down changes passed down through down stream of the state.', () => {
    const r: number[] = [];
    const s = new State({x: 42});
    const p = new PersistentState(s, {
      load() { return undefined },
      save() {},
    });

    p.sub('x').subscribe(v => r.push(v!!));
    s.sub('x').value = 43;

    r.should.eql([42, 43]);
  });

  it('should invoke `.save()` of provided storage for values coming down the downstream.', () => {
    const r: any[] = [];
    const s = new State({x: 42});
    const p = new PersistentState(s, {
      load() { return undefined },
      save(v) { r.push({...v}) },
    });

    p.subscribe();
    s.sub('x').value = 43;
    r.should.eql([{x: 42}, {x: 43}]);
  });

  it('should invoke `.save()` for initial value if storage does not have values.', done => {
    new PersistentState(new State(42), {
      load() { return undefined },
      save() { done() }
    });
  });

  it('should not invoke `.save()` for initial value if storage has value.', done => {
    new PersistentState(new State(42), {
      load() { return of(undefined) },
      save() { done() }
    });

    done();
  });

  it('should listen to changes pushed by the storage.', () => {
    const s = new Subject<number>();
    const r: number[] = [];
    const p = new PersistentState(new State(42), {
      load() { return undefined },
      save() {},
      changes() { return s }
    });
    p.subscribe(v => r.push(v!!));
    s.next(43);
    r.should.eql([42, 43]);
  });

  it('should not call `.save()` for values pushed by the storage.', () => {
    const s = new Subject<number>();
    const r: number[] = [];
    const p = new PersistentState(new State(42), {
      load() { return undefined },
      save(v) { r.push(v!!) },
      changes() { return s }
    });
    p.subscribe();
    s.next(43);
    r.should.eql([42]);
  });

  it('should apply given transform on changes that are stored.', () => {
    const r: any[] = [];
    const s = new State({x : 42});
    const p = new PersistentState(s, {
      load() { return undefined },
      save(v) { r.push({ ...v }) }
    }, map(change => ({ ...change, value: { x: change.value?.x!! * 2 } })));

    p.subscribe();
    s.value = { x: 43 };

    r.should.eql([{ x: 42 }, { x: 86 }]);
  });

  it('should not apply provided transform on normal downstream.', () => {
    const r: any[] = [];
    const s = new State({x : 42});
    const p = new PersistentState(s, {
      load() { return undefined },
      save() {}
    }, map(change => ({ ...change, value: { x: change.value?.x!! * 2 } })));

    p.sub('x').subscribe(v => r.push(v));
    s.value = { x: 43 };

    r.should.eql([42, 43]);
  });

  it('should not save multiple times when multiple subscriptions are active.', () => {
    const r: number[] = [];
    const s = new State(42);
    const p = new PersistentState(s, {
      load() { return undefined },
      save(v) { r.push(v!!) }
    });

    p.subscribe();
    p.subscribe();
    s.value = 43;

    r.should.eql([ 42, 43 ]);
  });

  it('should not save changes when no one is subscribed anymore.', () => {
    const r: number[] = [];
    const s = new State(42);
    const p = new PersistentState(s, {
      load() { return undefined },
      save(v) { r.push(v!!) }
    });

    p.subscribe().unsubscribe();
    s.value = 43;

    r.should.eql([ 42 ]);
  });

  it('should not respond to storage changes multiple times when multiple subscriptions are active', () => {
    const r: number[] = [];
    const c = new Subject<number>();
    const refl = new Subject<Change<number>>();
    const s = new State(42, refl, {
      next: change => { r.push(change.value!!); refl.next(change) },
      error: err => refl.error(err),
      complete: () => refl.complete(),
    });
    const p = new PersistentState(s, {
      load() { return undefined },
      save() { },
      changes() { return c }
    });

    p.subscribe()
    p.subscribe();
    c.next(43);

    r.should.eql([43]);
  });

  it('should not respond to storage changes when no one is subscribed anymore.', () => {
    const r: number[] = [];
    const c = new Subject<number>();
    const refl = new Subject<Change<number>>();
    const s = new State(42, refl, {
      next: change => { r.push(change.value!!); refl.next(change) },
      error: err => refl.error(err),
      complete: () => refl.complete(),
    });
    const p = new PersistentState(s, {
      load() { return undefined },
      save() { },
      changes() { return c }
    });

    let sub = p.subscribe();
    c.next(43);
    sub.unsubscribe();
    c.next(44);
    sub = p.subscribe();
    c.next(45);
    sub.unsubscribe();
    c.next(46);

    r.should.eql([43, 45]);
  });
});