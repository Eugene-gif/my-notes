<script setup lang="ts">
	import { computed, onMounted, onScopeDispose, ref, watch } from 'vue';
	import { useRoute, useRouter } from 'vue-router';
	import type {
		ContainerType,
		DropDestination,
		Entry,
		MenuAction,
		ParentId,
		PendingDrop,
	} from '@/types/notes';
	import { useNotesStore } from '@/store/notesStore';
	import { useWorkspaceStore } from '@/store/workspaceStore';
	import { useNoticesStore } from '@/store/noticesStore';
	import { getChildren, canPlaceEntries, canSwapEntries } from '@/utils/entries';
	import { ancestorEntries } from '@/utils/search';
	import { containerNoun } from '@/utils/format';
	import { useSelection } from '@/composables/useSelection';
	import { useDragAndDrop } from '@/composables/useDragAndDrop';
	import ActionMenu from '@/components/ActionMenu.vue';
	import Breadcrumbs from '@/components/Breadcrumbs.vue';
	import EntryList from '@/components/EntryList.vue';
	import NoteView from '@/components/NoteView.vue';
	import BaseDialog from '@/components/BaseDialog.vue';
	import EntryForm from '@/components/EntryForm.vue';
	import AddEntryPicker from '@/components/AddEntryPicker.vue';
	import LayoutPicker from '@/components/LayoutPicker.vue';
	import SearchDialog from '@/components/SearchDialog.vue';
	import SelectionToolbar from '@/components/SelectionToolbar.vue';
	import DropActionMenu from '@/components/DropActionMenu.vue';
	import Button from '@/components/Button.vue';

	const title = 'Мои заметки';
	const userActions: MenuAction[] = [
		{ id: 'theme', label: 'Сменить тему' },
		{ id: 'register', label: 'Регистрация' },
		{ id: 'login', label: 'Войти' },
	];

	const route = useRoute();
	const router = useRouter();
	const notes = useNotesStore();
	const workspace = useWorkspaceStore();
	const notices = useNoticesStore();

	const root = ref<HTMLElement | null>(null);

	const currentId = computed<ParentId>(() =>
		typeof route.params.id === 'string' ? route.params.id : null,
	);
	const current = computed(() => notes.entry(currentId.value));
	const entries = computed(() => getChildren(notes.state, currentId.value));
	const path = computed(() => ancestorEntries(notes.state, currentId.value));
	const { selecting, selected, ids, finish, toggleMode, toggle, toggleAll, mark, dragIds } =
		useSelection(entries);

	const addOpen = ref(false);
	const searchOpen = ref(false);
	const viewOpen = ref(false);
	const formOpen = ref(false);
	const deleteOpen = ref(false);
	const noteEditing = ref(false);
	const formType = ref<Entry['type']>('folder');
	const edited = ref<Entry | undefined>();
	const insertPosition = ref<'before' | 'after'>('after');
	const deleting = ref<string[]>([]);
	const pendingDrop = ref<PendingDrop | null>(null);
	const highlight = ref<string>();

	let highlightTimer: ReturnType<typeof setTimeout> | undefined;
	let focusTimer: ReturnType<typeof setTimeout> | undefined;

	const layout = computed({
		get: () => workspace.layout,
		set: (value) => {
			workspace.setLayout(value);
		},
	});

	const formTitle = computed(() => {
		if (edited.value) return 'Изменить элемент';
		return formType.value === 'task' ? 'Добавить задачу' : 'Создать элемент';
	});

	const formVariant = computed(() => {
		if (formType.value === 'note') return 'note-modal';
		return formType.value === 'task' ? 'textarea-modal' : '';
	});

	const actions = computed<MenuAction[]>(() => {
		const result: MenuAction[] = [];
		if (!current.value || current.value.type === 'folder')
			result.push({ id: 'add', label: 'Добавить', disabled: selecting.value });
		if (entries.value.length)
			result.push({ id: 'select', label: selecting.value ? 'Завершить выбор' : 'Выбрать' });
		if (current.value?.type === 'folder' || current.value?.type === 'checklist')
			result.push({ id: 'rename', label: 'Переименовать', disabled: selecting.value });
		if (current.value?.type === 'note') result.push({ id: 'edit-note', label: 'Изменить заметку' });
		result.push({ id: 'search', label: 'Поиск', disabled: selecting.value });
		if (!current.value || current.value.type === 'folder')
			result.push({ id: 'view', label: 'Вид' });
		if (current.value)
			result.push({
				id: 'delete',
				label: 'Удалить ' + containerNoun(current.value.type),
				danger: true,
				disabled: selecting.value,
			});

		return result;
	});

	const navigate = (id: ParentId) => {
		if (selecting.value) {
			notices.show('Завершите выбор, чтобы перейти в другой раздел.');

			return;
		}
		void router.push(id ? { name: 'entry', params: { id } } : { name: 'home' });
	};

	const showForm = (type: Entry['type'], entry?: Entry, position: 'before' | 'after' = 'after') => {
		formType.value = type;
		edited.value = entry;
		insertPosition.value = position;
		formOpen.value = true;
	};

	const chooseType = (type: ContainerType) => {
		addOpen.value = false;
		showForm(type);
	};

	const saveForm = (name: string, description: string) => {
		const success = edited.value
			? notes.update(edited.value.id, name, description)
			: !!notes.create(formType.value, currentId.value, name, description, insertPosition.value);
		if (success) formOpen.value = false;
	};

	const saveNote = (name: string, description: string) => {
		const note = current.value;
		if (!note || note.type !== 'note') return;

		if (notes.update(note.id, name, description)) noteEditing.value = false;
	};

	const showTaskForm = (position: 'before' | 'after') => {
		showForm('task', undefined, position);
	};

	const requestDelete = (values: string[]) => {
		deleting.value = [...values];
		deleteOpen.value = true;
	};

	const deleteConfirmed = () => {
		const parentId = current.value?.parentId ?? null;
		if (!notes.remove(deleting.value)) return;
		finish();
		deleteOpen.value = false;
		if (currentId.value && !notes.entry(currentId.value)) navigate(parentId);
	};

	const editNote = (entry: Entry) => {
		if (entry.type !== 'note') return;
		if (entry.id !== currentId.value)
			void router.push({ name: 'entry', params: { id: entry.id } }).then(() => {
				noteEditing.value = true;
			});
		else noteEditing.value = true;
	};

	const cardAction = (action: string, id: string) => {
		const entry = notes.entry(id);
		if (!entry) return;
		if (action === 'open') navigate(id);
		if (action === 'select') mark(id);
		if (action === 'edit-note') editNote(entry);
		if (action === 'rename' || action === 'edit') showForm(entry.type, entry);
		if (action === 'delete') requestDelete([id]);
	};

	const toolbarAction = (action: string) => {
		if (action === 'add') addOpen.value = true;
		if (action === 'select') toggleMode();
		if (action === 'search') searchOpen.value = true;
		if (action === 'view') viewOpen.value = true;
		if (current.value) cardAction(action, current.value.id);
	};

	const searchNavigate = (entry: Entry) => {
		navigate(entry.type === 'task' ? entry.parentId : entry.id);
		if (entry.type === 'task') {
			clearTimeout(highlightTimer);
			clearTimeout(focusTimer);
			highlight.value = entry.id;
			focusTimer = setTimeout(() => {
				const card = [...(root.value?.querySelectorAll<HTMLElement>('.todo__item') ?? [])].find(
					(card) => card.dataset.id === entry.id,
				);
				card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
				card?.querySelector<HTMLButtonElement>('.task__toggle')?.focus({ preventScroll: true });
			}, 350);
			highlightTimer = setTimeout(() => {
				highlight.value = undefined;
			}, 4000);
		}
	};

	const canDrop = (values: string[], destination: DropDestination) => {
		if (destination.type === 'swap')
			return (
				values.length === 1 &&
				!!destination.referenceId &&
				canSwapEntries(notes.state, values[0], destination.referenceId)
			);
		if (destination.type === 'folder' && destination.referenceId)
			return (
				(notes.entry(destination.parentId)?.type === 'folder' &&
					canPlaceEntries(notes.state, values, destination.parentId)) ||
				(values.length === 1 && canSwapEntries(notes.state, values[0], destination.referenceId))
			);

		return canPlaceEntries(notes.state, values, destination.parentId);
	};

	const applyDrop = (values: string[], destination: DropDestination) => {
		if (destination.type === 'folder' && destination.referenceId) {
			pendingDrop.value = { ids: values, destination };

			return;
		}
		const changed =
			destination.type === 'swap' && destination.referenceId
				? notes.swap(values[0], destination.referenceId)
				: notes.move(
						values,
						destination.parentId,
						destination.referenceId ?? null,
						destination.position ?? 'after',
					);
		if (changed) finish();
	};

	const chooseDrop = (type: 'move' | 'swap') => {
		const pending = pendingDrop.value;
		if (!pending) return;
		pendingDrop.value = null;
		applyDrop(pending.ids, {
			...pending.destination,
			type,
			referenceId: type === 'swap' ? pending.destination.parentId : null,
		});
	};

	const cancelDrop = () => {
		pendingDrop.value = null;
		notices.show('Перенос отменён.');
	};

	useDragAndDrop(root, {
		getEntry: notes.entry,
		getDragIds: dragIds,
		canDrop,
		onDrop: applyDrop,
		onNavigate: (id) => {
			void router.push(id ? { name: 'entry', params: { id } } : { name: 'home' });
		},
		onStatus: notices.show,
	});
	watch(currentId, () => {
		noteEditing.value = false;
		finish();
		pendingDrop.value = null;
		formOpen.value = false;
		searchOpen.value = false;
		addOpen.value = false;
		deleteOpen.value = false;
	});

	const keyboard = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && !root.value?.querySelector('dialog[open]')) {
			if (pendingDrop.value) cancelDrop();
			else finish();
		}
	};

	onMounted(() => {
		workspace.initialize();
		document.addEventListener('keydown', keyboard);
	});
	onScopeDispose(() => {
		document.removeEventListener('keydown', keyboard);
		clearTimeout(highlightTimer);
		clearTimeout(focusTimer);
	});
