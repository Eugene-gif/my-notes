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

it('does not access the DOM during server rendering', () => {
	const browserDocument = document;
	vi.stubGlobal('document', undefined);
	try {
		expect(() => applyTheme('dark')).not.toThrow();
	} finally {
		vi.stubGlobal('document', browserDocument);
	}
});
