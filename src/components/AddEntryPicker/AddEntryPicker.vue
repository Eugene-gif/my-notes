<script setup lang="ts">
import type { ContainerType } from '@/types/notes';
import IconMenu from '@/assets/icons/IconMenu';
const emit = defineEmits<{ choose: [type: ContainerType] }>();
const choices: { type: ContainerType; label: string; icon: string }[] = [
  { type: 'folder', label: 'Добавить папку', icon: 'folder' },
  { type: 'note', label: 'Добавить заметку', icon: 'text' },
  { type: 'checklist', label: 'Добавить перечень', icon: 'checklist' },
];
</script>
<template>
  <div class="todo__add-options">
    <button
      v-for="choice in choices"
      :key="choice.type"
      class="todo__add-option"
      type="button"
      @click="emit('choose', choice.type)"
    >
      <span aria-hidden="true" v-html="IconMenu(choice.icon)" /><span>{{ choice.label }}</span>
    </button>
  </div>
</template>
<style src="./AddEntryPicker.css"></style>
