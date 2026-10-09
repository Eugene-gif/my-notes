<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'search';
    required?: boolean;
    autofocus?: boolean;
  }>(),
  { type: 'text', placeholder: '', required: false, autofocus: false },
);
const value = defineModel<string>({ default: '' });
</script>
<template>
  <label class="modal-label" :for="id">{{ label }}</label>
  <input
    :id="id"
    v-model="value"
    class="input__field"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :autofocus="autofocus"
    autocomplete="off"
  />
</template>
<style src="./Input.css"></style>
