import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import LayoutPicker from '@/components/LayoutPicker/LayoutPicker.vue';
it('selects list and grid preferences', async () => {
  const wrapper = mount(LayoutPicker, { props: { modelValue: '1' } });
  await wrapper.find('input[value="3"]').setValue(true);
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['3']);
  expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3);
});
