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

<style scoped>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid var(--color-gray-dark);
		background-color: var(--color-gray-dark);
		color: var(--color-white);
		border-radius: 8px;
		cursor: pointer;
		padding: 8px 12px;
		min-width: 40px;
		height: 40px;
		flex-shrink: 0;
		transition-property: color, background-color, border-color;
		transition-duration: 0.2s;
		font-weight: 600;
		font-size: 16px;
		line-height: 1.2;
		text-align: center;
		white-space: nowrap;
		user-select: none;

		@media (hover: hover) {
			&:hover {
				background-color: var(--color-gray-hover);
				border-color: var(--color-gray-hover);
			}
		}

		&:active {
			filter: drop-shadow(0 0px 4px var(--color-yellow));
		}

		&:focus:not(:focus-visible) {
			outline: none;
		}

		&:focus-visible {
			outline: 2px solid var(--color-yellow);
			outline-offset: 1px;
		}
	}
	.button.is-danger {
		color: var(--color-red);
		background: var(--color-red-light);
		border-color: var(--color-red-border);
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
</style>
