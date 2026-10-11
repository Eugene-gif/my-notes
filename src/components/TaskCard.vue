<script setup lang="ts">
	import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from 'vue';
	import type { Task } from '@/types/notes';
	import { taskStatusLabel } from '@/utils/taskStatus';
	import IconTaskStatus from '@/assets/icons/IconTaskStatus.vue';
	import IconChevronDown from '@/assets/icons/IconChevronDown.vue';
	import ActionMenu from '@/components/ActionMenu.vue';
	import { useTaskExpansion } from '@/composables/useTaskExpansion';

	const props = defineProps<{
		entry: Task;
		selecting?: boolean;
		selected?: boolean;
		selectionDisabled?: boolean;
	}>();
	const emit = defineEmits<{
		toggle: [id: string];
		select: [id: string];
		action: [action: string, id: string];
	}>();
	const text = ref<HTMLElement | null>(null);
	const card = ref<HTMLElement | null>(null);
	const toggleButton = ref<HTMLButtonElement | null>(null);
	const { expanded, animating, toggle } = useTaskExpansion(card);
	const clipped = ref(false);
	const singleLine = ref(false);
	const menuOpen = ref(false);
	const status = computed(() => props.entry.status);
	let observer: ResizeObserver | undefined;

	const measure = () => {
		if (!text.value) return;
		clipped.value = text.value.scrollHeight > 40;
		singleLine.value = text.value.scrollHeight <= 21;
	};

	watch(
		() => props.entry.value,
		() => nextTick(measure),
	);
	onMounted(() => {
		observer = new ResizeObserver(measure);
		if (text.value) observer.observe(text.value);
		measure();
	});
	onScopeDispose(() => observer?.disconnect());

	const activate = () =>
		props.selecting ? emit('select', props.entry.id) : emit('toggle', props.entry.id);

	const expand = () => {
		void toggle();
		toggleButton.value?.focus({ preventScroll: true });
	};
</script>

<template>
	<li
		ref="card"
		class="todo__item item task"
		:class="{
			'is-selected': selected,
			'is-selecting': selecting,
			'is-expanded': expanded,
			'is-animating': animating,
			'is-single-line': singleLine,
			'has-open-menu': menuOpen,
		}"
		:data-id="entry.id"
		:data-status="status"
		:data-completed="status === 'completed'"
		@click="activate"
	>
		<button
			v-if="selecting"
			type="button"
			class="item__selection"
			:aria-pressed="!!selected"
			:aria-label="'Выбрать ' + entry.value"
			@click.stop="emit('select', entry.id)"
		>
			{{ selected ? '✔' : '' }}
		</button>
		<button
			ref="toggleButton"
			type="button"
			class="task__toggle"
			:aria-pressed="status === 'in-progress' ? 'mixed' : status === 'completed'"
			:aria-label="
				entry.value + '. Статус: ' + taskStatusLabel(status) + '. Изменить статус задачи'
			"
			@click.stop="activate"
		>
			<IconTaskStatus class="task__check" :status="status" />
			<span
				ref="text"
				class="task__text item__text"
				:class="{ 'is-clipped': clipped && !expanded }"
			>
				{{ entry.value }}
			</span>
		</button>
		<button
			v-if="clipped && !selecting"
			class="task__expand"
			type="button"
			:aria-label="expanded ? 'Свернуть задачу' : 'Развернуть задачу'"
			:aria-expanded="expanded"
			@click.stop="expand"
		>
			<IconChevronDown />
		</button>
		<ActionMenu
			v-if="!selecting"
			:actions="[
				{ id: 'edit', label: 'Изменить' },
				{ id: 'select', label: 'Выбрать', disabled: selectionDisabled },
				{ id: 'delete', label: 'Удалить', danger: true },
			]"
			:label="'Действия задачи «' + entry.value + '»'"
			@action="(action) => emit('action', action, entry.id)"
			@open-change="menuOpen = $event"
		/>
	</li>
</template>

