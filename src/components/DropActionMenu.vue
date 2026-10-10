<script setup lang="ts">
	import { computed, nextTick, onMounted, onScopeDispose, ref } from 'vue';
	import type { PendingDrop } from '@/types/notes';
	import { useNotesStore } from '@/store/notesStore';
	import { canPlaceEntries, canSwapEntries } from '@/utils/entries';
	import { clampMenuPoint } from '@/utils/dropTarget';
	import IconMenu from '@/assets/icons/IconMenu.vue';

	const props = defineProps<{ pending: PendingDrop }>();
	const emit = defineEmits<{ choose: [type: 'move' | 'swap']; cancel: [] }>();
	const notes = useNotesStore();
	const menu = ref<HTMLElement | null>(null);
	let disposed = false;
	const point = ref({ x: 12, y: 12 });
	const target = computed(() => notes.entry(props.pending.destination.parentId));
	const canMove = computed(
		() =>
			target.value?.type === 'folder' &&
			canPlaceEntries(notes.state, props.pending.ids, target.value.id),
	);
	const canSwap = computed(
		() =>
			props.pending.ids.length === 1 &&
			!!target.value &&
			canSwapEntries(notes.state, props.pending.ids[0], target.value.id),
	);

	const position = () => {
		const box = menu.value?.getBoundingClientRect();
		if (box)
			point.value = clampMenuPoint(props.pending.destination.dropPoint ?? { x: 12, y: 12 }, box, {
				width: innerWidth,
				height: innerHeight,
			});
	};

	const outside = (event: PointerEvent) => {
		if (event.target instanceof Node && !menu.value?.contains(event.target)) emit('cancel');
	};

	const keyboard = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			emit('cancel');
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const items = [
			...(menu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
		];
		const index = items.indexOf(document.activeElement as HTMLButtonElement);
		items[
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? items.length - 1
					: (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
		]?.focus();
	};

	onMounted(async () => {
		await nextTick();
		if (disposed) return;
		position();
		menu.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
		window.addEventListener('resize', position);
		document.addEventListener('pointerdown', outside);
		document.addEventListener('keydown', keyboard);
	});
	onScopeDispose(() => {
		disposed = true;
		window.removeEventListener('resize', position);
		document.removeEventListener('pointerdown', outside);
		document.removeEventListener('keydown', keyboard);
	});
</script>

<template>
	<Teleport to="body">
		<div
			ref="menu"
			class="folder__menu todo__drop-choice"
			role="menu"
			aria-label="Действие после переноса"
			:style="{ left: point.x + 'px', top: point.y + 'px' }"
		>
			<button
				v-if="target?.type === 'folder'"
				class="folder__menu-action"
				type="button"
				role="menuitem"
				:disabled="!canMove"
				@click="emit('choose', 'move')"
			>
				<IconMenu name="move" />
				Переместить в папку
			</button>
			<button
				class="folder__menu-action"
				type="button"
				role="menuitem"
				:disabled="!canSwap"
				@click="emit('choose', 'swap')"
			>
				<IconMenu name="swap" />
				Поменять местами
			</button>
			<button class="folder__menu-action" type="button" role="menuitem" @click="emit('cancel')">
				Отмена
			</button>
		</div>
	</Teleport>
</template>

<style scoped>
	.folder__menu-action {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-radius: 4px;
		background: var(--color-transparent);
		color: var(--color-gray-dark);
		font: inherit;
		font-size: 16px;
		line-height: 1.25;
		white-space: nowrap;
		text-align: left;
		cursor: pointer;

		&.is-danger {
			color: var(--color-red);
		}

		&:hover,
		&:focus-visible {
			background-color: var(--color-gray-light);
		}
	}
	.todo__drop-choice {
		position: absolute;
		top: 54px;
		right: 10px;
		z-index: 6;
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 180px;
		max-width: calc(100% - 20px);
		padding: 4px;
		border: 1px solid var(--color-gray-border-light);
		border-radius: 8px;
		background: var(--color-white);
		box-shadow: 0 6px 18px var(--color-shadow-medium);
		transform-origin: top right;
		&.is-menu-closing {
			pointer-events: none;
		}

		&[hidden] {
			display: none;
		}
	}
	.todo__drop-choice {
		position: fixed;
		top: 0;
		left: 0;
		right: auto;
		z-index: 10000;
		width: 240px;
		max-width: calc(100vw - 24px);
		max-height: calc(100dvh - 24px);
		overflow-y: auto;
	}
	.todo__drop-choice .folder__menu-action {
		font-size: 13px;
	}
	.folder__menu-action:disabled {
		opacity: 0.45;
		cursor: default;
	}
</style>
