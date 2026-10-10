<script setup lang="ts">
	import type { Layout } from '@/types/notes';

	const value = defineModel<Layout>({ required: true });
	const choices: Layout[] = ['1', '2', '3'];
</script>

<template>
	<div class="todo__layout layout-picker" role="group" aria-label="Вид элементов">
		<label v-for="columns in choices" :key="columns" class="todo__layout-option">
			<input
				v-model="value"
				type="radio"
				name="layout"
				:value="columns"
				:aria-label="columns === '1' ? 'Список' : columns + ' колонки'"
			/>
			<span class="todo__layout-icon" :style="{ '--icon-columns': columns }" aria-hidden="true">
				<span v-for="index in Number(columns) * 2" :key="index" />
			</span>
			<span class="todo__layout-name">{{ columns === '1' ? 'Список' : columns + ' колонки' }}</span>
		</label>
	</div>
</template>

<style scoped>
	.todo__layout {
		display: flex;
		gap: 4px;
		padding: 4px;
		border: 1px solid var(--color-gray-border-light);
		border-radius: 12px;
		background-color: var(--color-gray-light);
	}

	.todo__layout-option {
		position: relative;
		display: grid;
		place-items: center;
		width: 36px;
		height: 32px;
		border-radius: 8px;
		color: var(--color-gray);
		cursor: pointer;
		transition:
			color 0.2s,
			background-color 0.2s;

		input {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			opacity: 0;
			cursor: pointer;
			margin: 0;
		}

		&:has(input:checked) {
			background-color: var(--color-gray-dark);
			color: var(--color-white);
		}

		&:has(input:focus-visible) {
			outline: 2px solid var(--color-yellow);
			outline-offset: 2px;
		}

		@media (hover: hover) {
			&:hover {
				background-color: var(--color-gray-hover-light);
				color: var(--color-gray-dark);
			}

			&:has(input:checked):hover {
				background-color: var(--color-gray-hover);
				color: var(--color-white);
			}
		}
	}

	.todo__layout-icon {
		display: grid;
		grid-template-columns: repeat(var(--icon-columns), minmax(0, 1fr));
		gap: 3px;
		width: 22px;
		height: 18px;
		pointer-events: none;

		span {
			border: 1.5px solid currentColor;
			border-radius: 2px;
		}
	}

	.layout-picker {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.todo__layout {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		padding: 8px;
	}
	.todo__layout-option {
		width: auto;
		height: 108px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}
	.todo__layout-icon {
		width: 48px;
		height: 36px;
		gap: 5px;
	}
	.todo__layout-name {
		font-size: 14px;
	}
	@media (max-width: 480px) {
		.todo__layout-name {
			font-size: 12px;
		}
		.todo__layout-icon {
			width: 36px;
		}
	}
</style>
