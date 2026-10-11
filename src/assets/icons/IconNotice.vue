<script setup lang="ts">
	import type { NoticeStatus } from '@/store/noticesStore';

	defineProps<{ status: NoticeStatus }>();
</script>

<template>
	<svg
		class="icon notice__icon"
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="12" cy="12" r="9" />
		<path v-if="status === 'success'" d="m8 12 3 3 5-6" />
		<path v-else-if="status === 'error'" d="m9 9 6 6m0-6-6 6" />
		<path v-else d="M12 8h0m0 4v4" />
	</svg>
</template>

<style scoped>
	.icon {
		display: block;
		flex-shrink: 0;
		pointer-events: none;
	}
</style>
