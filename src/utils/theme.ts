import type { Theme } from '@/types/notes';

export const applyTheme = (
	theme: Theme,
	root = typeof document === 'undefined' ? null : document.documentElement,
) => {
	if (root) root.dataset.theme = theme;
};
