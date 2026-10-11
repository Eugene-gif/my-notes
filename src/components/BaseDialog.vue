<script setup lang="ts">
	import { ref, useId } from 'vue';
	import { useDialog } from '@/composables/useDialog';
	import Button from '@/components/Button.vue';
	import IconControl from '@/assets/icons/IconControl.vue';

	defineProps<{ title: string; variant?: string }>();
	const open = defineModel<boolean>({ default: false });
	const dialog = ref<HTMLDialogElement | null>(null);
	const titleId = useId();
	const { requestClose } = useDialog(dialog, open, () => {
		open.value = false;
	});

	const closeOnBackdrop = (event: MouseEvent) => {
		if (event.target === dialog.value) requestClose();
	};
</script>

<template>
	<dialog
		ref="dialog"
		class="todo-modal"
		:class="variant"
		:aria-labelledby="titleId"
		@cancel.prevent="requestClose"
		@click="closeOnBackdrop"
		@close="open = false"
	>
		<div class="panel">
			<div class="workspace-modal__header">
				<h2 :id="titleId" class="text">{{ title }}</h2>
				<Button class="btn-modal-close" aria-label="Закрыть" @click="requestClose">
					<IconControl name="close" />
				</Button>
			</div>
			<slot v-if="open" />
		</div>
	</dialog>
</template>

<style scoped>
	.todo-modal {
		max-width: 360px;
		width: calc(100% - 30px);
		margin: 0 auto;
		margin-top: 20vh;
		border-radius: 12px;
		border: 1px solid var(--color-gray-border);
		animation: fadeIn var(--modal-animation-duration) ease both;

		&::backdrop {
			animation: fadeIn var(--modal-animation-duration) ease both;
			z-index: 2;
			backdrop-filter: blur(20px);
			background-color: var(--color-backdrop);
		}

		.panel {
			padding: 16px;
			background: var(--color-white);
			border-radius: 12px;
		}

		.text {
			font-size: 20px;
			font-weight: 600;
			margin-bottom: 20px;
			user-select: none;
			overflow-wrap: anywhere;
		}

		:deep(.modal-description) {
			margin-bottom: 20px;
			color: var(--color-gray);
			font-size: 14px;
		}

		.btn-modal-close {
			background-color: var(--color-transparent);
			color: var(--color-gray-dark);
		}
		:deep(.actions) {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 20px;
		}
	}

	/* класс .close нужен для анимации закрытия */
	.todo-modal.close {
		animation: fadeOut var(--modal-animation-duration) ease both;

		&::backdrop {
			animation: fadeOut var(--modal-animation-duration) ease both;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}

		to {
			opacity: 0;
		}
	}
	.workspace-modal__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
	}
	.workspace-modal__header .text {
		margin: 0;
	}
	.workspace-modal__header .btn-modal-close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		padding: 0;
	}
	.todo-modal.view-modal {
		max-width: 440px;
	}
	.todo-modal.add-modal {
		max-height: calc(100dvh - 40px);
		margin-top: min(20vh, 80px);
	}

	.todo-modal:is(.note-modal, .task-modal) {
		max-width: 480px;
	}

	.todo-modal:is(.note-modal, .task-modal) {
		max-height: calc(100dvh - 40px);
		margin-top: 20px;
		padding: 0;
		overflow: hidden;
	}

	.todo-modal:is(.note-modal, .task-modal) .panel {
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - 42px);
		box-sizing: border-box;
		overflow: hidden;
		> * {
			flex-shrink: 0;
		}
	}

	.todo-modal.task-modal {
		max-width: 500px;
	}
	.todo-modal.search-modal {
		position: fixed;
		top: 20px;
		margin: 0 auto;
		max-width: 640px;
		max-height: calc(100dvh - 40px);
		overflow: hidden;
	}
	.search-modal .panel {
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - 42px);
		overflow: hidden;
	}

	.todo-modal.path-modal {
		position: fixed;
		top: 20px;
		margin: 0 auto;
		max-width: 640px;
		max-height: calc(100dvh - 40px);
		overflow: hidden;
	}
	.path-modal .panel {
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - 42px);
		overflow: hidden;
	}
	.todo-modal:is(.search-modal, .path-modal) .workspace-modal__header {
		flex-shrink: 0;
	}
</style>
