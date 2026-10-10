import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import ActionMenu from '@/components/ActionMenu.vue';

it('opens, emits enabled actions and closes after selection', async () => {
	const wrapper = mount(ActionMenu, {
		props: {
			actions: [
				{ id: 'edit', label: 'Изменить' },
				{ id: 'delete', label: 'Удалить', disabled: true },
			],
		},
		attachTo: document.body,
	});
	await wrapper.find('button').trigger('click');
	await nextTick();
	expect(wrapper.find('[role="menu"]').exists()).toBe(true);
	const items = wrapper.findAll('[role="menuitem"]');
	await items[1].trigger('click');
	expect(wrapper.emitted('action')).toBeUndefined();
	await items[0].trigger('click');
	expect(wrapper.emitted('action')?.[0]).toEqual(['edit']);
	expect(wrapper.find('button').attributes('aria-expanded')).toBe('false');
});
