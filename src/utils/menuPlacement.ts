const getMenuPlacement = (
	trigger: { top: number; bottom: number },
	height: number,
	viewport: { top: number; height: number },
) => {
	const clearance = 8 + 12;
	const below = Math.max(0, viewport.top + viewport.height - trigger.bottom - clearance);
	const above = Math.max(0, trigger.top - viewport.top - clearance);
	const up = height > below && (height <= above || above > below);

	return { up, maxHeight: Math.floor(up ? above : below) };
};

export { getMenuPlacement };
