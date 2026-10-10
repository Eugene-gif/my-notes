<script setup lang="ts">
	import type { TaskStatus } from '@/types/notes';

	defineProps<{ status: TaskStatus }>();
</script>

<template>
	<svg
		v-if="status !== 'pending'"
		class="icon"
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<template v-if="status === 'completed'">
			<circle cx="12" cy="12" r="9" stroke-width="1.7" />
			<path d="m8 12 3 3 5-6" stroke-width="1.7" />
		</template>
		<template v-else>
			<path
				d="M10 20.777a9 9 0 0 1-2.48-.969M14 3.223a9.003 9.003 0 0 1 0 17.554m-9.421-3.684a9 9 0 0 1-1.227-2.592M3.124 10.5c.16-.95.468-1.85.9-2.675l.169-.305m2.714-2.941A9 9 0 0 1 10 3.223"
			/>
			<path d="m9 12l2 2l4-4" />
		</template>
	</svg>
</template>

<style scoped>
	.icon {
		display: block;
		flex-shrink: 0;
		pointer-events: none;
	}
</style>
