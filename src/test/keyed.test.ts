import { should, expect } from 'chai'; should();

import { KeyedState } from '../keyed';
import { State } from '../state';
import { Subject } from 'rxjs';
import { Change } from '../types';

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
        expect(v.from).to.eql([1, 2, 3, 4]);
        expect(v.to).to.eql([4, 3, 2, 1]);
        done();
      },
      error: () => {},
      complete: () => {}
    });
    const k = new KeyedState(s, n => n);
    k.value = [4, 3, 2, 1];
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
  });
});