import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconNotice from '@/assets/icons/IconNotice.vue';

it('uses the same circle and changes the status symbol reactively', async () => {
	const wrapper = mount(IconNotice, { props: { status: 'success' } });
	const circle = wrapper.get('circle').element;
	expect(wrapper.get('path').attributes('d')).toBe('m8 12 3 3 5-6');
	expect(wrapper.attributes('stroke')).toBe('currentColor');
	expect(wrapper.attributes('stroke-width')).toBe('2');
	expect(wrapper.attributes('width')).toBe('24');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
	await wrapper.setProps({ status: 'info' });
	expect(wrapper.get('circle').element).toBe(circle);
	expect(wrapper.get('path').attributes('d')).toBe('M12 8h0m0 4v4');
	await wrapper.setProps({ status: 'error' });
	expect(wrapper.get('circle').element).toBe(circle);
	expect(wrapper.get('path').attributes('d')).toBe('m9 9 6 6m0-6-6 6');
	await wrapper.setProps({ status: 'warning' });
	expect(wrapper.get('circle').element).toBe(circle);
	expect(wrapper.get('path').attributes('d')).toBe('M12 8v4m0 4h0');
});
