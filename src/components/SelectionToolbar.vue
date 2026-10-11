<script setup lang="ts">
	import Button from '@/components/Button.vue';

	defineProps<{ count: number; total: number; pasting?: boolean; canPaste?: boolean }>();
	const emit = defineEmits<{ all: []; remove: []; copy: []; paste: []; cancel: [] }>();
</script>

<template>
	<div class="todo__batch-actions">
		<span class="todo__selection-count" role="status">
			{{ pasting ? 'Скопировано' : 'Выбрано' }}: {{ count }}
		</span>
		<Button v-if="pasting" :aria-disabled="!canPaste" @click="emit('paste')">Вставить</Button>
		<template v-else>
			<Button @click="emit('all')">
				{{ count && count === total ? 'Снять выбор' : 'Выбрать все' }}
			</Button>
			<Button danger :disabled="!count" @click="emit('remove')">Удалить выбранные</Button>
			<Button :disabled="!count" @click="emit('copy')">Скопировать</Button>
		</template>
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
	.todo__batch-actions .button {
		height: 30px;
		padding: 4px 12px;
	}
	.todo__cancel {
		background: var(--color-gray-light);
		color: var(--color-gray-dark);
	}
	@media (max-width: 480px) {
		.todo__batch-actions .button {
			padding: 4px 8px;
			font-size: 16px;
		}
		.todo__batch-actions {
			gap: 6px;
		}
	}
</style>
