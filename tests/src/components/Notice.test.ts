import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Notice from '@/components/Notice.vue';
import { useNoticesStore } from '@/store/noticesStore';

it('announces errors, escapes messages and allows manual close', async () => {
	vi.useFakeTimers();
	const wrapper = mount(Notice, { attachTo: document.body });
	const store = useNoticesStore();
	store.show('<img src=x>', 'error', { duration: 0 });
	await nextTick();
	await nextTick();
	const host = document.querySelector('.notice-host')!;
	expect(host.getAttribute('role')).toBe('alert');
	expect(host.textContent).toContain('<img src=x>');
	expect(host.querySelector('img')).toBeNull();
	(host.querySelector('button') as HTMLButtonElement).click();
	vi.advanceTimersByTime(160);
	await nextTick();
	expect(store.current).toBeNull();
	wrapper.unmount();
});
it('moves into an active modal while remaining visible', async () => {
	const wrapper = mount(Notice, { attachTo: document.body });
	const dialog = document.createElement('dialog');
	document.body.append(dialog);
	dialog.showModal();
	useNoticesStore().show('Поверх диалога', 'info', { duration: 0 });
	await nextTick();
	await nextTick();
	expect(dialog.querySelector('.notice-host')).not.toBeNull();
	dialog.close();
	await nextTick();
	await nextTick();
	wrapper.unmount();
});
