import { flushPromises } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { mountWorkspace } from '../../workspace';
import { useClipboardStore } from '@/store/clipboardStore';
import { getChildren } from '@/utils/entries';
import { useNoticesStore } from '@/store/noticesStore';

const menuAction = async (
	wrapper: Awaited<ReturnType<typeof mountWorkspace>>['wrapper'],
	label: string,
) => {
	await wrapper.find('.todo__menu-trigger').trigger('click');
	const action = wrapper.findAll('[role="menuitem"]').find((item) => item.text() === label)!;
	await action.trigger('click');
	await flushPromises();
};

it('switches the theme and keeps other user actions as placeholders', async () => {
	const { wrapper, notes, router } = await mountWorkspace();
	const original = JSON.stringify(notes.state);
	const path = router.currentRoute.value.fullPath;
	for (const label of ['Сменить тему', 'Регистрация', 'Войти']) {
		await wrapper.find('.todo__user-trigger').trigger('click');
		await flushPromises();
		const menu = wrapper.find('.todo__user-options [role="menu"]');
		expect(menu.classes()).toContain('is-aligned-left');
		expect(menu.findAll('[role="menuitem"]').map((item) => item.text())).toEqual([
			'Сменить тему',
			'Регистрация',
			'Войти',
		]);
		await menu
			.findAll('[role="menuitem"]')
			.find((item) => item.text() === label)!
			.trigger('click');
		await flushPromises();
		expect(JSON.stringify(notes.state)).toBe(original);
		expect(router.currentRoute.value.fullPath).toBe(path);
		expect(wrapper.find('.todo__user-trigger').attributes('aria-expanded')).toBe('false');
		expect(document.documentElement.dataset.theme).toBe('dark');
	}
	await wrapper.find('.todo__user-trigger').trigger('click');
	await flushPromises();
	await wrapper.get('[role="menuitem"]').trigger('click');
	expect(document.documentElement.dataset.theme).toBe('light');
});

it('creates a folder through the UI and confirms deletion without losing siblings', async () => {
	const { wrapper, notes } = await mountWorkspace();
	expect(wrapper.find('h1').text()).toBe('Мои заметки');
	await menuAction(wrapper, 'Добавить');
	await wrapper.findAll('.todo__add-option')[0].trigger('click');
	await flushPromises();
	const form = wrapper.find('form');
	await form.find('input').setValue('Новая папка');
	await form.trigger('submit');
	await flushPromises();
	const folder = notes.state.folders.find((entry) => entry.name === 'Новая папка')!;
	expect(folder).toBeDefined();
	const card = wrapper.findAll('.folder').find((item) => item.attributes('data-id') === folder.id)!;
	await card.find('.folder__options').trigger('click');
	await card
		.findAll('[role="menuitem"]')
		.find((item) => item.text().startsWith('Удалить'))!
		.trigger('click');
	expect(notes.entry(folder.id)).toBeDefined();
	await wrapper
		.findAll('dialog[open] .actions button')
		.find((item) => item.text() === 'Удалить')!
		.trigger('click');
	expect(notes.entry(folder.id)).toBeUndefined();
	expect(notes.entry('note')).toBeDefined();
});
it('requires a drop choice before moving a note into a folder', async () => {
	const { wrapper, notes } = await mountWorkspace();
	const root = wrapper.find('main').element;
	const folder = wrapper.find('[data-id="folder"]').element;
	const note = wrapper.find('[data-id="note"]').element;
	vi.spyOn(folder, 'getBoundingClientRect').mockReturnValue({
		left: 0,
		top: 0,
		right: 200,
		bottom: 80,
		width: 200,
		height: 80,
	} as DOMRect);
	vi.spyOn(document, 'elementFromPoint').mockReturnValue(folder);
	note.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	root.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 100, clientY: 40 }));
	root.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 40 }));
	await flushPromises();
	expect(notes.entry('note')?.parentId).toBeNull();
	const menu = document.querySelector('[aria-label="Действие после переноса"]')!;
	(menu.querySelector('button') as HTMLButtonElement).click();
	await flushPromises();
	expect(notes.entry('note')?.parentId).toBe('folder');
	expect(document.querySelector('[aria-label="Действие после переноса"]')).toBeNull();
});
it('cycles tasks, selects groups and adds top/bottom tasks', async () => {
	const { wrapper, notes } = await mountWorkspace('/entry/list');
	await wrapper.find('.task__toggle').trigger('click');
	expect(notes.state.tasks[0].status).toBe('in-progress');
	await wrapper.find('.todo__add-task').trigger('click');
	await wrapper.find('input').setValue('В начало');
	await wrapper.find('form').trigger('submit');
	await flushPromises();
	expect(wrapper.findAll('.task__text')[0].text()).toBe('В начало');
	await menuAction(wrapper, 'Выбрать');
	await wrapper.findAll('.task__toggle')[0].trigger('click');
	expect(wrapper.find('.todo__selection-count').text()).toBe('Выбрано: 1');
	await wrapper.findAll('.todo__batch-actions button')[0].trigger('click');
	expect(wrapper.find('.todo__selection-count').text()).toBe('Выбрано: 3');
	await wrapper.find('.todo__cancel').trigger('click');
	expect(wrapper.find('.todo__batch-actions').exists()).toBe(false);
});
it('keeps cancelled note drafts and saves only explicit edits', async () => {
	const { wrapper, notes } = await mountWorkspace('/entry/note');
	const original = notes.state.notes[0].description;
	await wrapper.find('.btn-note-edit').trigger('click');
	await wrapper.find('textarea').setValue('Черновик');
	await wrapper.find('.btn-note-cancel').trigger('click');
	expect(notes.state.notes[0].description).toBe(original);
	expect(wrapper.find('.note-reader__description').text()).toBe(original);
	await wrapper.find('.btn-note-edit').trigger('click');
	await wrapper.find('textarea').setValue('Сохранить');
	await wrapper.find('form').trigger('submit');
	expect(notes.state.notes[0].description).toBe('Сохранить');
	expect(wrapper.find('.note-reader').exists()).toBe(true);
});
it('uses router navigation and returns to the parent after deleting a section', async () => {
	const { wrapper, router, notes } = await mountWorkspace('/entry/other');
	await menuAction(wrapper, 'Удалить перечень');
	await wrapper
		.findAll('dialog[open] button')
		.find((item) => item.text() === 'Удалить')!
		.trigger('click');
	await flushPromises();
	expect(router.currentRoute.value.params.id).toBe('folder');
	expect(notes.entry('other')).toBeUndefined();
	expect(notes.entry('task3')).toBeUndefined();
	await wrapper.find('.todo__back').trigger('click');
	await flushPromises();
	expect(router.currentRoute.value.name).toBe('home');
});

