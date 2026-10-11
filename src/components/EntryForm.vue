<script setup lang="ts">
	import { computed, ref } from 'vue';
	import { useUnsavedChanges } from '@/composables/useUnsavedChanges';
	import type { Entry, Subtask } from '@/types/notes';
	import SubtaskEditor from '@/components/SubtaskEditor.vue';
	import Input from '@/components/Input.vue';
	import Button from '@/components/Button.vue';
	import AutoResizeTextarea from '@/components/AutoResizeTextarea.vue';
	import { formatFolderName } from '@/utils/format';

	const props = defineProps<{ type: Entry['type']; entry?: Entry; inline?: boolean }>();
	const emit = defineEmits<{
		save: [name: string, description: string, subtasks?: Subtask[]];
		cancel: [];
	}>();
	const name = ref(
		props.entry ? (props.entry.type === 'task' ? props.entry.value : props.entry.name) : '',
	);
	const description = ref(props.entry?.type === 'note' ? props.entry.description : '');
	const originalName = name.value;
	const originalDescription = description.value;
	const subtasks = ref<Subtask[]>(
		props.entry?.type === 'task'
			? (props.entry.subtasks ?? []).map((subtask) => ({ ...subtask }))
			: [],
	);
	const originalSubtasks = JSON.stringify(subtasks.value);
	const multilineTask = computed(
		() => props.entry?.type === 'task' && /[\r\n]/.test(props.entry.value),
	);
	useUnsavedChanges(
		computed(
			() =>
				name.value !== originalName ||
				description.value !== originalDescription ||
				JSON.stringify(subtasks.value) !== originalSubtasks,
		),
	);
	const fallbackName = formatFolderName();

	const submit = () => {
		if (props.type === 'task') {
			if (!name.value.trim() || subtasks.value.some((subtask) => !subtask.value.trim())) return;
			emit(
				'save',
				name.value,
				description.value,
				subtasks.value.map((subtask) => ({ ...subtask })),
			);
		} else emit('save', name.value, description.value);
	};
</script>

<template>
	<form
		class="note-editor"
		:class="{ 'entry-form-modal': !inline, 'entry-form-task': !inline && type === 'task' }"
		:data-textarea-boundary="inline || type === 'task' ? undefined : ''"
		@submit.prevent="submit"
	>
		<div v-if="type === 'task'" class="task-fields">
			<AutoResizeTextarea
				v-if="multilineTask"
				id="task-name"
				v-model="name"
				label="Текст задачи"
				placeholder="Добавить задачу"
				required
				autofocus
			/>
			<Input
				v-else
				id="task-name"
				v-model="name"
				label="Текст задачи"
				placeholder="Добавить задачу"
				required
				autofocus
			/>
			<SubtaskEditor v-model="subtasks" />
		</div>
		<template v-else>
			<Input
				id="entry-name"
				v-model="name"
				:label="
					type === 'folder'
						? 'Название папки'
						: type === 'checklist'
							? 'Название перечня'
							: 'Заголовок'
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
			placeholder="Введите текст"
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
	.entry-form-task .task-fields {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	.entry-form-task :deep(.note-description) {
		min-height: 80px;
		max-height: 180px;
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
