import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconFolder from '@/assets/icons/IconFolder.vue';

it('reactively distinguishes filled and empty folders in both open states', async () => {
	const wrapper = mount(IconFolder, { attrs: { class: 'folder-icon' } });
	const paths = new Set<string>();
	for (const open of [false, true]) {
		for (const empty of [false, true]) {
			await wrapper.setProps({ open, empty });
			paths.add(wrapper.get('path').attributes('d')!);
		}
	}
	expect(paths.size).toBe(4);
	expect(wrapper.attributes('aria-hidden')).toBe('true');
	expect(wrapper.attributes('focusable')).toBe('false');
	expect(wrapper.classes()).toContain('folder-icon');
	expect(wrapper.get('path').attributes('fill')).toBe('currentColor');
});
