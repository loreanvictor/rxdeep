import { should, expect } from 'chai'; should();

import { KeyedState } from '../keyed';
import { State } from '../state';
import { Subject } from 'rxjs';
import { Change, ListChanges } from '../types';


describe('KeyedState', () => {

  it('should emit initial value as well.', done => {
    const s = new State([1, 2, 3, 4, 5]);
    const k = new KeyedState(s, n => n);
    k.subscribe(v => {
      expect(v).to.eql([1, 2, 3, 4, 5]);
      done();
    });
  });

  it('should emit the proper initial value.', done => {
    const s = new State([1, 2, 3, 4, 5]);
    const k = new KeyedState(s, n => n);
    k.subscribe();

    expect(k.value).to.eql([1, 2, 3, 4, 5]);
    s.value = [5, 4, 3, 2, 1];
    k.subscribe(v => {
      expect(v).to.eql([5, 4, 3, 2, 1]);
      done();
    });
  });

  it('should track the most recent value if subscribed and proxy-state is root.', () => {
    const s = new State([1, 2, 3, 4]); s.subscribe();
    const k = new KeyedState(s, n => n);
    s.value = [4, 3, 2, 1];
    k.value.should.eql([1, 2, 3, 4]);
    k.subscribe();
    s.value = [4, 3, 2, 1];
    k.value.should.eql([4, 3, 2, 1]);
  });

  it('should emit its proxy-state\'s values when root state.', () => {
    const r: number[][] = [];
    const s = new State([1, 2, 3, 4]);
    const k = new KeyedState(s, n => n);
    k.subscribe(v => r.push(v!!));

    s.value = [4, 3, 2, 1];
    k.value = [1, 4, 2, 3];
    r.should.eql([[1, 2, 3, 4], [4, 3, 2, 1], [1, 4, 2, 3]]);
  });

  it('should cause proxy-state to emit values when root state.', () => {
    const r: number[][] = [];
    const s = new State([1, 2, 3, 4]);
    const k = new KeyedState(s, n => n);
    s.subscribe(v => r.push(v!!));

    s.value = [4, 3, 2, 1];
    k.value = [1, 4, 2, 3];
    r.should.eql([[1, 2, 3, 4], [4, 3, 2, 1], [1, 4, 2, 3]]);
  });

  it('should emit values to proxy-state\'s upstream.', done => {
    const s = new State([1, 2, 3, 4], new Subject<Change<number[]>>(), {
      next: v => {
        expect(v.value).to.eql([4, 3, 2, 1]);
        expect(v.trace).to.eql({
          from: [1, 2, 3, 4],
          to: [4, 3, 2, 1]
        })
        done();
      },
      error: () => {},
      complete: () => {}
    });
    const k = new KeyedState(s, n => n);
    k.value = [4, 3, 2, 1];
  });

  it('should pass up errors to the proxied state.', done => {
    const err = {};
    const s = new State([1, 2, 3, 4, 5]);
    const k = new KeyedState(s, n => n);
    s.subscribe(
      () => {},
      e => {
        e.should.equal(err);
        done();
      },
    );
    k.error(err);
  });

  describe('.key()', () => {
    it('should track objects based on provided key function instead of indexes.', () => {
      const r: string[] = [];
  
      const s = new State([{id: 101, name: 'John'}, {id: 102, name: 'Jill'}]);
      const k = new KeyedState(s, p => p.id);
  
      k.key(102).sub('name').subscribe(n => r.push(n!!));
  
      r.length.should.equal(1);
      s.value = [s.value[1], s.value[0]];
      r.length.should.equal(1);
      s.sub(0).sub('name').value = 'Judy';
      r.length.should.equal(2);
      r.should.eql(['Jill', 'Judy']);
    });

    it('should route all changes related to specified key to the state.', () => {
      const r: string[] = [];
      const s = new State<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = new KeyedState(s, n => n[0]);

      k.key(2).sub(1).subscribe(c => r.push(c!!));
      k.key(2).value = [2, 'X'];
      k.value = [[2, 'Z'], [3, 'D']];

      r.should.eql(['B', 'X', 'Z']);
    });

    it('should route changes to a key to proper subs on unkeyed proxies.', () => {
      const r: string[] = [];
      const s = new State<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = new KeyedState(s, n => n[0]);

      s.sub(1).sub(1).subscribe(c => r.push(c!!));
      k.key(2).sub(1).value = 'X';
      k.key(2).value = [2, 'H'];

      r.should.eql(['B', 'X', 'H']);
    });

    it('should properly route changes from unkeyed proxies.', () => {
      const r: string[] = [];
      const s = new State<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = new KeyedState(s, n => n[0]);

      k.key(2).sub(1).subscribe(c => r.push(c!!));
      s.sub(1).value = [2, 'X'];
      s.value = [[2, 'X'], [3, 'Y']];
      s.sub(0).sub(1).value = 'W';

      r.should.eql(['B', 'X', 'W']);
    });

    it('should also keep changes in sync between different keyed states.', () => {
      const r: string[] = [];
      const s = new State<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = new KeyedState(s, n => n[0]);
      const k2 = new KeyedState(s, n => n[0]);

      k.key(2).sub(1).subscribe(c => r.push(c!!));
      k2.key(2).value = [2, 'X'];
      k2.key(2).sub(1).value = 'Z';
      k2.value = [[2, 'W']];

      r.should.eql(['B', 'X', 'Z', 'W']);
    });

    it('should have correct initial value.', () => {
      const s = new State([{id: 101, name: 'Judy'}, {id: 102, name: 'Jafar'}]);
      const k = new KeyedState(s, p => p.id);

      k.key(102).value.should.eql({id: 102, name: 'Jafar'});
      s.sub(1).sub('name').value = 'Jafet';
      k.key(102).value.should.eql({id: 102, name: 'Jafet'});
    });

    it('should emit initial value.', done => {
      const s = new State([{id: 101, name: 'Judy'}, {id: 102, name: 'Jafar'}]);
      const k = new KeyedState(s, p => p.id);
      k.key(102).sub('name').subscribe(v => {
        expect(v).to.equal('Jafar');
        done();
      });
    });

    it('should emit correct initial value.', done => {
      const s = new State([{id: 101, name: 'Judy'}, {id: 102, name: 'Jafar'}]);
      const k = new KeyedState(s, p => p.id);
      s.sub(1).sub('name').value = 'Jafet';
      k.key(102).sub('name').subscribe(v => {
        expect(v).to.equal('Jafet');
        done();
      });
    });

    it('should emit undefined for undefined initial value on parent state.', done => {
      const s = new State(undefined);
      const k = new KeyedState(s as any, x => (x as any).id);
      k.key(1).subscribe(v => {
        expect(v).to.be.undefined;
        done();
      });
    });

    it('should pass up errors.', done => {
      const err = {};
      const k = new KeyedState(new State([1]), n => n);
      k.subscribe(
        () => {},
        e => {
          e.should.equal(err);
          done();
        },
        () => {},
      );
      k.key(1).error(err);
    });
  });

  describe('.index()', () => {
    it('should track index of a particular key.', () => {
      const r: number[] = [];
      const s = new State([42, 43]);
      const k = new KeyedState(s, n => n);
      k.index(42).subscribe(i => r.push(i));
      s.value = [43, 42];
      r.should.eql([0, 1]);
    });
  });

  describe('.changes()', () => {
    it('should return the changes to the array in terms of additions / deletions and moved items.', () => {
      const r: ListChanges<number>[] = [];
      const s = new State([1, 2, 3]);
      const k = new KeyedState(s, n => n);
      k.changes().subscribe(c => r.push(c));
      s.value = [1, 3, 2];
      s.value = [1, 3, 2, 4];
      s.value = [1, 5, 3, 2, 4];
      s.value = [5, 3, 2, 4];

      r.should.eql([
        {
          additions: [],
          deletions: [],
          moves: [
            { oldIndex: 1, newIndex: 2, item: 2 },
            { oldIndex: 2, newIndex: 1, item: 3 }
          ]
        },
        { additions: [ { index: 3, item: 4 } ], deletions: [], moves: [] },
        {
          additions: [ { index: 1, item: 5 } ],
          deletions: [],
          moves: [
            { oldIndex: 2, newIndex: 3, item: 2 },
            { oldIndex: 1, newIndex: 2, item: 3 },
            { oldIndex: 3, newIndex: 4, item: 4 }
          ]
        },
        {
          additions: [],
          deletions: [ { index: 0, item: 1 } ],
          moves: [
            { oldIndex: 3, newIndex: 2, item: 2 },
            { oldIndex: 2, newIndex: 1, item: 3 },
            { oldIndex: 4, newIndex: 3, item: 4 },
            { oldIndex: 1, newIndex: 0, item: 5 }
          ]
        }
      ]);
    });
  });
});