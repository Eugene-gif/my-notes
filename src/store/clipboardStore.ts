import { defineStore } from 'pinia';
import { computed, shallowRef, toRaw } from 'vue';
import type { EntryClipboard, ParentId } from '@/types/notes';
import { createClipboard, canPasteClipboard } from '@/utils/clipboard';
import { useNotesStore } from '@/store/notesStore';

export const useClipboardStore = defineStore('clipboard', () => {
	const notes = useNotesStore();
	const buffer = shallowRef<EntryClipboard | null>(null);
	const count = computed(() => buffer.value?.rootIds.length ?? 0);

	const copy = (ids: string[]) => {
		const snapshot = createClipboard(toRaw(notes.state), ids);
		if (!snapshot) return false;
		buffer.value = snapshot;
		return true;
	};
	const clear = () => {
		buffer.value = null;
	};
	const canPaste = (parentId: ParentId) =>
		!!buffer.value && canPasteClipboard(notes.state, buffer.value, parentId);
	const paste = (parentId: ParentId) => {
		if (!buffer.value || !notes.paste(buffer.value, parentId)) return false;
		clear();
		return true;
	};

	return { buffer, count, copy, clear, canPaste, paste };
});
