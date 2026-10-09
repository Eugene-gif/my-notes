<script setup lang="ts">
import { useNotice } from '@/composables/useNotice';
withDefaults(defineProps<{ top?: string; width?: string }>(), { top: '20px', width: '460px' });
const { current, host, target, closing, close } = useNotice();
</script>
<template>
  <Teleport v-if="target" :to="target">
    <div
      v-if="current"
      ref="host"
      class="notice-host"
      :class="{ 'is-closing': closing }"
      popover="manual"
      :data-status="current.status"
      :role="current.status === 'error' ? 'alert' : 'status'"
      :aria-live="current.status === 'error' ? 'assertive' : 'polite'"
      aria-atomic="true"
      :style="{ '--notice-top': top, '--notice-width': width }"
    >
      <div class="notice">
        <span class="notice__icon" aria-hidden="true">{{
          current.status === 'success' ? '✓' : current.status === 'error' ? '✕' : 'ⓘ'
        }}</span
        ><span class="notice__text">{{ current.message }}</span
        ><button
          v-if="current.closable"
          type="button"
          class="notice__close"
          aria-label="Закрыть уведомление"
          @click="close"
        >
          ✕
        </button>
      </div>
    </div>
  </Teleport>
</template>
<style src="./Notice.css"></style>
