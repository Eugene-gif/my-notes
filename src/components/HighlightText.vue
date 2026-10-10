<script setup lang="ts">
	import { computed } from 'vue';
	import { highlightSegments } from '@/utils/search';

	const props = defineProps<{ text: string; query: string }>();
	const segments = computed(() => highlightSegments(props.text, props.query));
</script>

<template>
	<span class="highlight-text"
		><template v-for="(segment, index) in segments" :key="index"
			><mark v-if="segment.match">{{ segment.text }}</mark
			><template v-else>{{ segment.text }}</template></template
		></span
	>
</template>

<style scoped>
	mark {
		background: var(--color-yellow-highlight);
		color: var(--color-gray-dark);
		border-radius: 2px;
	}
</style>
