import { expect, it } from 'vitest';
import { getMenuPlacement } from '@/utils/menuPlacement';

it('opens below when the full menu fits and above when the bottom space is insufficient', () => {
	expect(getMenuPlacement({ top: 100, bottom: 140 }, 184, { top: 0, height: 900 })).toEqual({
		up: false,
		maxHeight: 740,
	});
	expect(getMenuPlacement({ top: 800, bottom: 840 }, 184, { top: 0, height: 900 })).toEqual({
		up: true,
		maxHeight: 780,
	});
});

it('uses the side with more room when neither side fits the full menu', () => {
	expect(getMenuPlacement({ top: 120, bottom: 160 }, 250, { top: 0, height: 300 })).toEqual({
		up: false,
		maxHeight: 120,
	});
	expect(getMenuPlacement({ top: 200, bottom: 240 }, 250, { top: 0, height: 400 })).toEqual({
		up: true,
		maxHeight: 180,
	});
});

it('accounts for the visible viewport offset and clamps available height to zero', () => {
	expect(getMenuPlacement({ top: 450, bottom: 490 }, 184, { top: 150, height: 400 })).toEqual({
		up: true,
		maxHeight: 280,
	});
	expect(getMenuPlacement({ top: 0, bottom: 40 }, 184, { top: 0, height: 40 })).toEqual({
		up: false,
		maxHeight: 0,
	});
});
