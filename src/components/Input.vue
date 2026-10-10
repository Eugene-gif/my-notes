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

<style scoped>
	.modal-label {
		display: block;
		margin-bottom: 6px;
		color: var(--color-gray-dark);
		font-size: 14px;
		text-align: left;
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

	.input__field::placeholder {
		font-size: 16px;
		line-height: 100%;
		color: var(--color-gray-placeholder);
	}

	.input__field:focus {
		border-color: var(--color-yellow);
	}
</style>
