import './Input.css';
import IconMenu from '@/assets/icons/IconMenu.js';
export function Input(placeholder, name='text', isSearch = false) {
	return `
	<div class="todo__input input">
    <input type="text" 
			class="input__field${isSearch ? ' search' : ''}"
			placeholder="${placeholder}"
			name="${name}">
		${isSearch ? IconMenu('search').replace('class="menu__icon"', 'class="input__icon"') : ''}
		${isSearch ? '<button class="button input__clear --hide" type="button">✖</button>' : ''}
  </div>
	`;
};
