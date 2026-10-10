import { mount } from '@vue/test-utils';
import { defineComponent, h, provide, ref } from 'vue';
import { expect, it, vi } from 'vitest';
import { PWA_KEY } from '@/constants/pwa';
import { usePwa } from '@/composables/usePwa';
import type { PwaController } from '@/types/pwa';
import AppUpdatePrompt from '@/components/AppUpdatePrompt.vue';
import EntryForm from '@/components/EntryForm.vue';
import { fixture } from '../../fixtures';

const setup = (form = false) => {
	let pwa!: PwaController;
	const reload = vi.fn();
	const editing = ref(form);
	const wrapper = mount(
		defineComponent({
			setup() {
				pwa = usePwa({ enabled: false, reload });
				provide(PWA_KEY, pwa);
				return () =>
					h('main', [
						h(AppUpdatePrompt),
						editing.value
							? h(EntryForm, {
									type: 'note',
									entry: fixture().notes[0],
									inline: true,
									onCancel: () => {
										editing.value = false;
									},
								})
							: null,
					]);
			},
		}),
		{ attachTo: document.body },
	);
	return { wrapper, pwa, reload };
};

it('keeps the update available until the user postpones or accepts it', async () => {
	const { wrapper, pwa, reload } = setup();
	expect(wrapper.find('aside').exists()).toBe(false);
	pwa.needRefresh.value = true;
	await wrapper.vm.$nextTick();
	expect(wrapper.find('aside').text()).toContain('Доступна новая версия');
	await wrapper.findAll('aside button')[1].trigger('click');
	expect(wrapper.find('aside').exists()).toBe(false);
	expect(pwa.needRefresh.value).toBe(true);
	pwa.dismissed.value = false;
	await wrapper.vm.$nextTick();
	await wrapper.find('aside button').trigger('click');
	expect(reload).toHaveBeenCalledTimes(1);
});

it('protects actual form drafts and allows updating after reverting or cancelling them', async () => {
	const { wrapper, pwa, reload } = setup(true);
	pwa.needRefresh.value = true;
	await wrapper.vm.$nextTick();
	const original = wrapper.find('input').element.value;
	await wrapper.find('input').setValue('Не сохранено');
	await wrapper.find('aside button').trigger('click');
	expect(reload).not.toHaveBeenCalled();
	expect(wrapper.find('aside').text()).toContain('Сохраните изменения');
	await wrapper.find('input').setValue(original);
	expect(pwa.hasUnsavedChanges.value).toBe(false);
	await wrapper.find('textarea').setValue('Другой черновик');
	await wrapper.find('.btn-note-cancel').trigger('click');
	expect(pwa.hasUnsavedChanges.value).toBe(false);
	await wrapper.find('aside button').trigger('click');
	expect(reload).toHaveBeenCalledTimes(1);
});

it('displays installation instructions and closes the dialog', async () => {
	const { wrapper, pwa } = setup();
	await pwa.install();
	await wrapper.vm.$nextTick();
	expect(wrapper.find('dialog[open]').text()).toContain('На экран Домой');
	await wrapper.find('dialog .panel > button').trigger('click');
	expect(pwa.showInstallHelp.value).toBe(false);
});