it('opens the element picker from an empty folder and uses the edit label in its menu', async () => {
	const { wrapper } = await mountWorkspace('/entry/nested');
	expect(wrapper.get('.todo__list-empty').text()).toBe('Папка пуста');
	await wrapper.get('.todo__empty-folder .button').trigger('click');
	await flushPromises();
	expect(wrapper.get('dialog[open] h2').text()).toBe('Добавить элемент');
	await wrapper.get('dialog[open] .btn-modal-close').trigger('click');
	await menuAction(wrapper, 'Изменить');
	expect(wrapper.get<HTMLInputElement>('form input').element.value).toBe('Проект');
});

it('navigates into note editing without resetting the requested edit mode', async () => {
	const { wrapper, router, notes } = await mountWorkspace();
	const card = wrapper.get('[data-id="note"]');
	await card.get('.folder__options').trigger('click');
	await card
		.findAll('[role="menuitem"]')
		.find((item) => item.text() === 'Изменить')!
		.trigger('click');
	await flushPromises();
	expect(router.currentRoute.value.params.id).toBe('note');
	expect(wrapper.get('form label[for="entry-name"]').text()).toBe('Заголовок');
	expect(wrapper.get('form textarea').attributes('placeholder')).toBe('Введите текст');
	await wrapper.get('form input').setValue('Новый заголовок');
	await wrapper.get('form').trigger('submit');
	expect(notes.entry('note')).toMatchObject({ name: 'Новый заголовок' });
});

it('copies selected trees, permits navigation and pastes into an empty folder once', async () => {
	const { wrapper, router, notes } = await mountWorkspace();
	const original = JSON.stringify(notes.state);
	await menuAction(wrapper, 'Выбрать');
	await wrapper.get('[data-id="folder"] .folder__open').trigger('click');
	await wrapper.get('[data-id="note"] .folder__open').trigger('click');
	const buttons = wrapper.findAll('.todo__batch-actions button');
	expect(buttons.map((button) => button.text())).toEqual([
		'Выбрать все',
		'Удалить выбранные',
		'Скопировать',
		'Отмена',
	]);
	await buttons[2].trigger('click');
	expect(JSON.stringify(notes.state)).toBe(original);
	expect(wrapper.findAll('.todo__batch-actions button').map((button) => button.text())).toEqual([
		'Вставить',
		'Отмена',
	]);
	expect(wrapper.get('.todo__selection-count').text()).toBe('Скопировано: 2');
	expect(wrapper.get('.folder__open').attributes('aria-label')).toContain('Открыть');
	await wrapper.get('[data-id="folder"] .folder__open').trigger('click');
	await flushPromises();
	expect(router.currentRoute.value.params.id).toBe('folder');
	await wrapper.get('[data-id="nested"] .folder__open').trigger('click');
	await flushPromises();
	expect(wrapper.get('.todo__list-empty').text()).toBe('Папка пуста');
	await wrapper.get('.todo__batch-actions button').trigger('click');
	await flushPromises();
	expect(wrapper.find('.todo__batch-actions').exists()).toBe(false);
	const pasted = getChildren(notes.state, 'nested');
	expect(pasted).toMatchObject([
		{ type: 'folder', name: 'Работа' },
		{ type: 'note', description: notes.state.notes[0].description },
	]);
	expect(pasted.map((entry) => entry.id)).not.toContain('folder');
	expect(getChildren(notes.state, pasted[0].id)).toHaveLength(2);
	expect(notes.entry('folder')).toMatchObject({ parentId: null });
});

