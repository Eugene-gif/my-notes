import './Button.css';
export function Button(text = 'Text', className='', type = 'button') {
	return `
		<button class="button${className ? ' ' + className : ''}"
			type="${type}"
		>${text}</button>
	`;
};