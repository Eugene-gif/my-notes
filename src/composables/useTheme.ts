import { watch, type Ref } from 'vue';
import type { Theme } from '@/types/notes';
import { applyTheme } from '@/utils/theme';

export const useTheme = (theme: Ref<Theme>) => {
	watch(theme, (value) => applyTheme(value), { immediate: true, flush: 'sync' });
};
