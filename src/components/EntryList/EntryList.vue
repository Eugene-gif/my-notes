<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Entry, Layout, ParentId } from '@/types/notes';
import { useCardLayout } from '@/composables/useCardLayout';
import TaskCard from '@/components/TaskCard/TaskCard.vue';
import ContainerCard from '@/components/ContainerCard/ContainerCard.vue';
const props = defineProps<{
  entries: Entry[];
  currentId: ParentId;
  checklist: boolean;
  layout: Layout;
  selecting: boolean;
  selected: Set<string>;
  highlight?: string;
}>();
const emit = defineEmits<{
  toggle: [id: string];
  select: [id: string];
  open: [id: string];
  action: [action: string, id: string];
  add: [position: 'before' | 'after'];
}>();
const list = ref<HTMLElement | null>(null);
const version = computed(() => [props.entries, props.layout]);
useCardLayout(list, version);
</script>
<template>
  <ul
    ref="list"
    class="todo__list"
    :data-layout="checklist ? '1' : layout"
    :data-drop-folder="currentId ?? ''"
  >
    <li v-if="checklist" class="todo__add-card item">
      <button
        class="todo__add-task"
        type="button"
        :disabled="selecting"
        @click="emit('add', 'before')"
      >
        ＋ Добавить задачу
      </button>
    </li>
    <template v-for="entry in entries" :key="entry.id"
      ><TaskCard
        v-if="entry.type === 'task'"
        :entry="entry"
        :selecting="selecting"
        :selected="selected.has(entry.id)"
        :class="{ 'is-search-result': highlight === entry.id }"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
        @action="(action, id) => emit('action', action, id)" /><ContainerCard
        v-else
        :entry="entry"
        :selecting="selecting"
        :selected="selected.has(entry.id)"
        @open="emit('open', $event)"
        @select="emit('select', $event)"
        @action="(action, id) => emit('action', action, id)"
    /></template>
    <li v-if="checklist" class="todo__add-card item">
      <button
        class="todo__add-task"
        type="button"
        :disabled="selecting"
        @click="emit('add', 'after')"
      >
        ＋ Добавить задачу
      </button>
    </li>
  </ul>
  <p
    v-if="!entries.length && !checklist"
    class="todo__list-empty"
    :data-drop-folder="currentId ?? ''"
  >
    {{ currentId ? 'Папка пуста' : 'Список пуст' }}
  </p>
</template>
<style src="./EntryList.css"></style>
