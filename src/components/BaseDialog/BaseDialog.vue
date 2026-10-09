<script setup lang="ts">
import { ref, useId } from 'vue';
import { useDialog } from '@/composables/useDialog';
import Button from '@/components/Button/Button.vue';
defineProps<{ title: string; variant?: string }>();
const open = defineModel<boolean>({ default: false });
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
const { requestClose } = useDialog(dialog, open, () => {
  open.value = false;
});
</script>
<template>
  <dialog
    ref="dialog"
    class="todo-modal"
    :class="variant"
    :aria-labelledby="titleId"
    @cancel.prevent="requestClose"
    @click="
      (event) => {
        if (event.target === dialog) requestClose();
      }
    "
    @close="open = false"
  >
    <div class="panel">
      <div class="workspace-modal__header">
        <h2 :id="titleId" class="text">{{ title }}</h2>
        <Button class="btn-modal-close" aria-label="Закрыть" @click="requestClose">✕</Button>
      </div>
      <slot v-if="open" />
    </div>
  </dialog>
</template>
<style src="./BaseDialog.css"></style>
