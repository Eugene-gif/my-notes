import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { expect, it } from 'vitest';
import App from '@/App.vue';
import { createAppRouter } from '@/router';

it('mounts the routed workspace and global notice host', async () => {
	const pinia = createPinia();
	const router = createAppRouter(pinia, createMemoryHistory());
	await router.push('/');
	await router.isReady();
	const wrapper = mount(App, { global: { plugins: [pinia, router] } });
	expect(wrapper.find('.todo').exists()).toBe(true);
	expect(wrapper.find('h1').text()).toBe('My notes');
});
