<script setup lang="ts">
	withDefaults(defineProps<{ open?: boolean; empty?: boolean }>(), { open: false, empty: false });
</script>

<template>
	<svg
		class="icon"
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
	>
		<template v-if="empty && open">
			<path
				fill="currentColor"
				d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8H11.175l-2-2H4v12l2.4-8h17.1l-2.575 8.575q-.2.65-.737 1.038T19 20zm2.1-2H19l1.8-6H7.9zm0 0l1.8-6zM4 8V6z"
			/>
		</template>
		<template v-else-if="empty">
			<path
				fill="currentColor"
				d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
			/>
		</template>
		<template v-else-if="open">
			<path
				fill="currentColor"
				d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h9q.425 0 .713.288T22 7t-.288.713T21 8H7.85q-1.55 0-2.7.975T4 11.45V18l1.975-6.575q.2-.65.738-1.037T7.9 10h12.9q1.025 0 1.613.813t.312 1.762l-1.8 6q-.2.65-.737 1.038T19 20z"
			/>
		</template>
		<template v-else>
			<path
				fill="currentColor"
				d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20z"
			/>
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
