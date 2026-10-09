<script setup lang="ts">
import type { Layout } from '@/types/notes';
const value = defineModel<Layout>({ required: true });
const choices: Layout[] = ['1', '2', '3'];
</script>
<template>
  <div class="todo__layout layout-picker" role="group" aria-label="Вид элементов">
    <label v-for="columns in choices" :key="columns" class="todo__layout-option"
      ><input
        v-model="value"
        type="radio"
        name="layout"
        :value="columns"
        :aria-label="columns === '1' ? 'Список' : columns + ' колонки'"
      /><span class="todo__layout-icon" :style="{ '--icon-columns': columns }" aria-hidden="true"
        ><span v-for="index in Number(columns) * 2" :key="index" /></span
      ><span class="todo__layout-name">{{
        columns === '1' ? 'Список' : columns + ' колонки'
      }}</span></label
    >
  </div>
</template>
<style src="./LayoutPicker.css"></style>
