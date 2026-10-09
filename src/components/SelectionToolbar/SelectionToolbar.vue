<script setup lang="ts">
import Button from '@/components/Button/Button.vue';
defineProps<{ count: number; total: number }>();
const emit = defineEmits<{ all: []; remove: []; cancel: [] }>();
</script>
<template>
  <div class="todo__batch-actions">
    <span class="todo__selection-count" role="status">Выбрано: {{ count }}</span
    ><Button @click="emit('all')">{{
      count && count === total ? 'Снять выбор' : 'Выбрать все'
    }}</Button
    ><Button danger :disabled="!count" @click="emit('remove')">Удалить выбранные</Button
    ><Button class="todo__cancel" @click="emit('cancel')">Отмена</Button>
  </div>
</template>
<style src="./SelectionToolbar.css"></style>
