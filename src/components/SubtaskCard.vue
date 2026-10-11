<script setup lang="ts">
	import type { Subtask } from '@/types/notes';
	import IconTaskStatus from '@/assets/icons/IconTaskStatus.vue';
	import { taskStatusLabel } from '@/utils/taskStatus';

	defineProps<{ entry: Subtask }>();
	const emit = defineEmits<{ toggle: [id: string] }>();
</script>

<template>
	<li class="subtask" :data-status="entry.status" data-no-drag>
		<button
			type="button"
			class="subtask__toggle"
			:aria-pressed="entry.status === 'in-progress' ? 'mixed' : entry.status === 'completed'"
			:aria-label="
				entry.value + '. Статус: ' + taskStatusLabel(entry.status) + '. Изменить статус подзадачи'
			"
			@click.stop="emit('toggle', entry.id)"
		>
			<span class="subtask__status"><IconTaskStatus :status="entry.status" /></span>
			<span class="subtask__text">{{ entry.value }}</span>
		</button>
	</li>
</template>

<style scoped>
	.subtask {
		border: 1px solid var(--color-gray-border-light);
		border-radius: 10px;
		background: var(--color-white);
		box-shadow: 0 3px 12px var(--color-shadow);
	}
	.subtask__toggle {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		width: 100%;
		min-height: 44px;
		padding: 9px 10px;
		border-radius: inherit;
		background: var(--color-transparent);
		color: var(--color-gray-dark);
		font: inherit;
		text-align: left;
		cursor: pointer;
		touch-action: pan-y pinch-zoom;
	}
	.subtask__toggle:focus-visible {
		outline: 2px solid var(--color-yellow);
		outline-offset: 2px;
	}
	.subtask__status {
		display: block;
		width: 24px;
		height: 24px;
		flex: 0 0 24px;
		color: var(--color-green);
	}
	.subtask__status :deep(.icon) {
		width: 24px;
		height: 24px;
	}
	.subtask__text {
		min-width: 0;
		font-size: 14px;
		line-height: 20px;
		padding: 2px 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.subtask[data-status='in-progress'] {
		background: var(--color-yellow-light);
		border-color: var(--color-yellow-border);
	}
	.subtask[data-status='in-progress'] .subtask__status {
		color: var(--color-yellow);
	}
	.subtask[data-status='completed'] {
		background: var(--color-green-light);
		border-color: var(--color-green-border);
	}
	.subtask[data-status='completed'] .subtask__text {
		color: var(--color-gray);
		text-decoration: line-through;
	}
</style>
