import './style.css';
import { Todo } from '@/components/Todo/Todo.js';

document.querySelector('#app').innerHTML = `
  <div class="todo-container">
    ${Todo()}
  </div>
`;
