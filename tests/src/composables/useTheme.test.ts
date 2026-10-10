import { effectScope, ref } from 'vue';
import { expect, it } from 'vitest';
import type { Theme } from '@/types/notes';
import { useTheme } from '@/composables/useTheme';

it('applies the initial theme, follows changes and releases the watcher', () => {
	const theme = ref<Theme>('dark');
	const scope = effectScope();
	scope.run(() => useTheme(theme));
	expect(document.documentElement.dataset.theme).toBe('dark');
	theme.value = 'light';
	expect(document.documentElement.dataset.theme).toBe('light');
	scope.stop();
	theme.value = 'dark';
	expect(document.documentElement.dataset.theme).toBe('light');
});
