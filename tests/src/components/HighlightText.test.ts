import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import HighlightText from '@/components/HighlightText.vue';

it('marks matching text without creating user HTML', () => {
	const wrapper = mount(HighlightText, { props: { text: '<img> Молоко молоко', query: 'молоко' } });
	expect(wrapper.findAll('mark').map((item) => item.text())).toEqual(['Молоко', 'молоко']);
	expect(wrapper.find('img').exists()).toBe(false);
	expect(wrapper.text()).toBe('<img> Молоко молоко');
});
