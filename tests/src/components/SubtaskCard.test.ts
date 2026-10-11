import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import SubtaskCard from '@/components/SubtaskCard.vue';
import { subtasksFixture } from '../../fixtures';

it('cycles through the shared status UI and emits only its own ID', async () => {
	const entry = subtasksFixture()[0];
	const wrapper = mount(SubtaskCard, { props: { entry } });
	expect(wrapper.attributes('data-no-drag')).toBeDefined();
	expect(wrapper.find('[data-id]').exists()).toBe(false);
	expect(wrapper.find('.folder__options').exists()).toBe(false);
	expect(wrapper.find('svg').exists()).toBe(false);
	await wrapper.get('button').trigger('click');
	expect(wrapper.emitted('toggle')).toEqual([[entry.id]]);
	await wrapper.setProps({ entry: { ...entry, status: 'in-progress' } });
	expect(wrapper.get('button').attributes('aria-pressed')).toBe('mixed');
	expect(wrapper.find('svg').exists()).toBe(true);
	await wrapper.setProps({
		entry: { ...entry, status: 'completed', completed: true, value: '<script>text</script>' },
	});
	expect(wrapper.get('button').attributes('aria-pressed')).toBe('true');
	expect(wrapper.get('button').attributes('aria-label')).toContain('Выполнено');
	expect(wrapper.find('script').exists()).toBe(false);
});
