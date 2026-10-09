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
import ActionMenu from '@/components/ActionMenu/ActionMenu.vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import EntryList from '@/components/EntryList/EntryList.vue';
import NoteView from '@/components/NoteView/NoteView.vue';
import BaseDialog from '@/components/BaseDialog/BaseDialog.vue';
import EntryForm from '@/components/EntryForm/EntryForm.vue';
import AddEntryPicker from '@/components/AddEntryPicker/AddEntryPicker.vue';
import LayoutPicker from '@/components/LayoutPicker/LayoutPicker.vue';
import SearchDialog from '@/components/SearchDialog/SearchDialog.vue';
import SelectionToolbar from '@/components/SelectionToolbar/SelectionToolbar.vue';
import DropActionMenu from '@/components/DropActionMenu/DropActionMenu.vue';
import Button from '@/components/Button/Button.vue';

const title = import.meta.env.VITE_APP_TITLE || 'My notes';
const route = useRoute(),
  router = useRouter(),
  notes = useNotesStore(),
  workspace = useWorkspaceStore(),
  notices = useNoticesStore();
const root = ref<HTMLElement | null>(null);
const currentId = computed<ParentId>(() =>
  typeof route.params.id === 'string' ? route.params.id : null,
);
const current = computed(() => notes.entry(currentId.value));
const entries = computed(() => getChildren(notes.state, currentId.value));
const path = computed(() => ancestorEntries(notes.state, currentId.value));
const { selecting, selected, ids, finish, toggleMode, toggle, toggleAll, mark, dragIds } =
  useSelection(entries);
const addOpen = ref(false),
  searchOpen = ref(false),
  viewOpen = ref(false),
  formOpen = ref(false),
  deleteOpen = ref(false),
  noteEditing = ref(false);
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
  if (!current.value || current.value.type === 'folder') result.push({ id: 'view', label: 'Вид' });
  if (current.value)
    result.push({
      id: 'delete',
      label: 'Удалить ' + containerNoun(current.value.type),
      danger: true,
      disabled: selecting.value,
    });
  return result;
});
function navigate(id: ParentId) {
  if (selecting.value) {
    notices.show('Завершите выбор, чтобы перейти в другой раздел.');
    return;
  }
  void router.push(id ? { name: 'entry', params: { id } } : { name: 'home' });
}
function showForm(type: Entry['type'], entry?: Entry, position: 'before' | 'after' = 'after') {
  formType.value = type;
  edited.value = entry;
  insertPosition.value = position;
  formOpen.value = true;
}
function chooseType(type: ContainerType) {
  addOpen.value = false;
  showForm(type);
}
function saveForm(name: string, description: string) {
  const success = edited.value
    ? notes.update(edited.value.id, name, description)
    : !!notes.create(formType.value, currentId.value, name, description, insertPosition.value);
  if (success) formOpen.value = false;
}
function requestDelete(values: string[]) {
  deleting.value = [...values];
  deleteOpen.value = true;
}
function deleteConfirmed() {
  const parentId = current.value?.parentId ?? null;
  if (!notes.remove(deleting.value)) return;
  finish();
  deleteOpen.value = false;
  if (currentId.value && !notes.entry(currentId.value)) navigate(parentId);
}
function editNote(entry: Entry) {
  if (entry.type !== 'note') return;
  if (entry.id !== currentId.value)
    void router.push({ name: 'entry', params: { id: entry.id } }).then(() => {
      noteEditing.value = true;
    });
  else noteEditing.value = true;
}
function cardAction(action: string, id: string) {
  const entry = notes.entry(id);
  if (!entry) return;
  if (action === 'open') navigate(id);
  if (action === 'select') mark(id);
  if (action === 'edit-note') editNote(entry);
  if (action === 'rename' || action === 'edit') showForm(entry.type, entry);
  if (action === 'delete') requestDelete([id]);
}
function toolbarAction(action: string) {
  if (action === 'add') addOpen.value = true;
  if (action === 'select') toggleMode();
  if (action === 'search') searchOpen.value = true;
  if (action === 'view') viewOpen.value = true;
  if (current.value) cardAction(action, current.value.id);
}
function searchNavigate(entry: Entry) {
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
}
function canDrop(values: string[], destination: DropDestination) {
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
}
function applyDrop(values: string[], destination: DropDestination) {
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
}
function chooseDrop(type: 'move' | 'swap') {
  const pending = pendingDrop.value;
  if (!pending) return;
  pendingDrop.value = null;
  applyDrop(pending.ids, {
    ...pending.destination,
    type,
    referenceId: type === 'swap' ? pending.destination.parentId : null,
  });
}
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
      @save="
        (name, description) => {
          if (current && notes.update(current.id, name, description)) noteEditing = false;
        }
      "
    />
    <template v-else
      ><div class="todo__count">
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
        @add="(position) => showForm('task', undefined, position)"
    /></template>
    <BaseDialog v-model="addOpen" title="Добавить элемент" variant="add-modal"
      ><AddEntryPicker @choose="chooseType"
    /></BaseDialog>
    <BaseDialog
      v-model="formOpen"
      :title="
        edited ? 'Изменить элемент' : formType === 'task' ? 'Добавить задачу' : 'Создать элемент'
      "
      :variant="formType === 'note' ? 'note-modal' : formType === 'task' ? 'textarea-modal' : ''"
      ><EntryForm :type="formType" :entry="edited" @save="saveForm" @cancel="formOpen = false"
    /></BaseDialog>
    <BaseDialog v-model="deleteOpen" title="Удалить элементы?"
      ><p class="modal-description">
        {{ deleting.length > 1 ? 'Выбрано элементов: ' + deleting.length + '. ' : '' }}Вложенные
        элементы тоже будут удалены.
      </p>
      <div class="actions">
        <Button danger @click="deleteConfirmed">Удалить</Button
        ><Button @click="deleteOpen = false">Отмена</Button>
      </div></BaseDialog
    >
    <BaseDialog v-model="viewOpen" title="Вид" variant="view-modal"
      ><LayoutPicker v-model="layout"
    /></BaseDialog>
    <SearchDialog v-model="searchOpen" :current-id="currentId" @navigate="searchNavigate" />
    <DropActionMenu
      v-if="pendingDrop"
      :pending="pendingDrop"
      @choose="chooseDrop"
      @cancel="cancelDrop"
    />
  </main>
</template>
<style src="./NotesWorkspace.css"></style>
