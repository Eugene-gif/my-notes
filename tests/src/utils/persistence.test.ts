import { expect, it, vi } from 'vitest';
import { persistNotes, restoreNotes } from '@/utils/persistence';
import { APP_PREFIX } from '@/constants/storage';
import { createEmptyState } from '@/utils/normalizeState';
import { fixture, memoryStorage } from '../../fixtures';

it('reads only the current state key and does not migrate unrelated records', () => {
	const storage = memoryStorage({ tasks: JSON.stringify([{ id: 'old', value: 'Old' }]) });
	const getItem = vi.spyOn(storage, 'getItem');
	expect(restoreNotes(storage)).toEqual(createEmptyState());
	expect(getItem.mock.calls).toEqual([[APP_PREFIX + 'state']]);
});
it('normalizes snapshots and falls back for broken data', () => {
	const storage = memoryStorage();
	persistNotes(fixture(), storage);
	expect(restoreNotes(storage)).toEqual(fixture());
	expect(JSON.parse(storage.getItem(APP_PREFIX + 'state')!)).toEqual({
		version: 1,
		state: fixture(),
	});
	storage.setItem(APP_PREFIX + 'state', '{');
	expect(restoreNotes(storage).tasks).toEqual([]);
});

it('rejects unsupported versions and malformed snapshots', () => {
	const storage = memoryStorage();
	for (const value of ['null', '{"version":2,"state":{}}', '{"version":1,"state":{}}']) {
		storage.setItem(APP_PREFIX + 'state', value);
		expect(restoreNotes(storage)).toEqual(createEmptyState());
	}
});
