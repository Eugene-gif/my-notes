import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconChevronDown from '@/assets/icons/IconChevronDown.vue';

it('renders the decorative expand arrow using the surrounding button color', () => {
	const wrapper = mount(IconChevronDown);
	expect(wrapper.get('path').attributes('d')).toBe('m6 9 6 6 6-6');
	expect(wrapper.attributes('stroke')).toBe('currentColor');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
});
