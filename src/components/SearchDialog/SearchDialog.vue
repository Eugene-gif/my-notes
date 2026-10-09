<script setup lang="ts">
import { toRef } from 'vue';
import type { Entry, ParentId } from '@/types/notes';
import { useNotesStore } from '@/store/notesStore';
import { useSearch } from '@/composables/useSearch';
import { entryPath, descriptionSnippet } from '@/utils/search';
import BaseDialog from '@/components/BaseDialog/BaseDialog.vue';
import Input from '@/components/Input/Input.vue';
import HighlightText from '@/components/HighlightText/HighlightText.vue';
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
  <BaseDialog v-model="open" title="Поиск" variant="search-modal"
    ><Input
      id="search-input"
      v-model="query"
      type="search"
      :label="
        notes.entry(currentId)?.type === 'checklist' ? 'Текст задачи' : 'Название или описание'
      "
      placeholder="Введите текст для поиска"
      autofocus />
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
        <span class="search-result__text"
          ><span class="search-result__title"
            ><HighlightText
              :text="entry.type === 'task' ? entry.value : entry.name"
              :query="settled" /></span
          ><span class="search-result__path">{{ entryPath(notes.state, entry) }}</span
          ><span
            v-if="entry.type === 'note' && entry.description"
            class="search-result__description"
            ><HighlightText
              :text="descriptionSnippet(entry.description, settled)"
              :query="settled" /></span
        ></span>
      </button></div
  ></BaseDialog>
</template>
<style src="./SearchDialog.css"></style>
