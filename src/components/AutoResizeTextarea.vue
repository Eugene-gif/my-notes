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

<style scoped>
	.input__field:focus {
		border-color: var(--color-yellow);
	}
	.input__field::placeholder {
		font-size: 16px;
		line-height: 100%;
		color: var(--color-gray-placeholder);
	}
	.input__field {
		font-size: 16px;
		border: 2px solid var(--color-gray-border-light);
		color: var(--color-black);
		border-radius: 8px;
		padding: 12px 30px 12px 20px;
		max-height: 40px;
		outline: none;
		max-width: var(--layout-width);
		width: 100%;
		transition: border-color 0.1s linear;
	}
	.modal-label {
		display: block;
		margin-bottom: 6px;
		color: var(--color-gray-dark);
		font-size: 14px;
		text-align: left;
	}
	.note-description.input__field {
		display: block;
		height: 180px;
		min-height: 180px;
		max-height: 100dvh;
		box-sizing: border-box;
		padding: 12px;
		font: inherit;
		font-size: 16px;
		line-height: 1.5;
		resize: none;
		overflow-y: hidden;
	}
</style>
