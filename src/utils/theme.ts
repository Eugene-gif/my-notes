import type { Theme } from '@/types/notes';

export const applyTheme = (
	theme: Theme,
	root = typeof document === 'undefined' ? null : document.documentElement,
) => {
	if (!root) return;
	root.dataset.theme = theme;
	const color = root.ownerDocument.defaultView
		?.getComputedStyle(root)
		.getPropertyValue('--color-gray-light')
		.trim();
	if (color)
		root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
};
