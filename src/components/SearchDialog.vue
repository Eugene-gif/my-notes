<script setup lang="ts">
	import { toRef } from 'vue';
	import type { Entry, ParentId } from '@/types/notes';
	import { useNotesStore } from '@/store/notesStore';
	import { useSearch } from '@/composables/useSearch';
	import { entryPath, descriptionSnippet } from '@/utils/search';
	import BaseDialog from '@/components/BaseDialog.vue';
	import Input from '@/components/Input.vue';
	import HighlightText from '@/components/HighlightText.vue';

	const props = defineProps<{ currentId: ParentId }>();
	const emit = defineEmits<{ navigate: [entry: Entry] }>();
	const open = defineModel<boolean>({ default: false });
	const notes = useNotesStore();
	const { query, settled, results } = useSearch(
		toRef(notes, 'state'),
		toRef(props, 'currentId'),
		open,
	);

	const choose = (entry: Entry) => {
		open.value = false;
		emit('navigate', entry);
	};
</script>

<template>
	<BaseDialog v-model="open" title="Поиск" variant="search-modal">
		<Input
			id="search-input"
			v-model="query"
			type="search"
			:label="
				notes.entry(currentId)?.type === 'checklist' ? 'Текст задачи' : 'Название или описание'
			"
			autofocus
		/>
		<p class="search-status" role="status">
			{{
				!settled.trim()
					? 'Введите текст для поиска'
					: results.length
						? 'Найдено: ' + results.length
						: 'Ничего не найдено'
			}}
		</p>
		<div class="search-results" aria-label="Результаты поиска">
			<button
				v-for="entry in results"
				:key="entry.id"
				type="button"
				class="search-result"
				@click="choose(entry)"
			>
				<span class="search-result__text">
					<span class="search-result__title">
						<HighlightText
							:text="entry.type === 'task' ? entry.value : entry.name"
							:query="settled"
						/>
					</span>
					<span class="search-result__path">{{ entryPath(notes.state, entry) }}</span>
					<span
						v-if="entry.type === 'note' && entry.description"
						class="search-result__description"
					>
						<HighlightText
							:text="descriptionSnippet(entry.description, settled)"
							:query="settled"
						/>
					</span>
				</span>
			</button>
		</div>
	</BaseDialog>
</template>

<style scoped>
	:deep(.modal-label),
	:deep(.input__field),
	.search-status {
		flex-shrink: 0;
	}
	.search-status {
		color: var(--color-gray);
		font-size: 13px;
		text-align: left;
		margin: 12px 0;
	}
	.search-results {
		overflow-y: auto;
		min-height: 0;
		overscroll-behavior: contain;
		scrollbar-gutter: stable;
	}
	.search-results {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.search-result {
		display: flex;
		flex-shrink: 0;
		align-items: flex-start;
		gap: 10px;
		width: 100%;
		padding: 12px;
		border: 1px solid var(--color-gray-border-light);
		border-radius: 8px;
		background: var(--color-white);
		font: inherit;
		text-align: left;
		cursor: pointer;
		&:hover,
		&:focus-visible {
			background: var(--color-yellow-light);
			outline: 1px solid var(--color-yellow);
			outline-offset: -1px;
		}
	}
	.search-result__text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.search-result__title {
		font-weight: 600;
	}
	.search-result__path {
		color: var(--color-gray);
		font-size: 12px;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}
	.search-result__description {
		font-size: 14px;
		white-space: pre-wrap;
	}
</style>
