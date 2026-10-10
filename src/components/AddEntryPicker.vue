<script setup lang="ts">
	import type { ContainerType } from '@/types/notes';
	import IconMenu from '@/assets/icons/IconMenu.vue';

	const emit = defineEmits<{ choose: [type: ContainerType] }>();
	const choices: { type: ContainerType; label: string }[] = [
		{ type: 'folder', label: 'Добавить папку' },
		{ type: 'note', label: 'Добавить заметку' },
		{ type: 'checklist', label: 'Добавить перечень' },
	];
</script>

<template>
	<div class="todo__add-options">
		<button
			v-for="choice in choices"
			:key="choice.type"
			class="todo__add-option"
			type="button"
			@click="emit('choose', choice.type)"
		>
			<IconMenu :name="choice.type" />
			<span>{{ choice.label }}</span>
		</button>
	</div>
</template>

<style scoped>
	.todo__add-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.todo__add-option {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-height: 56px;
		padding: 12px;
		border: 1px solid var(--color-gray-border-light);
		border-radius: 8px;
		background: var(--color-gray-light);
		color: var(--color-gray-dark);
		font: inherit;
		font-size: 18px;
		line-height: 1.25;
		text-align: left;
		cursor: pointer;
		&:hover {
			background: var(--color-gray-hover-light);
		}
		&:focus-visible {
			outline: 2px solid var(--color-yellow);
			outline-offset: 2px;
		}
	}
</style>
