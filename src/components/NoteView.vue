<script setup lang="ts">
	import type { Note } from '@/types/notes';
	import Button from '@/components/Button.vue';
	import EntryForm from '@/components/EntryForm.vue';

	defineProps<{ note: Note; editing: boolean }>();
	const emit = defineEmits<{ edit: []; cancel: []; save: [name: string, description: string] }>();
</script>

<template>
	<section class="todo__note-view note-view" aria-label="Заметка">
		<EntryForm
			v-if="editing"
			:key="note.id"
			type="note"
			:entry="note"
			inline
			@save="(name, description) => emit('save', name, description)"
			@cancel="emit('cancel')"
		/>
		<article v-else class="note-reader">
			<div class="note-reader__header">
				<h2 class="note-reader__title">{{ note.name }}</h2>
				<Button class="btn-note-edit" @click="emit('edit')">Изменить</Button>
			</div>
			<p class="note-reader__description">{{ note.description }}</p>
		</article>
	</section>
</template>

<style scoped>
	.note-view {
		padding: 16px;
		border: 1px solid var(--color-gray-border-light);
		border-radius: 12px;
		background: var(--color-white);
		text-align: left;
	}

	.note-reader__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
	}
	.note-reader__title {
		margin: 0;
		min-width: 0;
		font-size: 22px;
		font-weight: 600;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}
	.note-reader__header .btn-note-edit {
		flex-shrink: 0;
	}
	.note-reader__description {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-size: 16px;
		line-height: 1.6;
	}
</style>