</script>

<template>
	<main ref="root" class="todo-container todo" :class="{ 'is-selecting': selecting }">
		<header class="todo__header">
			<ActionMenu
				class="todo__user-options"
				icon="user"
				align="left"
				:actions="userActions"
				label="Меню пользователя"
			/>
			<h1 class="todo__title">{{ title }}</h1>
			<ActionMenu
				:key="currentId ?? 'home'"
				class="todo__context-options"
				toolbar
				:actions="actions"
				label="Действия раздела"
				@action="toolbarAction"
			/>
		</header>
		<Breadcrumbs :path="path" :selecting="selecting" @navigate="navigate" />
		<NoteView
			v-if="current?.type === 'note'"
			:note="current"
			:editing="noteEditing"
			@edit="noteEditing = true"
			@cancel="noteEditing = false"
			@save="saveNote"
		/>
		<template v-else>
			<div class="todo__count">
				<div class="todo__count-value">Элементов: {{ entries.length }}</div>
				<SelectionToolbar
					v-if="selecting"
					:count="ids.length"
					:total="entries.length"
					@all="toggleAll"
					@remove="requestDelete(ids)"
					@cancel="finish"
				/>
			</div>
			<EntryList
				:entries="entries"
				:current-id="currentId"
				:checklist="current?.type === 'checklist'"
				:layout="workspace.layout"
				:selecting="selecting"
				:selected="selected"
				:highlight="highlight"
				@open="navigate"
				@toggle="notes.toggleTask"
				@select="toggle"
				@action="cardAction"
				@add="showTaskForm"
			/>
		</template>
		<BaseDialog v-model="addOpen" title="Добавить элемент" variant="add-modal">
			<AddEntryPicker @choose="chooseType" />
		</BaseDialog>
		<BaseDialog v-model="formOpen" :title="formTitle" :variant="formVariant">
			<EntryForm :type="formType" :entry="edited" @save="saveForm" @cancel="formOpen = false" />
		</BaseDialog>
		<BaseDialog v-model="deleteOpen" title="Удалить элементы?">
			<p class="modal-description">
				{{ deleting.length > 1 ? 'Выбрано элементов: ' + deleting.length + '. ' : '' }}Вложенные
				элементы тоже будут удалены.
			</p>
			<div class="actions">
				<Button danger @click="deleteConfirmed">Удалить</Button>
				<Button @click="deleteOpen = false">Отмена</Button>
			</div>
		</BaseDialog>
		<BaseDialog v-model="viewOpen" title="Вид" variant="view-modal">
			<LayoutPicker v-model="layout" />
		</BaseDialog>
		<SearchDialog v-model="searchOpen" :current-id="currentId" @navigate="searchNavigate" />
		<DropActionMenu
			v-if="pendingDrop"
			:pending="pendingDrop"
			@choose="chooseDrop"
			@cancel="cancelDrop"
		/>
	</main>
