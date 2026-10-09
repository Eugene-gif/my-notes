<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Container, MenuAction } from '@/types/notes';
import { useNotesStore } from '@/store/notesStore';
import { containerIcon } from '@/utils/icons';
import { getChildren, getChecklistStats } from '@/utils/entries';
import { elementCount, taskCount, containerNoun } from '@/utils/format';
import ActionMenu from '@/components/ActionMenu/ActionMenu.vue';
const props = defineProps<{ entry: Container; selecting?: boolean; selected?: boolean }>();
const emit = defineEmits<{
  open: [id: string];
  select: [id: string];
  action: [action: string, id: string];
}>();
const notes = useNotesStore();
const menuOpen = ref(false);
const stats = computed(() =>
  props.entry.type === 'checklist' ? getChecklistStats(notes.state, props.entry.id) : null,
);
const summary = computed(() =>
  props.entry.type === 'note'
    ? props.entry.description || 'Нет описания'
    : stats.value
      ? taskCount(stats.value.total) +
        (stats.value.total ? ` · Выполнено ${stats.value.completed}/${stats.value.total}` : '')
      : elementCount(getChildren(notes.state, props.entry.id).length),
);
const actions = computed<MenuAction[]>(() => [
  { id: 'open', label: 'Открыть' },
  { id: 'select', label: 'Выбрать' },
  { id: props.entry.type === 'note' ? 'edit-note' : 'rename', label: 'Изменить' },
  { id: 'delete', label: 'Удалить ' + containerNoun(props.entry.type), danger: true },
]);
const activate = () =>
  props.selecting ? emit('select', props.entry.id) : emit('open', props.entry.id);
</script>
<template>
  <li
    class="item folder todo__item"
    :class="[entry.type, { 'is-selected': selected, 'has-open-menu': menuOpen }]"
    :data-id="entry.id"
    :data-drop-folder="entry.type !== 'note' ? entry.id : undefined"
    :data-status="stats?.status"
    @click="activate"
  >
    <button
      v-if="selecting"
      type="button"
      class="item__selection"
      :aria-pressed="!!selected"
      :aria-label="'Выбрать ' + entry.name"
      @click.stop="emit('select', entry.id)"
    >
      {{ selected ? '✔' : '' }}
    </button>
    <button
      type="button"
      class="folder__open"
      :aria-label="'Открыть ' + containerNoun(entry.type) + ' «' + entry.name + '»'"
      @click.stop="activate"
    >
      <span
        class="folder__icon"
        aria-hidden="true"
        v-html="containerIcon(entry, notes.state)"
      /><span class="folder__text"
        ><span class="folder__title">{{ entry.name }}</span
        ><span class="folder__count">{{ summary }}</span></span
      >
    </button>
    <ActionMenu
      v-if="!selecting"
      :actions="actions"
      :label="'Действия «' + entry.name + '»'"
      @action="(action) => emit('action', action, entry.id)"
      @open-change="menuOpen = $event"
    />
  </li>
</template>
<style src="./ContainerCard.css"></style>
