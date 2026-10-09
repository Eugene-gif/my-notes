<script setup lang="ts">
import { ref } from 'vue';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';
withDefaults(
  defineProps<{
    id: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    autofocus?: boolean;
  }>(),
  { placeholder: '', required: false, autofocus: false },
);
const value = defineModel<string>({ default: '' });
const field = ref<HTMLTextAreaElement | null>(null);
const { resize } = useAutoResizeTextarea(field, value);
defineExpose({ resize });
</script>
<template>
  <label class="modal-label" :for="id">{{ label }}</label>
  <textarea
    :id="id"
    ref="field"
    v-model="value"
    class="input__field note-description"
    :placeholder="placeholder"
    :required="required"
    :autofocus="autofocus"
    @input="resize"
  />
</template>
<style src="./AutoResizeTextarea.css"></style>
