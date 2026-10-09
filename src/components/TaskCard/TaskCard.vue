<script setup lang="ts">
import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from 'vue';
import type { Task } from '@/types/notes';
import { getTaskStatus, taskStatusLabel } from '@/utils/taskStatus';
import IconTaskStatus from '@/assets/icons/IconTaskStatus';
import ActionMenu from '@/components/ActionMenu/ActionMenu.vue';
const props = defineProps<{ entry: Task; selecting?: boolean; selected?: boolean }>();
const emit = defineEmits<{
  toggle: [id: string];
  select: [id: string];
  action: [action: string, id: string];
}>();
const text = ref<HTMLElement | null>(null);
const toggleButton = ref<HTMLButtonElement | null>(null);
const expanded = ref(false);
const clipped = ref(false);
const singleLine = ref(false);
const menuOpen = ref(false);
const status = computed(() => getTaskStatus(props.entry));
let observer: ResizeObserver | undefined;
const measure = () => {
  if (!text.value) return;
  clipped.value = text.value.scrollHeight > 40;
  singleLine.value = text.value.scrollHeight <= 21;
};
watch(
  () => props.entry.value,
  () => nextTick(measure),
);
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (text.value) observer.observe(text.value);
  measure();
});
onScopeDispose(() => observer?.disconnect());
const activate = () =>
  props.selecting ? emit('select', props.entry.id) : emit('toggle', props.entry.id);
const expand = () => {
  expanded.value = !expanded.value;
  toggleButton.value?.focus({ preventScroll: true });
};
</script>
<template>
  <li
    class="todo__item item task"
    :class="{
      'is-selected': selected,
      'is-expanded': expanded,
      'is-single-line': singleLine,
      'has-open-menu': menuOpen,
    }"
    :data-id="entry.id"
    :data-status="status"
    :data-completed="status === 'completed'"
    @click="activate"
  >
    <button
      v-if="selecting"
      type="button"
      class="item__selection"
      :aria-pressed="!!selected"
      :aria-label="'Выбрать ' + entry.value"
      @click.stop="emit('select', entry.id)"
    >
      {{ selected ? '✔' : '' }}
    </button>
    <button
      ref="toggleButton"
      type="button"
      class="task__toggle"
      :aria-pressed="status === 'in-progress' ? 'mixed' : status === 'completed'"
      :aria-label="
        entry.value + '. Статус: ' + taskStatusLabel(status) + '. Изменить статус задачи'
      "
      @click.stop="activate"
    >
      <span class="task__check" aria-hidden="true" v-html="IconTaskStatus(status)" /><span
        ref="text"
        class="task__text item__text"
        :class="{ 'is-clipped': clipped && !expanded }"
        >{{ entry.value }}</span
      >
    </button>
    <button
      v-if="clipped && !selecting"
      class="task__expand"
      type="button"
      :aria-label="expanded ? 'Свернуть задачу' : 'Развернуть задачу'"
      :aria-expanded="expanded"
      @click.stop="expand"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <ActionMenu
      v-if="!selecting"
      :actions="[
        { id: 'select', label: 'Выбрать' },
        { id: 'edit', label: 'Изменить' },
        { id: 'delete', label: 'Удалить', danger: true },
      ]"
      :label="'Действия задачи «' + entry.value + '»'"
      @action="(action) => emit('action', action, entry.id)"
      @open-change="menuOpen = $event"
    />
  </li>
</template>
<style src="./TaskCard.css"></style>
