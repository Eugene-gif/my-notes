import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import EntryForm from '@/components/EntryForm/EntryForm.vue';
import { fixture } from '../../../fixtures';
it('keeps note edits as a draft until explicit save or cancel', async () => {
  const note = fixture().notes[0];
  const wrapper = mount(EntryForm, { props: { type: 'note', entry: note } });
  await wrapper.find('input').setValue('Черновик');
  await wrapper.find('textarea').setValue('Новый текст');
  expect(note.name).not.toBe('Черновик');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('save')?.[0]).toEqual(['Черновик', 'Новый текст']);
  await wrapper.find('.btn-note-cancel').trigger('click');
  expect(wrapper.emitted('cancel')).toHaveLength(1);
});
it('rejects blank tasks and accepts multiline tasks', async () => {
  const wrapper = mount(EntryForm, { props: { type: 'task' } });
  await wrapper.find('textarea').setValue(' ');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('save')).toBeUndefined();
  await wrapper.find('textarea').setValue('Один\nДва');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.emitted('save')?.[0]).toEqual(['Один\nДва', '']);
});
