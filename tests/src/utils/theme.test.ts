import { expect, it, vi } from 'vitest';
import { applyTheme } from '@/utils/theme';

it('applies both themes to the document without replacing other attributes', () => {
	document.documentElement.lang = 'ru';
	applyTheme('dark');
	expect(document.documentElement.dataset.theme).toBe('dark');
	applyTheme('light');
	expect(document.documentElement.dataset.theme).toBe('light');
	expect(document.documentElement.lang).toBe('ru');
});

it('supports a custom root and an unavailable document', () => {
	const root = document.createElement('div');
	applyTheme('dark', root);
	expect(root.dataset.theme).toBe('dark');
	expect(document.documentElement.dataset.theme).toBeUndefined();
	expect(() => applyTheme('dark', null)).not.toThrow();
});

it('uses the theme CSS color for the installed application toolbar', () => {
	const meta = document.createElement('meta');
	meta.name = 'theme-color';
	document.head.append(meta);
	const root = document.createElement('div');
	root.style.setProperty('--color-gray-light', '#111827');
	applyTheme('dark', root);
	expect(meta.content).toBe('#111827');
	root.style.setProperty('--color-gray-light', '#f5f5f5');
	applyTheme('light', root);
	expect(meta.content).toBe('#f5f5f5');
	meta.remove();
});

it('does not access the DOM during server rendering', () => {
	const browserDocument = document;
	vi.stubGlobal('document', undefined);
	try {
		expect(() => applyTheme('dark')).not.toThrow();
	} finally {
		vi.stubGlobal('document', browserDocument);
	}
});
