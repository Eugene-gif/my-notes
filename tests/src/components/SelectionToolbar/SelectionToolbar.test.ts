import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import SelectionToolbar from '@/components/SelectionToolbar/SelectionToolbar.vue';
it('prevents empty deletion and emits group actions', async () => {
  const wrapper = mount(SelectionToolbar, { props: { count: 0, total: 3 } });
  await wrapper.findAll('button')[1].trigger('click');
  expect(wrapper.emitted('remove')).toBeUndefined();
  await wrapper.setProps({ count: 3 });
  expect(wrapper.text()).toContain('Снять выбор');
  const buttons = wrapper.findAll('button');
  await buttons[0].trigger('click');
  await buttons[1].trigger('click');
  await buttons[2].trigger('click');
  expect(wrapper.emitted('all')).toHaveLength(1);
  expect(wrapper.emitted('remove')).toHaveLength(1);
  expect(wrapper.emitted('cancel')).toHaveLength(1);
});
