<script setup lang="ts">
import type { Note } from '@/types/notes';
import Button from '@/components/Button/Button.vue';
import EntryForm from '@/components/EntryForm/EntryForm.vue';
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
<style src="./NoteView.css"></style>
