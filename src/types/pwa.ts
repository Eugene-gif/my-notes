import type { ComputedRef, Ref } from 'vue';

export interface InstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaController {
	offlineReady: Ref<boolean>;
	needRefresh: Ref<boolean>;
	dismissed: Ref<boolean>;
	installed: Ref<boolean>;
	installing: Ref<boolean>;
	updating: Ref<boolean>;
	showInstallHelp: Ref<boolean>;
	error: Ref<string>;
	updateBlocked: Ref<boolean>;
	hasUnsavedChanges: ComputedRef<boolean>;
	install: () => Promise<void>;
	update: () => void;
	checkForUpdate: () => Promise<void>;
	dismiss: () => void;
	trackDraft: (dirty: Ref<boolean>) => () => void;
}
