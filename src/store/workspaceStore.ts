import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Layout, Theme } from '@/types/notes';
import { browserStorage, getFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';
import { useNoticesStore } from './noticesStore';

export const useWorkspaceStore = defineStore('workspace', () => {
	const layout = ref<Layout>('1');
	const theme = ref<Theme>('light');
	const notices = useNoticesStore();

	const initialize = () => {
		const storage = browserStorage();
		const saved = getFromStorage<string>(STORAGE_KEYS.layout, storage);

		if (saved === '1' || saved === '2' || saved === '3') layout.value = saved;
		const savedTheme = getFromStorage<unknown>(STORAGE_KEYS.theme, storage);
		theme.value = savedTheme === 'dark' ? 'dark' : 'light';
	};

	const setLayout = (value: Layout) => {
		if (!saveToStorage(STORAGE_KEYS.layout, value)) {
			notices.show('Не удалось сохранить вид списка.', 'error');

			return false;
		}
		layout.value = value;
		notices.show('Вид списка сохранён.', 'success');

		return true;
	};

	const toggleTheme = () => {
		theme.value = theme.value === 'light' ? 'dark' : 'light';
		const saved = saveToStorage(STORAGE_KEYS.theme, theme.value);
		if (!saved) notices.show('Тема изменена, но не сохранена для следующего запуска.', 'error');

		return saved;
	};

	return { layout, theme, initialize, setLayout, toggleTheme };
});
