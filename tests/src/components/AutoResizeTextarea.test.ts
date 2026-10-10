import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import AutoResizeTextarea from '@/components/AutoResizeTextarea.vue';

it('emits multiline text and exposes resize', async () => {
	const wrapper = mount(AutoResizeTextarea, {
		props: { id: 'text', label: 'Описание', modelValue: '', required: true, autofocus: true },
	});
	await wrapper.find('textarea').setValue('Один\nДва');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Один\nДва']);
	expect(wrapper.find('textarea').attributes('required')).toBeDefined();
	expect(wrapper.find('textarea').attributes('autofocus')).toBeDefined();
	expect(wrapper.vm.resize).toBeTypeOf('function');
});
