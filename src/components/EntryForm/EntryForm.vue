<script setup lang="ts">
import { ref } from 'vue';
import type { Entry } from '@/types/notes';
import Input from '@/components/Input/Input.vue';
import Button from '@/components/Button/Button.vue';
import AutoResizeTextarea from '@/components/AutoResizeTextarea/AutoResizeTextarea.vue';
import { formatFolderName } from '@/utils/format';
const props = defineProps<{ type: Entry['type']; entry?: Entry; inline?: boolean }>();
const emit = defineEmits<{ save: [name: string, description: string]; cancel: [] }>();
const name = ref(
  props.entry ? (props.entry.type === 'task' ? props.entry.value : props.entry.name) : '',
);
const description = ref(props.entry?.type === 'note' ? props.entry.description : '');
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
    <template v-else
      ><Input
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
      <p class="folder-name-hint">Без названия: {{ fallbackName }}</p></template
    >
    <AutoResizeTextarea
      v-if="type === 'note'"
      id="note-description"
      v-model="description"
      label="Описание"
      placeholder="Напишите заметку"
    />
    <div class="actions task-actions">
      <Button type="submit">{{ entry ? 'Сохранить' : 'Создать' }}</Button
      ><Button class="btn-note-cancel" @click="emit('cancel')">Отмена</Button>
    </div>
  </form>
</template>
<style src="./EntryForm.css"></style>
