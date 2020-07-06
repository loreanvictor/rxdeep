import { State } from '../src';

const team = new State({
  name: 'Awesome Team',
  people: [
    { id: 101, name: 'Julia' },
    { id: 102, name: 'Jeremy' },
  ]
});

team.sub('people').sub(0).sub('name').subscribe(console.log);
team.sub('people').sub(0).sub('name').value = 'Julia';
