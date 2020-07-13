import { should, expect } from 'chai'; should();

import { trace, change } from '../trace';
import { State } from '../state';
import { Change } from '../types';
import { Subject } from 'rxjs';


describe('trace()', () => {
  it('should trace the change between two raw values.', () => {
    expect(trace(42, 43)).to.eql({from: 42, to: 43});
    expect(trace('hellow', 'world')).to.eql({from: 'hellow', to: 'world'});
    expect(trace(undefined, false)).to.eql({from: undefined, to: false});
    expect(trace(null, undefined)).to.eql({from: null, to: undefined});

    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    expect(trace(today, yesterday)).to.eql({from: today, to: yesterday});
    expect(trace(today, 42 as any)).to.eql({from: today, to: 42});
  });

  it('should trace the change between two arrays.', () => {
    expect(trace([1, 2], [2, 2])).to.eql({
      subs: {
        0: { from: 1, to: 2}
      }
    });

    expect(trace([1, 2], [1, 2, 3])).to.eql({
      subs: {
        2: { from: undefined, to: 3 }
      }
    });

    expect(trace([1, 2, 3], [1, 3])).to.eql({
      subs: {
        1: { from: 2, to: 3 },
        2: { from: 3, to: undefined }
      }
    });
  });

  it('should trace the change between two objects.', () => {
    expect(trace({x: 2, y: 3}, {x: 3, y: 3})).to.eql({
      subs: {
        x: { from: 2, to: 3 }
      }
    });

    expect(trace({x: 2, y: 3}, {x: 2})).to.eql({
      subs: {
        y: { from: 3, to: undefined }
      }
    });

    expect(trace({x: 2}, {x: 3, y: 4})).to.eql({
      subs: {
        x: { from: 2, to: 3 },
        y: { from: undefined, to: 4 }
      }
    });
  });

  it('should trace changes between complex objects.', () => {
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    expect(trace({
      team: [{name: 'Jack', age: 42}, {name: 'Jill', age: 25}],
      founded: yesterday,
    }, {
      team: [{name: 'Jack', age: 43}, {name: 'Jill', age: 25}, {name: 'Jonah', age: 30}],
      founded: today
    })).to.eql({
      subs: {
        founded: {from: yesterday, to: today},
        team: {
          subs: {
            0: {
              subs: {
                age: { from: 42, to: 43 }
              }
            },
            2: { from: undefined, to: { name: 'Jonah', age: 30 }}
          }
        }
      }
    });
  });

  it('should properly trace collapsed objects.', () => {
    expect(trace({x: {y: 3}}, {z: 4})).to.eql({
      subs: {
        x: { from: {y: 3}, to: undefined },
        z: { from: undefined, to: 4 },
      }
    });
  });

  it('should return undefined for equal objects.', () => {
    expect(trace({x: 2}, {x: 2})).to.be.undefined;
  });
});

describe('change()', () => {
  it('should create a change object from given values that properly updates a state value.', () => {
    const r1: any[] = [];
    const r2: any[] = [];
    const r3: any[] = [];
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const d = new Subject<Change<any>>();
    const s = new State({
      team: [{name: 'Jack', age: 42}, {name: 'Jill', age: 25}],
      founded: yesterday,
    }, d, d);
    s.sub('team').sub(0).subscribe(v => r1.push(v));
    s.sub('team').sub(2).sub('age').subscribe(v => r2.push(v));
    s.sub('founded').subscribe(v => r3.push(v));

    d.next(change(s.value, {
      founded: today,
      team: [{name: 'Jack', age: 43}, {name: 'Jill', age: 25}, {name: 'Jonah', age: 30}],
    }));

    r1.should.eql([{name: 'Jack', age: 42}, {name: 'Jack', age: 43}]);
    r2.should.eql([undefined, 30]);
    r3.should.eql([yesterday, today]);
  });

  it('should return undefined for equal objects.', () => {
    expect(change({x: 2}, {x: 2})).to.be.undefined;
  });
});