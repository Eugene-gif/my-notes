import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import NoteView from '@/components/NoteView.vue';
import { fixture } from '../../fixtures';

it('renders plain note text and forwards editor actions', async () => {
	const note = fixture().notes[0];
	const wrapper = mount(NoteView, { props: { note, editing: false } });
	expect(wrapper.find('img').exists()).toBe(false);
	await wrapper.find('.btn-note-edit').trigger('click');
	expect(wrapper.emitted('edit')).toHaveLength(1);
	await wrapper.setProps({ editing: true });
	await wrapper.find('input').setValue('Название');
	await wrapper.find('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]).toEqual(['Название', note.description]);
	await wrapper.find('.btn-note-cancel').trigger('click');
	expect(wrapper.emitted('cancel')).toHaveLength(1);
});
