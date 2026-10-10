import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';
import type { NotesState, ParentId } from '@/types/notes';
import { searchEntries } from '@/utils/search';

const useSearch = (state: Ref<NotesState>, currentId: Ref<ParentId>, open: Ref<boolean>) => {
	const query = ref('');
	const settled = ref('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	const cancel = () => {
		clearTimeout(timer);
		timer = undefined;
	};

	watch(query, (value) => {
		cancel();
		timer = setTimeout(() => {
			if (open.value) settled.value = value;
		}, 300);
	});

	watch(
		open,
		() => {
			cancel();
			query.value = '';
			settled.value = '';
		},
		{ flush: 'sync' },
	);

	onScopeDispose(cancel);
	const results = computed(() => searchEntries(state.value, settled.value, currentId.value));

	return { query, settled, results };
};

export { useSearch };
