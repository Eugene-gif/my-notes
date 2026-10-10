import { inject, onScopeDispose, type Ref } from 'vue';
import { PWA_KEY } from '@/constants/pwa';

export const useUnsavedChanges = (dirty: Ref<boolean>) => {
	const release = inject(PWA_KEY, null)?.trackDraft(dirty);
	if (release) onScopeDispose(release);
};
