export type ParentId = string | null;
export type ContainerType = 'folder' | 'checklist' | 'note';
export type ChecklistStatus = 'empty' | 'partial' | 'complete';
export type MenuActionId =
	| 'add'
	| 'search'
	| 'view'
	| 'select'
	| 'rename'
	| 'edit'
	| 'edit-note'
	| 'delete'
	| 'open'
	| 'move'
	| 'swap';

export type UserMenuActionId = 'theme' | 'register' | 'login' | 'install' | 'update';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type Layout = '1' | '2' | '3';
export type Theme = 'light' | 'dark';

export interface BaseEntry {
	id: string;
	parentId: ParentId;
	order: number;
}

export interface Subtask {
	id: string;
	value: string;
	completed: boolean;
	status: TaskStatus;
}

export interface Task extends BaseEntry {
	type: 'task';
	value: string;
	completed: boolean;
	status: TaskStatus;
	subtasks?: Subtask[];
}

export interface Folder extends BaseEntry {
	type: 'folder';
	name: string;
}

export interface Checklist extends BaseEntry {
	type: 'checklist';
	name: string;
}

export interface Note extends BaseEntry {
	type: 'note';
	name: string;
	description: string;
}

export type Container = Folder | Checklist | Note;
export type Entry = Task | Container;

export interface EntryClipboard {
	rootIds: string[];
	entries: Entry[];
}

export interface NotesState {
	tasks: Task[];
	folders: Folder[];
	checklists: Checklist[];
	notes: Note[];
}

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem?(key: string): void;
}

export interface MenuAction {
	id: MenuActionId | UserMenuActionId;
	icon?: 'sun' | 'moon';
	label: string;
	danger?: boolean;
	disabled?: boolean;
}

export interface DropDestination {
	element: HTMLElement;
	type: 'order' | 'swap' | 'folder' | 'navigate' | 'move';
	parentId: ParentId;
	referenceId?: string | null;
	position?: 'before' | 'after';
	horizontal?: boolean;
	dropPoint?: { x: number; y: number };
}

export interface PendingDrop {
	ids: string[];
	destination: DropDestination;
}
