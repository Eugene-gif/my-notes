<script setup lang="ts">
	defineProps<{ name: 'menu' | 'more' | 'close' | 'back' | 'user' }>();
</script>

<template>
	<svg
		class="icon"
		xmlns="http://www.w3.org/2000/svg"
		width="22"
		height="22"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		<path v-if="name === 'menu'" d="M3 4h18M3 12h18M3 20h18" />
		<g v-else-if="name === 'more'" fill="currentColor" stroke="none">
			<circle cx="12" cy="5" r="1.5" />
			<circle cx="12" cy="12" r="1.5" />
			<circle cx="12" cy="19" r="1.5" />
		</g>
		<path v-else-if="name === 'close'" d="m5 5 14 14M19 5 5 19" />
		<g v-else-if="name === 'user'">
			<circle cx="12" cy="8" r="4" />
			<path d="M5 21v-2a7 7 0 0 1 14 0v2" />
		</g>
		<path v-else d="M20 12H4m7-7-7 7 7 7" />
	</svg>
</template>

<style scoped>
	.icon {
		display: block;
		flex-shrink: 0;
		pointer-events: none;
	}
</style>
