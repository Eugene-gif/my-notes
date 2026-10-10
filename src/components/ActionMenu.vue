<script setup lang="ts">
	import { ref, useId, watch } from 'vue';
	import type { MenuAction } from '@/types/notes';
	import IconMenu from '@/assets/icons/IconMenu.vue';
	import IconControl from '@/assets/icons/IconControl.vue';
	import { useMenu } from '@/composables/useMenu';

	withDefaults(
		defineProps<{
			actions: MenuAction[];
			label?: string;
			toolbar?: boolean;
			icon?: 'menu' | 'more' | 'user';
			align?: 'left' | 'right';
		}>(),
		{ label: 'Действия элемента', toolbar: false, align: 'right' },
	);

	const emit = defineEmits<{ action: [id: string]; 'open-change': [value: boolean] }>();
	const root = ref<HTMLElement | null>(null);
	const trigger = ref<HTMLButtonElement | null>(null);
	const menu = ref<HTMLElement | null>(null);
	const id = useId();
	const { open, opensUp, maxHeight, toggle, close } = useMenu(root, trigger, menu);
	watch(open, (value) => emit('open-change', value));

	const choose = (action: string) => {
		close(true);
		emit('action', action);
	};
</script>

<template>
	<div ref="root" class="todo__menu-container" :class="{ 'has-open-menu': open }">
		<button
			ref="trigger"
			class="button"
			:class="
				toolbar ? 'todo__menu-trigger' : icon === 'user' ? 'todo__user-trigger' : 'folder__options'
			"
			type="button"
			:aria-label="label"
			aria-haspopup="menu"
			:aria-controls="id"
			:aria-expanded="open"
			@click.stop="toggle"
		>
			<IconControl :name="icon ?? (toolbar ? 'menu' : 'more')" />
		</button>
		<Transition name="menu">
			<div
				v-if="open"
				:id="id"
				ref="menu"
				class="folder__menu"
				:class="{
					'todo__toolbar-menu': toolbar,
					'is-opening-up': opensUp,
					'is-aligned-left': align === 'left',
				}"
				:style="{ maxHeight: maxHeight === undefined ? undefined : maxHeight + 'px' }"
				role="menu"
				:aria-label="label"
			>
				<button
					v-for="action in actions"
					:key="action.id"
					class="folder__menu-action"
					:class="{ 'is-danger': action.danger }"
					type="button"
					role="menuitem"
					:disabled="action.disabled"
					@click.stop="choose(action.id)"
				>
					<IconMenu :name="action.icon ?? action.id" />
					<span class="menu__label">{{ action.label }}</span>
				</button>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-button-background);
		background-color: var(--color-button-background);
		color: var(--color-button-text);
		border-radius: 8px;
		cursor: pointer;
		padding: 12px;
		min-width: 40px;
		height: 40px;
		flex-shrink: 0;
		transition-property: color, background-color, border-color;
		transition-duration: 0.2s;
		font-weight: 600;
		line-height: 1;
		user-select: none;

		@media (hover: hover) {
			&:hover {
				background-color: var(--color-button-hover);
				border-color: var(--color-button-hover);
			}
		}

		&:active {
			filter: drop-shadow(0 0px 4px var(--color-yellow));
		}

		&:focus:not(:focus-visible) {
			outline: none;
		}

		&:focus-visible {
			outline: 2px solid var(--color-yellow);
			outline-offset: 1px;
		}
	}

	.todo__menu-container {
		position: relative;

		&.has-open-menu {
			z-index: 7;
		}
	}

	.menu-enter-active,
	.menu-leave-active {
		transition:
			opacity var(--menu-animation-duration),
			transform var(--menu-animation-duration);
	}
	.menu-enter-from,
	.menu-leave-to {
		opacity: 0;
		transform: translateY(var(--menu-enter-offset, -6px)) scale(0.98);
	}
	.menu-leave-active {
		pointer-events: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.menu-enter-active,
		.menu-leave-active {
			transition: none;
		}
	}

	.button.todo__menu-trigger,
	.button.todo__user-trigger,
	.button.folder__options {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
	}
	.button.folder__options,
	.button.todo__user-trigger {
		background-color: var(--color-gray-light);
		border-color: var(--color-gray-border-light);
		color: var(--color-gray-dark);

		@media (hover: hover) {
			&:hover {
				background-color: var(--color-gray-hover-light);
			}
		}
	}
	.todo__menu-trigger .icon {
		width: 24px;
		height: 24px;
	}

	.folder__menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 6;
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: max-content;
		min-width: 180px;
		max-width: calc(100vw - 32px);
		max-height: calc(100dvh - 24px);
		overflow-y: auto;
		padding: 4px;
		border: 1px solid var(--color-gray-border-light);
		border-radius: 8px;
		background: var(--color-white);
		box-shadow: 0 6px 18px var(--color-shadow-medium);
		transform-origin: top right;
		&.is-opening-up {
			--menu-enter-offset: 6px;
			top: auto;
			bottom: calc(100% + 8px);
			transform-origin: bottom right;
		}
		&.is-aligned-left {
			left: 0;
			right: auto;
			transform-origin: top left;

			&.is-opening-up {
				transform-origin: bottom left;
			}
		}
		&.is-menu-closing {
			pointer-events: none;
		}

		&[hidden] {
			display: none;
		}
	}

	.folder__menu-action {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-radius: 4px;
		background: var(--color-transparent);
		color: var(--color-gray-dark);
		font: inherit;
		font-size: 16px;
		line-height: 1.25;
		text-align: left;
		cursor: pointer;

		&.is-danger {
			color: var(--color-red);
		}

		&:hover,
		&:focus-visible {
			background-color: var(--color-gray-light);
		}
	}

	.menu__label {
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.todo__toolbar-menu {
		min-width: 200px;
	}

	.todo__menu-trigger:focus-visible,
	.folder__options:focus-visible,
	.folder__menu-action:focus-visible {
		outline: 2px solid var(--color-yellow);
		outline-offset: 2px;
	}

	.folder__options {
		align-self: flex-start;
	}
	.folder__menu-action:disabled {
		opacity: 0.45;
		cursor: default;
	}
</style>
