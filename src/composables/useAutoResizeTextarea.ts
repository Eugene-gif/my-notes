import { onMounted, onScopeDispose, watch, nextTick, type Ref } from 'vue';
export function useAutoResizeTextarea(field: Ref<HTMLTextAreaElement | null>, value: Ref<string>) {
	let observer: ResizeObserver | undefined;
	let lastWidth = -1;
	function resize() {
		const area = field.value;
		if (!area || !area.getClientRects().length) return;
		const boundary = area.closest<HTMLElement>('[data-textarea-boundary]');
		if (boundary) {
			const styles = getComputedStyle(boundary);
			const occupied = [...boundary.children]
				.filter((child) => child !== area)
				.reduce((sum, child) => {
					const css = getComputedStyle(child);
					return (
						sum +
						child.getBoundingClientRect().height +
						(parseFloat(css.marginTop) || 0) +
						(parseFloat(css.marginBottom) || 0)
					);
				}, 0);
			const max = parseFloat(styles.maxHeight);
			const spacing =
				(parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
			if (Number.isFinite(max))
				area.style.setProperty(
					'--textarea-available-height',
					Math.max(0, max - occupied - spacing) + 'px',
				);
		}
		area.style.height = 'auto';
		const css = getComputedStyle(area);
		const needed =
			area.scrollHeight +
			(parseFloat(css.borderTopWidth) || 0) +
			(parseFloat(css.borderBottomWidth) || 0);
		const height = Math.max(
			parseFloat(css.minHeight) || 0,
			Math.min(needed, parseFloat(css.maxHeight) || Infinity),
		);
		area.style.height = height + 'px';
		area.style.overflowY = needed > height ? 'auto' : 'hidden';
	}
	watch(value, () => nextTick(resize));
	onMounted(() => {
		observer = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width;
			if (width !== undefined && width !== lastWidth) {
				lastWidth = width;
				resize();
			}
		});
		if (field.value) observer.observe(field.value);
		window.addEventListener('resize', resize);
		window.visualViewport?.addEventListener('resize', resize);
		resize();
	});
	onScopeDispose(() => {
		observer?.disconnect();
		window.removeEventListener('resize', resize);
		window.visualViewport?.removeEventListener('resize', resize);
	});
	return { resize };
}
