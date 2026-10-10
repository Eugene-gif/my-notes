import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import BaseDialog from '@/components/BaseDialog.vue';

it('opens natively, labels itself and requests close by Escape or backdrop', async () => {
	const wrapper = mount(BaseDialog, {
		props: { title: 'Подтверждение', modelValue: true },
		slots: { default: 'Содержимое' },
		attachTo: document.body,
	});
	await nextTick();
	expect(wrapper.find('dialog').element.open).toBe(true);
	const title = wrapper.find('h2');
	expect(wrapper.find('dialog').attributes('aria-labelledby')).toBe(title.attributes('id'));
	await wrapper.find('dialog').trigger('cancel');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
	await wrapper.find('dialog').trigger('click');
	expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
});
