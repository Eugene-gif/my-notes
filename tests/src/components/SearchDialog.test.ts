import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import SearchDialog from '@/components/SearchDialog.vue';
import { useNotesStore } from '@/store/notesStore';
import { fixture } from '../../fixtures';

it('searches after debounce and navigates to an escaped result', async () => {
	vi.useFakeTimers();
	useNotesStore().state = fixture();
	const wrapper = mount(SearchDialog, { props: { modelValue: true, currentId: null } });
	await wrapper.find('input').setValue('купить');
	await nextTick();
	vi.advanceTimersByTime(300);
	await nextTick();
	expect(wrapper.findAll('.search-result')).toHaveLength(2);
	expect(wrapper.findAll('mark')).toHaveLength(2);
	await wrapper.find('.search-result').trigger('click');
	expect(wrapper.emitted('navigate')?.[0]).toEqual([expect.objectContaining({ id: 'task' })]);
	expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
});
