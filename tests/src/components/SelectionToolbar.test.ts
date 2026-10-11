import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import SelectionToolbar from '@/components/SelectionToolbar.vue';

it('prevents empty deletion and emits group actions', async () => {
	const wrapper = mount(SelectionToolbar, { props: { count: 0, total: 3 } });
	await wrapper.findAll('button')[1].trigger('click');
	await wrapper.findAll('button')[2].trigger('click');
	expect(wrapper.emitted('remove')).toBeUndefined();
	expect(wrapper.emitted('copy')).toBeUndefined();
	await wrapper.setProps({ count: 3 });
	expect(wrapper.text()).toContain('Снять выбор');
	const buttons = wrapper.findAll('button');
	await buttons[0].trigger('click');
	await buttons[1].trigger('click');
	await buttons[2].trigger('click');
	await buttons[3].trigger('click');
	expect(wrapper.emitted('all')).toHaveLength(1);
	expect(wrapper.emitted('remove')).toHaveLength(1);
	expect(wrapper.emitted('copy')).toHaveLength(1);
	expect(wrapper.emitted('cancel')).toHaveLength(1);
});

it('replaces selection actions with paste and cancel until a compatible destination is opened', async () => {
	const wrapper = mount(SelectionToolbar, {
		props: { count: 2, total: 0, pasting: true, canPaste: false },
	});
	expect(wrapper.text()).toContain('Скопировано: 2');
	expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['Вставить', 'Отмена']);
	await wrapper.find('button').trigger('click');
	expect(wrapper.get('button').attributes('aria-disabled')).toBe('true');
	expect(wrapper.emitted('paste')).toHaveLength(1);
	await wrapper.setProps({ canPaste: true });
	await wrapper.find('button').trigger('click');
	expect(wrapper.get('button').attributes('aria-disabled')).toBe('false');
	expect(wrapper.emitted('paste')).toHaveLength(2);
	await wrapper.get('.todo__cancel').trigger('click');
	expect(wrapper.emitted('cancel')).toHaveLength(1);
});
