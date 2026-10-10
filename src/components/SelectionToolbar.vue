<script setup lang="ts">
	import Button from '@/components/Button.vue';

	defineProps<{ count: number; total: number }>();
	const emit = defineEmits<{ all: []; remove: []; cancel: [] }>();
</script>

<template>
	<div class="todo__batch-actions">
		<span class="todo__selection-count" role="status">Выбрано: {{ count }}</span>
		<Button @click="emit('all')">
			{{ count && count === total ? 'Снять выбор' : 'Выбрать все' }}
		</Button>
		<Button danger :disabled="!count" @click="emit('remove')">Удалить выбранные</Button>
		<Button class="todo__cancel" @click="emit('cancel')">Отмена</Button>
	</div>
</template>

<style scoped>
	.todo__batch-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	.todo__selection-count {
		font-size: 14px;
		color: var(--color-gray);
	}
	.todo__cancel {
		background: var(--color-gray-light);
		color: var(--color-gray-dark);
	}
	@media (max-width: 480px) {
		.todo__batch-actions .button {
			padding: 8px;
			font-size: 16px;
		}
		.todo__batch-actions {
			gap: 6px;
		}
	}
</style>