it('allows cancelling pending paste from notes or Escape without changing any data', async () => {
	const { wrapper, notes, router, pinia } = await mountWorkspace();
	const clipboard = useClipboardStore(pinia);
	const original = JSON.stringify(notes.state);
	clipboard.copy(['folder']);
	await router.push('/entry/note');
	await flushPromises();
	expect(wrapper.get('.todo__batch-actions button').attributes('aria-disabled')).toBe('true');
	await wrapper.get('.todo__cancel').trigger('click');
	expect(clipboard.buffer).toBeNull();
	clipboard.copy(['note']);
	await router.push('/entry/folder');
	await flushPromises();
	await wrapper.get('.todo__menu-trigger').trigger('click');
	document.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
	);
	await flushPromises();
	expect(clipboard.count).toBe(1);
	document.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
	);
	await flushPromises();
	expect(clipboard.buffer).toBeNull();
	expect(JSON.stringify(notes.state)).toBe(original);
});

it('keeps paste visible but disabled for incompatible destinations and enables it for tasks in another checklist', async () => {
	const { wrapper, notes, router, pinia } = await mountWorkspace('/entry/list');
	await menuAction(wrapper, 'Выбрать');
	await wrapper.get('.task__toggle').trigger('click');
	await wrapper.findAll('.todo__batch-actions button')[2].trigger('click');
	await router.push('/entry/folder');
	await flushPromises();
	expect(wrapper.get('.todo__batch-actions button').attributes('aria-disabled')).toBe('true');
	await wrapper.get('[data-id="other"] .folder__open').trigger('click');
	await flushPromises();
	expect(wrapper.get('.todo__batch-actions button').attributes('aria-disabled')).toBe('false');
	await wrapper.get('.todo__batch-actions button').trigger('click');
	expect(getChildren(notes.state, 'other')).toMatchObject([
		{ id: 'task3' },
		{ value: 'Купить молоко', status: 'pending' },
	]);
	expect(useClipboardStore(pinia).buffer).toBeNull();
});

it.each(['/', '/entry/folder', '/entry/note'])(
	'warns about task paste in %s without clearing the clipboard or changing data',
	async (destination) => {
		const { wrapper, notes, router, pinia } = await mountWorkspace('/entry/list');
		const clipboard = useClipboardStore(pinia);
		const original = JSON.stringify(notes.state);
		clipboard.copy(['task']);
		await router.push(destination);
		await flushPromises();
		const paste = wrapper.get('.todo__batch-actions button');
		expect(paste.attributes('aria-disabled')).toBe('true');
		await paste.trigger('click');
		expect(useNoticesStore(pinia).current).toMatchObject({
			status: 'warning',
			message: 'Задачи можно вставить только в перечень.',
		});
		expect(clipboard.count).toBe(1);
		expect(JSON.stringify(notes.state)).toBe(original);
		await router.push('/entry/other');
		await flushPromises();
		await wrapper.get('.todo__batch-actions button').trigger('click');
		expect(clipboard.buffer).toBeNull();
		expect(getChildren(notes.state, 'other')).toHaveLength(2);
	},
);

it('warns about container paste into a checklist without confusing its nested tasks with copied roots', async () => {
	const { wrapper, notes, router, pinia } = await mountWorkspace();
	const clipboard = useClipboardStore(pinia);
	const original = JSON.stringify(notes.state);
	clipboard.copy(['folder']);
	await router.push('/entry/list');
	await flushPromises();
	await wrapper.get('.todo__batch-actions button').trigger('click');
	expect(useNoticesStore(pinia).current?.message).toBe(
		'Папки, заметки и перечни можно вставить только в папку или на главную.',
	);
	expect(JSON.stringify(notes.state)).toBe(original);
	expect(clipboard.count).toBe(1);
});
