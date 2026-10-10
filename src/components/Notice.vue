<script setup lang="ts">
	import { useNotice } from '@/composables/useNotice';
	import IconControl from '@/assets/icons/IconControl.vue';

	withDefaults(defineProps<{ top?: string; width?: string }>(), { top: '20px', width: '460px' });
	const { current, host, target, closing, close } = useNotice();
</script>

<template>
	<Teleport v-if="target" :to="target">
		<div
			v-if="current"
			ref="host"
			class="notice-host"
			:class="{ 'is-closing': closing }"
			popover="manual"
			:data-status="current.status"
			:role="current.status === 'error' ? 'alert' : 'status'"
			:aria-live="current.status === 'error' ? 'assertive' : 'polite'"
			aria-atomic="true"
			:style="{ '--notice-top': top, '--notice-width': width }"
		>
			<div class="notice">
				<span class="notice__icon" aria-hidden="true">
					{{ current.status === 'success' ? '✓' : current.status === 'error' ? '✕' : 'ⓘ' }}
				</span>
				<span class="notice__text">{{ current.message }}</span>
				<button
					v-if="current.closable"
					type="button"
					class="notice__close"
					aria-label="Закрыть уведомление"
					@click="close"
				>
					<IconControl name="close" />
				</button>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
	.notice-host {
		position: fixed;
		inset: var(--notice-top, 20px) 0 auto;
		margin: 0 auto;
		padding: 0;
		width: min(var(--notice-width, 460px), calc(100vw - 32px));
		max-width: none;
		overflow: visible;
		border: 0;
		background: var(--color-transparent);
		color: var(--color-gray-dark);
		z-index: 20000;
		pointer-events: none;
	}

	.notice {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		border: 1px solid var(--notice-border);
		border-radius: 12px;
		background: var(--notice-bg);
		box-shadow: 0 6px 24px var(--color-shadow);
		animation: notice-enter 180ms ease-out both;
	}

	.notice__icon {
		display: grid;
		place-items: center;
		flex: 0 0 28px;
		color: var(--notice-accent);
	}

	.notice__text {
		flex: 1 1 auto;
		min-width: 0;
		font: inherit;
		font-size: 14px;
		line-height: 1.5;
		overflow-wrap: anywhere;
		text-align: left;
	}

	.notice__close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		border: 0;
		border-radius: 6px;
		background: var(--color-transparent);
		color: var(--color-gray);
		cursor: pointer;
		pointer-events: auto;

		&:hover {
			background: var(--color-shadow-light);
			color: var(--color-gray-dark);
		}

		&:focus-visible {
			outline: 2px solid var(--notice-accent);
			outline-offset: 2px;
		}
	}

	.notice-host.is-closing .notice {
		animation: notice-leave 160ms ease-in both;
	}

	@keyframes notice-enter {
		from {
			opacity: 0;
			translate: 0 -8px;
		}

		to {
			opacity: 1;
			translate: 0 0;
		}
	}

	@keyframes notice-leave {
		from {
			opacity: 1;
			translate: 0 0;
		}

		to {
			opacity: 0;
			translate: 0 -6px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.notice,
		.notice-host.is-closing .notice {
			animation: none;
		}
	}
	.notice-host {
		--notice-success: var(--color-green);
		--notice-success-bg: var(--color-green-light);
		--notice-success-border: var(--color-green-border);
		--notice-error: var(--color-red);
		--notice-error-bg: var(--color-red-light);
		--notice-error-border: var(--color-red-border);
		--notice-info: var(--color-blue);
		--notice-info-bg: var(--color-blue-light);
		--notice-info-border: var(--color-blue-border);
		--notice-accent: var(--notice-info);
		--notice-bg: var(--notice-info-bg);
		--notice-border: var(--notice-info-border);
	}

	.notice-host[data-status='success'] {
		--notice-accent: var(--notice-success);
		--notice-bg: var(--notice-success-bg);
		--notice-border: var(--notice-success-border);
	}

	.notice-host[data-status='error'] {
		--notice-accent: var(--notice-error);
		--notice-bg: var(--notice-error-bg);
		--notice-border: var(--notice-error-border);
	}
</style>
