import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

export const withSetup = <T>(setup: () => T) => {
	let result!: T;
	const wrapper = mount(
		defineComponent({
			setup() {
				result = setup();

				return () => h('div');
			},
		}),
	);

	return { result, wrapper };
};
