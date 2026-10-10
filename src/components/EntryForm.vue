<script setup lang="ts">
	import { computed, ref } from 'vue';
	import { useUnsavedChanges } from '@/composables/useUnsavedChanges';
	import type { Entry } from '@/types/notes';
	import Input from '@/components/Input.vue';
	import Button from '@/components/Button.vue';
	import AutoResizeTextarea from '@/components/AutoResizeTextarea.vue';
	import { formatFolderName } from '@/utils/format';

	const props = defineProps<{ type: Entry['type']; entry?: Entry; inline?: boolean }>();
	const emit = defineEmits<{ save: [name: string, description: string]; cancel: [] }>();
	const name = ref(
		props.entry ? (props.entry.type === 'task' ? props.entry.value : props.entry.name) : '',
	);
	const description = ref(props.entry?.type === 'note' ? props.entry.description : '');
	const originalName = name.value;
	const originalDescription = description.value;
	useUnsavedChanges(
		computed(() => name.value !== originalName || description.value !== originalDescription),
	);
	const fallbackName = formatFolderName();

	const submit = () => {
		if (props.type === 'task' && !name.value.trim()) return;
		emit('save', name.value, description.value);
	};
</script>

<template>
	<form
		class="note-editor"
		:class="{ 'entry-form-modal': !inline }"
		:data-textarea-boundary="inline ? undefined : ''"
		@submit.prevent="submit"
	>
		<AutoResizeTextarea
			v-if="type === 'task'"
			id="task-name"
			v-model="name"
			label="Текст задачи"
			placeholder="Добавить задачу"
			required
			autofocus
		/>
		<template v-else>
			<Input
				id="entry-name"
				v-model="name"
				:label="
					type === 'folder'
						? 'Название папки'
						: type === 'checklist'
							? 'Название перечня'
							: 'Название заметки'
				"
				autofocus
			/>
			<p class="folder-name-hint">Без названия: {{ fallbackName }}</p>
		</template>
		<AutoResizeTextarea
			v-if="type === 'note'"
			id="note-description"
			v-model="description"
			label="Описание"
			placeholder="Напишите заметку"
		/>
		<div class="actions task-actions">
			<Button type="submit">{{ entry ? 'Сохранить' : 'Создать' }}</Button>
			<Button class="btn-note-cancel" @click="emit('cancel')">Отмена</Button>
		</div>
	</form>
</template>

<style scoped>
	.entry-form-modal {
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - 130px);
		overflow: hidden;
	}
	.entry-form-modal > :deep(*) {
		flex-shrink: 0;
	}
	.entry-form-modal :deep(.note-description) {
		min-height: min(180px, var(--textarea-available-height, 180px));
		max-height: var(--textarea-available-height, 100dvh);
	}

	.note-editor :deep(.input__field + .modal-label) {
		margin-top: 20px;
	}

	.button.btn-note-cancel {
		background-color: var(--color-transparent);
		color: var(--color-gray-dark);
		&:hover {
			background-color: var(--color-transparent);
			color: var(--color-gray-hover);
		}
	}

	.folder-name-hint {
		margin: 8px 0 20px;
		color: var(--color-gray);
		font-size: 12px;
		text-align: left;
	}

	.task-actions {
		margin-top: 20px;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}
</style>
