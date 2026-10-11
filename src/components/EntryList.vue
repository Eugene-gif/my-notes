<script setup lang="ts">
	import { computed, ref } from 'vue';
	import type { Entry, Layout, ParentId } from '@/types/notes';
	import { useCardLayout } from '@/composables/useCardLayout';
	import TaskCard from '@/components/TaskCard.vue';
	import ContainerCard from '@/components/ContainerCard.vue';
	import IconMenu from '@/assets/icons/IconMenu.vue';
	import Button from '@/components/Button.vue';

	const props = defineProps<{
		entries: Entry[];
		currentId: ParentId;
		checklist: boolean;
		layout: Layout;
		selecting: boolean;
		selectionDisabled?: boolean;
		selected: Set<string>;
		highlight?: string;
	}>();

	const emit = defineEmits<{
		toggle: [id: string];
		select: [id: string];
		open: [id: string];
		action: [action: string, id: string];
		add: [position: 'before' | 'after'];
		'add-entry': [];
	}>();

	const list = ref<HTMLElement | null>(null);
	const version = computed(() => [props.entries, props.layout]);
	useCardLayout(list, version);
</script>

<template>
	<ul
		ref="list"
		class="todo__list"
		:data-layout="checklist ? '1' : layout"
		:data-drop-folder="currentId ?? ''"
	>
		<li v-if="checklist" class="todo__add-card item">
			<button
				class="todo__add-task"
				type="button"
				:disabled="selecting"
				@click="emit('add', 'before')"
			>
				<IconMenu name="add" />
				<span>Добавить задачу</span>
			</button>
		</li>
		<template v-for="entry in entries" :key="entry.id">
			<TaskCard
				v-if="entry.type === 'task'"
				:entry="entry"
				:selecting="selecting"
				:selection-disabled="selectionDisabled"
				:selected="selected.has(entry.id)"
				:class="{ 'is-search-result': highlight === entry.id }"
				@toggle="emit('toggle', $event)"
				@select="emit('select', $event)"
				@action="(action, id) => emit('action', action, id)"
			/>
			<ContainerCard
				v-else
				:entry="entry"
				:selecting="selecting"
				:selection-disabled="selectionDisabled"
				:selected="selected.has(entry.id)"
				@open="emit('open', $event)"
				@select="emit('select', $event)"
				@action="(action, id) => emit('action', action, id)"
			/>
		</template>
		<li v-if="checklist" class="todo__add-card item">
			<button
				class="todo__add-task"
				type="button"
				:disabled="selecting"
				@click="emit('add', 'after')"
			>
				<IconMenu name="add" />
				<span>Добавить задачу</span>
			</button>
		</li>
	</ul>
	<div
		v-if="!entries.length && !checklist"
		class="todo__empty-folder"
		:data-drop-folder="currentId ?? ''"
	>
		<p class="todo__list-empty">{{ currentId ? 'Папка пуста' : 'Список пуст' }}</p>
		<Button :disabled="selecting" @click="emit('add-entry')">
			<IconMenu name="add" />
			Добавить
		</Button>
	</div>
</template>

<style scoped>
	.todo__empty-folder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.todo__list-empty {
		margin: 0;
		font-size: 20px;
	}
	.todo__add-card {
		touch-action: pan-y pinch-zoom;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-gray-border);
		padding: 10px;
		border-radius: 12px;
		gap: 5px;
		min-width: 0;
		height: 100px;
		box-sizing: border-box;
	}
	.todo__list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		align-items: start;
		gap: 10px;
	}
	.todo__list:is([data-layout='2'], [data-layout='3']) {
		grid-auto-rows: 1px;
		grid-auto-flow: row dense;
		row-gap: 0;
	}
	.todo__list:is([data-layout='2'], [data-layout='3']) > .item {
		grid-column: var(--card-column, auto);
		grid-row-end: span var(--card-row-span, 1);
	}
	.todo__add-card {
		height: 40px;
		border-style: dashed;
		background: var(--color-gray-extra-light);
		padding: 0;
	}
	.todo__add-task {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		height: 100%;
		padding: 6px 12px;
		border-radius: 12px;
		background: var(--color-transparent);
		color: var(--color-gray);
		font: inherit;
		font-size: 18px;
		line-height: 1.2;
		cursor: pointer;
		&:hover:not(:disabled) {
			background: var(--color-gray-light);
			color: var(--color-gray-dark);
		}
		&:focus-visible {
			outline: 2px solid var(--color-yellow);
			outline-offset: 2px;
		}
	}
	.todo__add-task:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.is-drag-source {
		opacity: 0.4;
	}

	.todo__list {
		--columns: 1;
	}

	.todo__list[data-layout='2'] {
		--columns: 2;
	}

	.todo__list[data-layout='3'] {
		--columns: 3;
	}

	@container todo (max-width: 680px) {
		.todo__list[data-layout='3'] {
			--columns: 2;
		}
	}

	@container todo (max-width: 480px) {
		.todo__list[data-layout] {
			--columns: 1;
		}
	}
	.is-search-result {
		outline: 2px solid var(--color-yellow);
		outline-offset: 2px;
	}
</style>
