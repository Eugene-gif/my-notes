<script setup lang="ts">
withDefaults(
  defineProps<{ type?: 'button' | 'submit' | 'reset'; disabled?: boolean; danger?: boolean }>(),
  { type: 'button', disabled: false, danger: false },
);
</script>
<template>
  <button :type="type" class="button" :class="{ 'is-danger': danger }" :disabled="disabled">
    <slot />
  </button>
</template>
<style src="./Button.css"></style>