<style scoped>
	.item {
		touch-action: pan-y pinch-zoom;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-gray-border);
		padding: 10px;
		border-radius: 12px;
		gap: 5px;
		min-width: 0;
		height: var(--card-height);
		box-sizing: border-box;

		.item__text {
			overflow-wrap: anywhere;
		}
	}

	.task {
		position: relative;
		padding: 10px 14px;
		align-items: center;
		gap: 12px;
		border-color: var(--color-gray-border-light);
		background: var(--color-white);
		box-shadow: 0 6px 24px var(--color-shadow);
		touch-action: pan-y pinch-zoom;
		user-select: none;
		cursor: pointer;

		&.is-expanded {
			height: auto;
			min-height: var(--card-height);
			align-items: flex-start;
			padding-bottom: 36px;
		}

		&.is-single-line:not(.is-expanded) .task__toggle {
			align-self: center;
		}

		&.is-animating {
			clip-path: inset(0 round 12px);
			align-items: flex-start;
			padding-bottom: 36px;
		}

		&.is-animating .task__text {
			max-height: none;
			mask-image: none;
			overflow: visible;
		}

		&.has-open-menu {
			z-index: 5;
		}

		&[data-completed='true'] {
			background-color: var(--color-green-light);
			border-color: var(--color-green-border);
		}

		&[data-status='in-progress'] {
			background-color: var(--color-yellow-light);
			border-color: var(--color-yellow-border);

			.task__check {
				visibility: visible;
				color: var(--color-yellow);
			}

			.task__expand .icon {
				background: var(--color-yellow-light);
			}
		}
	}

	.task__toggle {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		flex: 1 1 auto;
		min-width: 0;
		padding: 0 28px 0 40px;
		border-radius: 6px;
		background: var(--color-transparent);
		color: var(--color-gray-dark);
		font: inherit;
		text-align: left;
		cursor: pointer;
		touch-action: pan-y pinch-zoom;

		&:focus-visible {
			outline: 2px solid var(--color-yellow);
			outline-offset: 2px;
		}
	}

	.task__check {
		display: block;
		position: absolute;
		left: 12px;
		top: calc(var(--card-height) / 2 - 1px);
		translate: 0 -50%;
		width: 32px;
		height: 32px;
		color: var(--color-green);
		visibility: hidden;
	}

	.task__text {
		min-width: 0;
		line-height: 20px;
	}

	.task__text {
		display: block;
		white-space: pre-wrap;
		max-height: 40px;
		overflow: hidden;

		&.is-clipped {
			mask-image: linear-gradient(to bottom, var(--color-black) 45%, var(--color-transparent) 100%);
		}
	}

	.task.is-expanded .task__text {
		max-height: none;
		mask-image: none;
		overflow: visible;
	}

	.task__expand {
		position: absolute;
		z-index: 1;
		left: 50%;
		translate: -50% 0;
		bottom: 0;
		display: grid;
		place-items: center;
		align-items: end;
		width: 56px;
		height: 44px;
		padding-bottom: 2px;
		border-radius: 6px;
		background: var(--color-transparent);
		color: var(--color-gray);
		cursor: pointer;

		&:hover {
			color: var(--color-gray-dark);
		}

		&:focus-visible {
			outline: 2px solid var(--color-yellow);
			outline-offset: 2px;
		}
	}

	.task__expand .icon {
		border-radius: 6px;
		background: var(--color-white);
		transition: rotate var(--task-expand-duration) cubic-bezier(0.22, 1, 0.36, 1);
	}

	.task[data-completed='true'] .task__expand .icon {
		background: var(--color-green-light);
	}

	.task__expand[hidden] {
		display: none;
	}

	.task.is-expanded .task__expand .icon {
		rotate: 180deg;
	}

	@media (prefers-reduced-motion: reduce) {
		.task__expand .icon {
			transition: none;
		}
	}

	.task[data-completed='true'] {
		.task__check {
			visibility: visible;
		}

		.task__text {
			text-decoration: line-through;
			color: var(--color-gray);
		}
	}
	.is-selected {
		outline: 2px solid var(--color-yellow);
		outline-offset: 1px;
		background: var(--color-yellow-light) !important;
	}
	.item__selection {
		display: grid;
		place-items: center;
		flex: 0 0 22px;
		width: 22px;
		height: 22px;
		border: 1px solid var(--color-gray-muted);
		border-radius: 6px;
		color: var(--color-selection-text);
		background: var(--color-white);
		cursor: pointer;
		&[aria-pressed='true'] {
			border-color: var(--color-yellow);
			background: var(--color-yellow);
		}
	}
	.task.is-selecting .task__check {
		display: none;
	}
</style>
