import { describe, expect, it, vi } from 'vitest';
import {
	getFromStorage,
	saveToStorage,
	removeFromStorage,
	getCachedItem,
	setCachedItem,
	browserStorage,
} from '@/utils/storage';
import { memoryStorage } from '../../fixtures';
import { APP_PREFIX } from '@/constants/storage';

describe('storage helpers', () => {
	it('namespaces data and reports write/removal failures', () => {
		const storage = memoryStorage();
		expect(saveToStorage('note', { text: 'Hello' }, storage)).toBe(true);
		expect(storage.getItem(APP_PREFIX + 'note')).toBe('{"text":"Hello"}');
		expect(getFromStorage('note', storage)).toEqual({ text: 'Hello' });
		expect(removeFromStorage('note', storage)).toBe(true);
		expect(getFromStorage('note', storage)).toBeNull();
		expect(saveToStorage('note', {}, null)).toBe(false);
		const broken = {
			getItem: () => {
				throw Error('blocked');
			},
			setItem: () => {
				throw Error('quota');
			},
			removeItem: () => {
				throw Error('blocked');
			},
		};
		expect(getFromStorage('note', broken)).toBeNull();
		expect(saveToStorage('note', {}, broken)).toBe(false);
		expect(removeFromStorage('note', broken)).toBe(false);
		expect(getFromStorage('bad', memoryStorage({ [APP_PREFIX + 'bad']: '{' }))).toBeNull();
	});
	it('expires cache at the boundary, never expiring ordinary notes', () => {
		vi.useFakeTimers();
		vi.setSystemTime(1000);
		const storage = memoryStorage();
		expect(setCachedItem('cache', 'text', 100, storage)).toBe(true);
		expect(getCachedItem('cache', storage)).toBe('text');
		vi.advanceTimersByTime(100);
		expect(getCachedItem('cache', storage)).toBeNull();
		expect(storage.getItem(APP_PREFIX + 'cache')).toBeNull();
		expect(() => setCachedItem('cache', 'text', -1, storage)).toThrow(TypeError);
		saveToStorage('notes', 'permanent', storage);
		vi.advanceTimersByTime(1000000);
		expect(getFromStorage('notes', storage)).toBe('permanent');
		saveToStorage('cache', { data: 'bad', timestamp: 'tomorrow' }, storage);
		expect(getCachedItem('cache', storage)).toBeNull();
	});
	it('handles unavailable browser storage', () => {
		expect(browserStorage()).toBe(localStorage);
		vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
			throw Error('blocked');
		});
		expect(browserStorage()).toBeNull();
	});
});
