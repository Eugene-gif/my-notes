import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import AddEntryPicker from '@/components/AddEntryPicker/AddEntryPicker.vue';
it('offers each supported container type', async () => {
  const wrapper = mount(AddEntryPicker);
  const choices = wrapper.findAll('button');
  expect(choices).toHaveLength(3);
  for (const choice of choices) await choice.trigger('click');
  expect(wrapper.emitted('choose')).toEqual([['folder'], ['note'], ['checklist']]);
});
