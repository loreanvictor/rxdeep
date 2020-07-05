import { should, expect } from 'chai'; should();

import { KeyedState } from '../keyed';
import { State } from '../state';

describe.only('KeyedState', () => {
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
});