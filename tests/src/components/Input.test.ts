import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import Input from '@/components/Input.vue';

it('labels the field and emits text without interpreting markup', async () => {
	const wrapper = mount(Input, {
		props: { id: 'name', label: 'Название', modelValue: '<img>', type: 'search' },
	});
	expect(wrapper.find('label').attributes('for')).toBe('name');
	expect(wrapper.find('input').element.value).toBe('<img>');
	await wrapper.find('input').setValue('Новый текст');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Новый текст']);
	expect(wrapper.find('img').exists()).toBe(false);
});