</template>

<style scoped>
	.todo-container {
		max-width: var(--layout-width);
		margin: 0 auto;
		padding: 24px;
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-border-light);
		border-radius: 8px;
	}
	.todo {
		container-name: todo;
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		gap: 15px;

		.todo__header {
			display: grid;
			grid-template-columns: 40px minmax(0, 1fr) 40px;
			align-items: center;
			gap: 8px;
		}
		.todo__header .todo__user-options {
			grid-column: 1;
		}
		.todo__header .todo__title {
			grid-column: 2;
		}
		.todo__header .todo__context-options {
			grid-column: 3;
		}
		.todo__back[hidden] {
			display: none;
		}

		.todo__title {
			font-weight: 600;
			font-size: 1.75rem;
			margin: 0;
			line-height: 120%;
			letter-spacing: -0.02em;
			color: var(--color-black);
		}

		.todo__count {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			align-items: center;
			justify-content: space-between;
			font-weight: 600;
			font-size: 1rem;
			color: var(--color-black);
			margin: 10px 0;
		}

		.todo__actions {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 12px;
			margin-left: auto;
		}
	}
	@media (max-width: 480px) {
		.todo-container {
			padding: 16px 10px;
		}
	}
	.is-dragging {
		user-select: none;
	}
	.is-dragging :deep(.todo__item),
	.is-dragging :deep(.todo__item *) {
		cursor: pointer;
	}

	.todo :deep(.is-drop-target) {
		outline: 2px dashed var(--color-yellow);
		outline-offset: 3px;
		background-color: var(--color-yellow-light);
	}

	.todo :deep(.is-swap-target) {
		z-index: 4;
		outline: 2px solid var(--color-yellow);
		outline-offset: 3px;
		background-color: var(--color-yellow-light);
	}
	.todo :deep(.is-swap-target::after) {
		content: '⇄ Поменять местами';
		position: absolute;
		top: -14px;
		left: 50%;
		translate: -50% 0;
		max-width: 100%;
		padding: 3px 8px;
		border: 1px solid var(--color-yellow);
		border-radius: 6px;
		background: var(--color-yellow-light);
		color: var(--color-gray-dark);
		font-size: 12px;
		text-align: center;
		pointer-events: none;
	}

	:global(.todo__drag-preview) {
		position: fixed;
		z-index: 10000;
		max-width: min(280px, calc(100vw - 28px));
		max-height: 120px;
		overflow: hidden;
		overflow-wrap: anywhere;
		padding: 12px;
		border: 1px solid var(--color-yellow);
		border-radius: 12px;
		background: var(--color-white);
		color: var(--color-gray-dark);
		box-shadow: 0 6px 20px var(--color-shadow-strong);
		font-size: 14px;
		pointer-events: none;
	}

	:global(.todo__drop-marker) {
		position: fixed;
		z-index: 9999;
		height: 3px;
		border-radius: 3px;
		background-color: var(--color-yellow);
		box-shadow: 0 0 0 1px var(--color-white);
		pointer-events: none;
	}
	:global(.todo__drop-marker::before),
	:global(.todo__drop-marker::after) {
		content: '';
		position: absolute;
		top: -2px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background-color: var(--color-yellow);
	}
	:global(.todo__drop-marker::before) {
		left: 0;
	}
	:global(.todo__drop-marker::after) {
		right: 0;
	}
	:global(.todo__drop-marker.is-vertical::before),
	:global(.todo__drop-marker.is-vertical::after) {
		left: -2px;
		right: auto;
	}
	:global(.todo__drop-marker.is-vertical::before) {
		top: 0;
	}
	:global(.todo__drop-marker.is-vertical::after) {
		top: auto;
		bottom: 0;
	}
</style>
