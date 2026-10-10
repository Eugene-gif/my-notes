import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NoticeStatus = 'success' | 'error' | 'info';

export interface NoticeMessage {
	id: number;
	message: string;
	status: NoticeStatus;
	duration: number;
	closable: boolean;
}

export const useNoticesStore = defineStore('notices', () => {
	const current = ref<NoticeMessage | null>(null);
	let sequence = 0;

	const show = (
		message: string,
		status: NoticeStatus = 'info',
		options: { duration?: number; closable?: boolean } = {},
	) => {
		const duration = options.duration ?? 2000;
		if (!Number.isFinite(duration) || duration < 0) throw new TypeError('Invalid notice duration');
		current.value = {
			id: ++sequence,
			message,
			status,
			duration,
			closable: options.closable ?? true,
		};
	};

	const close = () => {
		current.value = null;
	};

	return { current, show, close };
});
