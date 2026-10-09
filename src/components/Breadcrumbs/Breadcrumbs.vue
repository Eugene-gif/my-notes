<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Container, ParentId } from '@/types/notes';
import { useNotesStore } from '@/store/notesStore';
import { containerIcon } from '@/utils/icons';
import IconHome from '@/assets/icons/IconHome';
import { useCompactPath } from '@/composables/useCompactPath';
import BaseDialog from '@/components/BaseDialog/BaseDialog.vue';
import Button from '@/components/Button/Button.vue';
const props = defineProps<{ path: Container[]; selecting: boolean }>();
const emit = defineEmits<{ navigate: [id: ParentId] }>();
const notes = useNotesStore();
const nav = ref<HTMLElement | null>(null);
const fullPath = ref(false);
const version = computed(() => props.path.map((entry) => entry.name).join('/'));
const { compact } = useCompactPath(nav, version);
const links = computed(() => [{ id: null, name: 'Главная', type: 'home' }, ...props.path] as const);
const visible = computed(() =>
  compact.value ? [links.value[0], links.value.at(-1)!] : links.value,
);
const icon = (id: ParentId) => {
  const entry = notes.entry(id);
  return entry && entry.type !== 'task' ? containerIcon(entry, notes.state, true) : IconHome();
};
const navigate = (id: ParentId) => {
  if (!props.selecting) {
    fullPath.value = false;
    emit('navigate', id);
  }
};
</script>
<template>
  <div class="todo__navigation">
    <nav ref="nav" class="todo__breadcrumbs" aria-label="Путь к разделу">
      <template v-for="(entry, index) in visible" :key="entry.id ?? 'home'"
        ><span v-if="index" class="todo__path-separator">›</span
        ><template v-if="compact && index === 1"
          ><button
            class="todo__path-button todo__path-ellipsis"
            type="button"
            aria-label="Показать полный путь"
            :disabled="selecting"
            @click="fullPath = true"
          >
            …</button
          ><span class="todo__path-separator">›</span></template
        ><button
          class="todo__path-button"
          type="button"
          :title="entry.name"
          :aria-label="entry.name"
          :aria-current="index === visible.length - 1 ? 'page' : undefined"
          :disabled="selecting"
          :data-navigate-folder="entry.id ?? ''"
          :data-drop-folder="entry.type === 'note' ? undefined : (entry.id ?? '')"
          @click="navigate(entry.id)"
        >
          <span class="todo__path-icon" aria-hidden="true" v-html="icon(entry.id)" /><span
            v-if="entry.id"
            class="todo__path-name"
            >{{ entry.name }}</span
          >
        </button></template
      >
    </nav>
    <div v-if="path.length" class="todo__toolbar">
      <Button
        class="todo__back"
        aria-label="Назад"
        :disabled="selecting"
        @click="navigate(path.at(-1)!.parentId)"
        >←</Button
      >
    </div>
  </div>
  <BaseDialog v-model="fullPath" title="Путь к разделу" variant="path-modal"
    ><div class="path-items">
      <button
        v-for="entry in links"
        :key="entry.id ?? 'home'"
        class="todo__path-button"
        type="button"
        @click="navigate(entry.id)"
      >
        <span class="todo__path-icon" aria-hidden="true" v-html="icon(entry.id)" /><span
          class="todo__path-name"
          >{{ entry.name }}</span
        >
      </button>
    </div></BaseDialog
  >
</template>
<style src="./Breadcrumbs.css"></style>
