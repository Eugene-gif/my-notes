<script setup lang="ts">
	import type { ChecklistStatus } from '@/types/notes';

	withDefaults(defineProps<{ status?: ChecklistStatus }>(), { status: 'empty' });
</script>

<template>
	<svg
		class="icon"
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		viewBox="0 0 512 512"
		aria-hidden="true"
		focusable="false"
	>
		<template v-if="status === 'complete'">
			<path
				fill="currentColor"
				fill-rule="evenodd"
				d="M256 85.334h170.666V128H256zm0 149.333h170.666v42.667H256zM256 384h170.666v42.667H256zM189.814 46.126l25.364 19.51l-76.032 98.843l-68.617-60.04l21.072-24.082l42.968 37.574zm0 149.333l25.364 19.511l-76.032 98.842l-68.617-60.04l21.072-24.082l42.968 37.574zm0 149.334l25.364 19.51l-76.032 98.843l-68.617-60.04l21.072-24.082l42.968 37.574z"
			/>
		</template>
		<template v-else-if="status === 'partial'">
			<path
				fill="currentColor"
				fill-rule="evenodd"
				d="M256 85.334h170.666V128H256zm0 149.333h170.666v42.667H256zM85.332 341.334h106.666V448H85.333zm32 32V416h42.666v-42.666zM255.999 384h170.667v42.667H256zM189.815 46.126l25.364 19.51l-76.032 98.843l-68.617-60.04l21.072-24.082l42.968 37.574zm0 149.333l25.364 19.511l-76.032 98.842l-68.617-60.04l21.072-24.082l42.968 37.574z"
			/>
		</template>
		<template v-else>
			<path
				fill="currentColor"
				fill-rule="evenodd"
				d="M85.333 42.667H192v106.667H85.333zm32 32v42.667H160V74.667zM256 85.334h170.666V128H256zM85.333 192H192v106.667H85.333zm32 32v42.667H160V224zM256 234.667h170.666v42.667H256zM85.333 341.334H192V448H85.333zm32 32V416H160v-42.666zM256 384h170.666v42.667H256z"
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
