<script setup lang="ts">
	import { computed } from 'vue';
	import type { Container } from '@/types/notes';
	import { useNotesStore } from '@/store/notesStore';
	import { getChildren, getChecklistStats } from '@/utils/entries';
	import IconFolder from '@/assets/icons/IconFolder.vue';
	import IconTasks from '@/assets/icons/IconTasks.vue';
	import IconText from '@/assets/icons/IconText.vue';

	const props = withDefaults(defineProps<{ entry: Container; open?: boolean }>(), { open: false });
	const notes = useNotesStore();
	const empty = computed(
		() => props.entry.type === 'folder' && getChildren(notes.state, props.entry.id).length === 0,
	);
	const status = computed(() => getChecklistStats(notes.state, props.entry.id).status);
</script>

<template>
	<IconText v-if="entry.type === 'note'" />
	<IconTasks v-else-if="entry.type === 'checklist'" :status="status" :data-status="status" />
	<IconFolder v-else :empty="empty" :open="open" />
</template>

<style scoped>
	.icon[data-status='partial'] {
		color: var(--color-yellow);
	}
	.icon[data-status='complete'] {
		color: var(--color-green);
	}
</style>
