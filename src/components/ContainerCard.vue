<script setup lang="ts">
	import { computed, ref } from 'vue';
	import type { Container, MenuAction } from '@/types/notes';
	import { useNotesStore } from '@/store/notesStore';
	import IconContainer from '@/assets/icons/IconContainer.vue';
	import { getChildren, getChecklistStats } from '@/utils/entries';
	import { elementCount, taskCount, containerNoun } from '@/utils/format';
	import ActionMenu from '@/components/ActionMenu.vue';

	const props = defineProps<{
		entry: Container;
		selecting?: boolean;
		selected?: boolean;
		selectionDisabled?: boolean;
	}>();
	const emit = defineEmits<{
		open: [id: string];
		select: [id: string];
		action: [action: string, id: string];
	}>();
	const notes = useNotesStore();
	const menuOpen = ref(false);
	const stats = computed(() =>
		props.entry.type === 'checklist' ? getChecklistStats(notes.state, props.entry.id) : null,
	);
	const summary = computed(() =>
		props.entry.type === 'note'
			? props.entry.description || 'Нет описания'
			: stats.value
				? taskCount(stats.value.total) +
					(stats.value.total ? ` · Выполнено ${stats.value.completed}/${stats.value.total}` : '')
				: elementCount(getChildren(notes.state, props.entry.id).length),
	);
	const actions = computed<MenuAction[]>(() => [
		{ id: props.entry.type === 'note' ? 'edit-note' : 'rename', label: 'Изменить' },
		{ id: 'open', label: 'Открыть' },
		{ id: 'select', label: 'Выбрать', disabled: props.selectionDisabled },
		{ id: 'delete', label: 'Удалить ' + containerNoun(props.entry.type), danger: true },
	]);

	const activate = () =>
		props.selecting ? emit('select', props.entry.id) : emit('open', props.entry.id);
</script>

<template>
	<li
		class="item folder todo__item"
		:class="[entry.type, { 'is-selected': selected, 'has-open-menu': menuOpen }]"
		:data-id="entry.id"
		:data-drop-folder="entry.type !== 'note' ? entry.id : undefined"
		:data-status="stats?.status"
		@click="activate"
	>
		<button
			v-if="selecting"
			type="button"
			class="item__selection"
			:aria-pressed="!!selected"
			:aria-label="'Выбрать ' + entry.name"
			@click.stop="emit('select', entry.id)"
		>
			{{ selected ? '✔' : '' }}
		</button>
		<button
			type="button"
			class="folder__open"
			:aria-label="'Открыть ' + containerNoun(entry.type) + ' «' + entry.name + '»'"
			@click.stop="activate"
		>
			<IconContainer class="folder__icon" :entry="entry" />
			<span class="folder__text">
				<span class="folder__title">{{ entry.name }}</span>
				<span class="folder__count">{{ summary }}</span>
			</span>
		</button>
		<ActionMenu
			v-if="!selecting"
			:actions="actions"
			:label="'Действия «' + entry.name + '»'"
			@action="(action) => emit('action', action, entry.id)"
			@open-change="menuOpen = $event"
		/>
	</li>
</template>

<style scoped>
	.item {
		touch-action: pan-y pinch-zoom;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-gray-border);
		padding: 10px 14px;
		border-radius: 12px;
		gap: 5px;
		min-width: 0;
		height: var(--card-height);
		box-sizing: border-box;

		.item__text {
			overflow-wrap: anywhere;
		}
	}

	.folder {
		position: relative;
		align-items: center;
		gap: 10px;
		background-color: var(--color-white);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;

		&.checklist {
			border-color: var(--color-gray-border-light);
			box-shadow: 0 6px 24px var(--color-shadow);
		}

		&.checklist[data-status='complete'] {
			.folder__icon {
				color: var(--color-green);
			}
			background-color: var(--color-green-light);
			border-color: var(--color-green-border);
		}

		&.checklist[data-status='partial'] {
			.folder__icon {
				color: var(--color-yellow);
			}
			background-color: var(--color-yellow-light);
			border-color: var(--color-yellow-border);
		}

		&.has-open-menu {
			z-index: 5;
		}
	}

	.folder__open {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1 1 auto;
		min-width: 0;
		padding: 0;
		background: var(--color-transparent);
		color: var(--color-gray-dark);
		font: inherit;
		text-align: left;
		cursor: pointer;
		border-radius: 6px;
	}

	.folder__icon {
		flex: 0 0 32px;
		width: 32px;
		height: 32px;
		cursor: pointer;
		touch-action: pan-y pinch-zoom;
		user-select: none;
	}

	.folder__text {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		gap: 2px;
		min-width: 0;
	}

	.folder__title {
		font-weight: 600;
		line-height: 20px;
	}

	.folder__count {
		color: var(--color-gray);
		font-size: 12px;
		line-height: 14px;
	}

	.folder__title,
	.folder__count {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.is-selected {
		outline: 2px solid var(--color-yellow);
		outline-offset: 1px;
		background: var(--color-yellow-light) !important;
	}
	.item__selection {
		display: grid;
		place-items: center;
		flex: 0 0 22px;
		width: 22px;
		height: 22px;
		border: 1px solid var(--color-gray-muted);
		border-radius: 6px;
		color: var(--color-selection-text);
		background: var(--color-white);
		cursor: pointer;
		&[aria-pressed='true'] {
			border-color: var(--color-yellow);
			background: var(--color-yellow);
		}
	}
	.folder__open:focus-visible {
		outline: 2px solid var(--color-yellow);
		outline-offset: 2px;
	}
</style>
