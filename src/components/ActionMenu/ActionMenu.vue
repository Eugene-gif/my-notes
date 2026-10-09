<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import type { MenuAction } from '@/types/notes';
import IconMenu from '@/assets/icons/IconMenu';
import { useMenu } from '@/composables/useMenu';
withDefaults(defineProps<{ actions: MenuAction[]; label?: string; toolbar?: boolean }>(), {
  label: 'Действия элемента',
  toolbar: false,
});
const emit = defineEmits<{ action: [id: string]; 'open-change': [value: boolean] }>();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const id = useId();
const { open, toggle, close } = useMenu(root, trigger, menu);
watch(open, (value) => emit('open-change', value));
const choose = (action: string) => {
  close(true);
  emit('action', action);
};
</script>
<template>
  <div ref="root" class="todo__menu-container" :class="{ 'has-open-menu': open }">
    <button
      ref="trigger"
      class="button"
      :class="toolbar ? 'todo__menu-trigger' : 'folder__options'"
      type="button"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-controls="id"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      {{ toolbar ? '☰' : '⋮' }}
    </button>
    <Transition name="menu"
      ><div
        v-if="open"
        :id="id"
        ref="menu"
        class="folder__menu"
        :class="{ 'todo__toolbar-menu': toolbar }"
        role="menu"
        :aria-label="label"
      >
        <button
          v-for="action in actions"
          :key="action.id"
          class="folder__menu-action"
          :class="{ 'is-danger': action.danger }"
          type="button"
          role="menuitem"
          :disabled="action.disabled"
          @click.stop="choose(action.id)"
        >
          <span class="menu__icon-wrap" aria-hidden="true" v-html="IconMenu(action.id)" /><span
            class="menu__label"
            >{{ action.label }}</span
          >
        </button>
      </div></Transition
    >
  </div>
</template>
<style src="./ActionMenu.css"></style>
