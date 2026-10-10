<script setup lang="ts">
	import { computed, ref } from 'vue';
	import type { Container, ParentId } from '@/types/notes';
	import IconContainer from '@/assets/icons/IconContainer.vue';
	import IconHome from '@/assets/icons/IconHome.vue';
	import IconControl from '@/assets/icons/IconControl.vue';
	import { useCompactPath } from '@/composables/useCompactPath';
	import BaseDialog from '@/components/BaseDialog.vue';
	import Button from '@/components/Button.vue';

	const props = defineProps<{ path: Container[]; selecting: boolean }>();
	const emit = defineEmits<{ navigate: [id: ParentId] }>();
	const nav = ref<HTMLElement | null>(null);
	const fullPath = ref(false);
	const version = computed(() => props.path.map((entry) => entry.name).join('/'));
	const { compact } = useCompactPath(nav, version);
	const links = computed(
		() => [{ id: null, name: 'Главная', type: 'home' }, ...props.path] as const,
	);
	const visible = computed(() =>
		compact.value ? [links.value[0], links.value.at(-1)!] : links.value,
	);

	const navigate = (id: ParentId) => {
		if (!props.selecting) {
			fullPath.value = false;
			emit('navigate', id);
		}
	};
</script>

<template>
	<div class="todo__navigation">
		<nav ref="nav" class="todo__breadcrumbs" aria-label="Путь к разделу">
			<template v-for="(entry, index) in visible" :key="entry.id ?? 'home'">
				<span v-if="index" class="todo__path-separator">›</span>
				<template v-if="compact && index === 1">
					<button
						class="todo__path-button todo__path-ellipsis"
						type="button"
						aria-label="Показать полный путь"
						:disabled="selecting"
						@click="fullPath = true"
					>
						…
					</button>
					<span class="todo__path-separator">›</span>
				</template>
				<button
					class="todo__path-button"
					type="button"
					:title="entry.name"
					:aria-label="entry.name"
					:aria-current="index === visible.length - 1 ? 'page' : undefined"
					:disabled="selecting"
					:data-navigate-folder="entry.id ?? ''"
					:data-drop-folder="entry.type === 'note' ? undefined : (entry.id ?? '')"
					@click="navigate(entry.id)"
				>
					<IconHome v-if="entry.type === 'home'" class="todo__path-icon" />
					<IconContainer v-else class="todo__path-icon" :entry="entry" open />
					<span v-if="entry.id" class="todo__path-name">{{ entry.name }}</span>
				</button>
			</template>
		</nav>
		<div v-if="path.length" class="todo__toolbar">
			<Button
				class="todo__back"
				aria-label="Назад"
				:disabled="selecting"
				@click="navigate(path.at(-1)!.parentId)"
			>
				<IconControl name="back" />
			</Button>
		</div>
	</div>
	<BaseDialog v-model="fullPath" title="Путь к разделу" variant="path-modal">
		<div class="path-items">
			<button
				v-for="entry in links"
				:key="entry.id ?? 'home'"
				class="todo__path-button"
				type="button"
				@click="navigate(entry.id)"
			>
				<IconHome v-if="entry.type === 'home'" class="todo__path-icon" />
				<IconContainer v-else class="todo__path-icon" :entry="entry" open />
				<span class="todo__path-name">{{ entry.name }}</span>
			</button>
		</div>
	</BaseDialog>
</template>

<style scoped>
	.todo__navigation {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: nowrap;
		height: 40px;
		gap: 12px;
	}

	.todo__breadcrumbs {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		flex: 1 1 120px;
		min-width: 0;
		text-align: left;
	}

	.todo__path-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		max-width: 100%;
		min-height: 30px;
		padding: 5px 8px;
		border-radius: 6px;
		background: var(--color-transparent);
		color: var(--color-gray);
		font: inherit;
		font-size: 16px;
		line-height: 1.25;
		overflow-wrap: anywhere;
		text-align: left;
		cursor: pointer;

		&[aria-current='page'] {
			background: var(--color-gray-light);
			color: var(--color-gray-dark);
			font-weight: 600;
		}
	}

	.todo__path-icon {
		flex: 0 0 20px;
		width: 20px;
		height: 20px;
	}
	.button.todo__back {
		width: 40px;
		padding: 0;
		background-color: var(--color-gray-light);
		border-color: var(--color-gray-border-light);
		color: var(--color-gray-dark);

		@media (hover: hover) {
			&:hover {
				background-color: var(--color-gray-hover-light);
				border-color: var(--color-gray-border-light);
			}
		}
	}

	.todo__path-button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.todo__path-name {
		min-width: 0;
	}

	.todo__path-separator {
		color: var(--color-gray-muted);
	}

	.todo__toolbar {
		display: flex;
		align-self: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		gap: 8px;
		margin-left: auto;
	}

	.todo__navigation {
		flex-wrap: nowrap;
		align-items: center;
	}
	.todo__breadcrumbs {
		flex-wrap: nowrap;
		overflow: hidden;
	}
	.todo__breadcrumbs .todo__path-button {
		flex: 0 0 auto;
		height: 30px;
		white-space: nowrap;
	}
	.todo__breadcrumbs .todo__path-button:last-child {
		flex: 0 1 auto;
		min-width: 0;
	}
	.todo__path-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.todo__path-separator {
		flex-shrink: 0;
	}
	.todo__toolbar {
		align-self: center;
	}
	.todo__path-ellipsis {
		font-size: 20px;
	}
	.path-items {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		overflow-y: auto;
		min-height: 0;
	}
	.path-items .todo__path-name {
		white-space: normal;
	}
	.todo__path-button:focus-visible {
		outline: 2px solid var(--color-yellow);
		outline-offset: 2px;
	}
	.is-drop-target {
		outline: 2px dashed var(--color-yellow);
		outline-offset: 3px;
		background-color: var(--color-yellow-light);
	}
</style>
