import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconMenu from '@/assets/icons/IconMenu.vue';

const names = [
	'add',
	'search',
	'view',
	'theme',
	'sun',
	'moon',
	'install',
	'update',
	'register',
	'login',
	'select',
	'rename',
	'edit',
	'edit-note',
	'delete',
	'open',
	'move',
	'swap',
	'folder',
	'note',
	'checklist',
] as const;

it.each(names)('renders the typed %s menu icon', (name) => {
	const wrapper = mount(IconMenu, { props: { name } });
	expect(wrapper.findAll('path,circle,rect').length).toBeGreaterThan(0);
	expect(wrapper.attributes('width')).toBe('22');
	expect(wrapper.attributes('height')).toBe('22');
	expect(wrapper.attributes('stroke')).toBe('currentColor');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
	expect(wrapper.attributes('focusable')).toBe('false');
});

it('reactively replaces the drawing and shares it between edit actions', async () => {
	const wrapper = mount(IconMenu, { props: { name: 'rename' } });
	const pencil = wrapper.get('path').attributes('d');
	for (const name of ['edit', 'edit-note'] as const) {
		await wrapper.setProps({ name });
		expect(wrapper.get('path').attributes('d')).toBe(pencil);
	}
	await wrapper.setProps({ name: 'view' });
	expect(wrapper.find('path').exists()).toBe(false);
	expect(wrapper.findAll('rect')).toHaveLength(4);
});
