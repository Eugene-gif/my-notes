import { defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { PWA_KEY } from '@/constants/pwa';
import { useUnsavedChanges } from '@/composables/useUnsavedChanges';
import { usePwa } from '@/composables/usePwa';
import type { PwaController } from '@/types/pwa';
import { withSetup } from '../../composable';

it('tracks multiple reactive drafts and removes only the disposed form', async () => {
	const first = ref(false);
	const second = ref(false);
	const visible = ref(true);
	let pwa!: PwaController;
	const Form = defineComponent({
		props: { second: Boolean },
		setup(props) {
			useUnsavedChanges(props.second ? second : first);
			return () => h('div');
		},
	});
	const wrapper = mount(
		defineComponent({
			setup() {
				pwa = usePwa({ enabled: false });
				provide(PWA_KEY, pwa);
				return () => h('main', [visible.value ? h(Form) : null, h(Form, { second: true })]);
			},
		}),
	);
	expect(pwa.hasUnsavedChanges.value).toBe(false);
	first.value = true;
	second.value = true;
	visible.value = false;
	await wrapper.vm.$nextTick();
	expect(pwa.hasUnsavedChanges.value).toBe(true);
	second.value = false;
	expect(pwa.hasUnsavedChanges.value).toBe(false);
	const unload = new Event('beforeunload', { cancelable: true });
	window.dispatchEvent(unload);
	expect(unload.defaultPrevented).toBe(false);
});

it('supports standalone forms without a PWA provider', () => {
	expect(() => withSetup(() => useUnsavedChanges(ref(true)))).not.toThrow();
});
