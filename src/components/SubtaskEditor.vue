<script setup lang="ts">
	import { nextTick, ref, useId } from 'vue';
	import type { Subtask } from '@/types/notes';
	import Input from '@/components/Input.vue';
	import Button from '@/components/Button.vue';
	import IconMenu from '@/assets/icons/IconMenu.vue';

	const subtasks = defineModel<Subtask[]>({ required: true });
	const root = ref<HTMLElement | null>(null);
	const prefix = useId();
	const add = async () => {
		subtasks.value = [
			...subtasks.value,
			{ id: crypto.randomUUID(), value: '', status: 'pending', completed: false },
		];
		await nextTick();
		const fields = root.value?.querySelectorAll('input');
		fields?.[fields.length - 1]?.focus();
	};
	const remove = (id: string) => {
		subtasks.value = subtasks.value.filter((subtask) => subtask.id !== id);
	};
	const update = (id: string, value: string) => {
		subtasks.value = subtasks.value.map((subtask) =>
			subtask.id === id ? { ...subtask, value } : subtask,
		);
	};
</script>

<template>
	<section ref="root" class="subtask-editor" aria-label="Подзадачи">
		<ul v-if="subtasks.length" class="subtask-editor__list">
			<li v-for="(subtask, index) in subtasks" :key="subtask.id" class="subtask-editor__row">
				<div class="subtask-editor__field">
					<Input
						:id="prefix + '-subtask-' + subtask.id"
						:model-value="subtask.value"
						:label="'Подзадача ' + (index + 1)"
						placeholder="Введите подзадачу"
						required
						@update:model-value="update(subtask.id, $event)"
					/>
				</div>
				<Button
					danger
					class="subtask-editor__remove"
					:aria-label="'Удалить подзадачу ' + (index + 1)"
					@click="remove(subtask.id)"
				>
					<IconMenu name="delete" />
				</Button>
			</li>
		</ul>
		<Button class="subtask-editor__add" @click="add">
			<IconMenu name="add" />
			Добавить подзадачу
		</Button>
	</section>
</template>

<style scoped>
	.subtask-editor {
		margin-top: 16px;
	}
	.subtask-editor__list {
		display: grid;
		gap: 12px;
		list-style: none;
	}
	.subtask-editor__row {
		display: flex;
		align-items: flex-end;
		gap: 8px;
	}
	.subtask-editor__field {
		flex: 1;
		min-width: 0;
	}
	.subtask-editor__remove {
		width: 40px;
		padding: 8px;
	}
	.subtask-editor__add {
		background: var(--color-gray-light);
		border-color: var(--color-gray-border-light);
		color: var(--color-gray-dark);
	}
	.subtask-editor__list + .subtask-editor__add {
		margin-top: 12px;
	}
	.subtask-editor__add:hover {
		background: var(--color-gray-hover-light);
		border-color: var(--color-gray-border);
	}
</style>
