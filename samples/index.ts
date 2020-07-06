import { State } from '../src';


const state = new State({
  todos: [{title: 'Do This'}, {title: 'Do That'}],
  draft: ''
});

const todos = state.sub('todos');

const addTodo = () => state.value = {
  todos: state.value.todos.concat([{title: state.value.draft }]),
  draft: ''
};

todos.sub('length').subscribe(console.log);
todos.subscribe(console.log);

state.sub('draft').value = 'Halo!';
addTodo();
