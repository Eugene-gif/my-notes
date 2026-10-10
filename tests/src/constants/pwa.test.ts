import { expect, it } from 'vitest';
import { PWA_NAVIGATION_DENYLIST } from '@/constants/pwa';

it.each([
	'/',
	'/entry/note',
	'/entry/note?utm_source=example.com',
	'/entry/note?redirect=https://example.com/assets/app.js',
	'/entry/note?redirect=/api/items',
	'/notes/entry/note?utm_source=example.com',
	'/notes.v1/entry/note?source=example.com',
])('keeps application navigation available offline: %s', (path) => {
	const url = new URL(path, 'https://notes.example');
	expect(PWA_NAVIGATION_DENYLIST.some((pattern) => pattern.test(url.pathname + url.search))).toBe(
		false,
	);
});

it.each([
	'/api/items',
	'/notes/api/items?source=example.com',
	'/assets/app.js',
	'/assets/app.js?version=1.2&redirect=/entry/note',
	'/notes/icons/icon-192.png?version=1.2',
	'/manifest.webmanifest?version=1.2',
])('excludes API and file requests from the HTML fallback: %s', (path) => {
	const url = new URL(path, 'https://notes.example');
	expect(PWA_NAVIGATION_DENYLIST.some((pattern) => pattern.test(url.pathname + url.search))).toBe(
		true,
	);
});
