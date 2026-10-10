import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';

import Button from '@/components/Button.vue';

it('renders slots, submit semantics and disabled actions', async () => {
	const click = vi.fn();
	const wrapper = mount(Button, {
		props: { type: 'submit', onClick: click },
		slots: { default: 'Сохранить' },
	});
	expect(wrapper.text()).toBe('Сохранить');
	expect(wrapper.attributes('type')).toBe('submit');
	await wrapper.trigger('click');
	expect(click).toHaveBeenCalledOnce();
	await wrapper.setProps({ disabled: true, danger: true });
	await wrapper.trigger('click');
	expect(click).toHaveBeenCalledOnce();
	expect(wrapper.classes()).toContain('is-danger');
});
