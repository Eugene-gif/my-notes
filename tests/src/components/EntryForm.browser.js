// Run with Playwright CLI run-code against the dev server at http://127.0.0.1:4174.
export default async (originalPage) => {
	const context = await originalPage
		.context()
		.browser()
		.newContext({
			viewport: { width: 1024, height: 768 },
			hasTouch: true,
		});
	const page = await context.newPage();
	const errors = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	const assert = (condition, message) => {
		if (!condition) throw new Error(message);
	};
	const read = () =>
		page.evaluate(() => JSON.parse(localStorage.getItem('notes-app__state')).state);
	const edit = async () => {
		await page.locator('[data-id="task"] .folder__options').click();
		await page.getByRole('menuitem', { name: 'Изменить', exact: true }).click();
		await page.locator('dialog[open]').evaluate(async (dialog) => {
			await Promise.all(
				dialog
					.getAnimations({ subtree: true })
					.map((animation) => animation.finished.catch(() => {})),
			);
		});
	};
	const save = async () => {
		await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
		await page.waitForFunction(() => !document.querySelector('dialog[open]'));
		await page.locator('.notice-host').waitFor();
		await page.locator('.notice__close').click();
		await page.locator('.notice-host').waitFor({ state: 'detached' });
	};
	try {
		await page.goto('http://127.0.0.1:4174/');
		await page.evaluate(() => {
			localStorage.setItem(
				'notes-app__state',
				JSON.stringify({
					version: 1,
					state: {
						folders: [],
						notes: [],
						checklists: [
							{ id: 'list', type: 'checklist', name: 'Перечень', parentId: null, order: 0 },
						],
						tasks: [
							{
								id: 'task',
								type: 'task',
								value: 'Первая строка\nВторая строка',
								status: 'pending',
								completed: false,
								parentId: 'list',
								order: 0,
							},
						],
					},
				}),
			);
		});
		await page.reload();
		await page.locator('[data-id="list"] .folder__open').click();
		await page.waitForFunction(
			() => !document.querySelector('.section-enter-active,.section-leave-active'),
		);
		await edit();
		for (const value of ['Купить хлеб', 'Купить молоко']) {
			await page.getByRole('button', { name: 'Добавить подзадачу', exact: true }).click();
			await page.locator('.subtask-editor__field input').last().fill(value);
		}
		await save();
		for (const viewport of [
			{ width: 640, height: 360 },
			{ width: 320, height: 480 },
			{ width: 1024, height: 768 },
		]) {
			await page.setViewportSize(viewport);
			await edit();
			const dialog = page.locator('dialog[open]');
			const editorHeight = await dialog
				.locator('.subtask-editor')
				.evaluate((element) => element.getBoundingClientRect().height);
			assert(
				editorHeight > 40,
				'Subtask editor collapsed at ' +
					viewport.width +
					'×' +
					viewport.height +
					': ' +
					editorHeight +
					'px',
			);
			const bounds = await dialog.boundingBox();
			assert(
				bounds.y >= 0 && bounds.y + bounds.height <= viewport.height,
				'Dialog exceeds viewport',
			);
			const saveBounds = await page
				.getByRole('button', { name: 'Сохранить', exact: true })
				.boundingBox();
			assert(
				saveBounds.y >= bounds.y && saveBounds.y + saveBounds.height <= bounds.y + bounds.height,
				'Save button clipped',
			);
			const inputs = dialog.locator('.subtask-editor__field input');
			for (let index = 0; index < 2; index++) {
				await inputs.nth(index).scrollIntoViewIfNeeded();
				await inputs.nth(index).tap();
				await inputs.nth(index).fill(index ? 'Купить молоко' : 'Купить хлеб');
			}
			await dialog.locator('.subtask-editor__add').scrollIntoViewIfNeeded();
			await dialog.locator('.subtask-editor__add').tap();
			await inputs.last().fill('Временная подзадача');
			await dialog.getByRole('button', { name: 'Удалить подзадачу 3', exact: true }).tap();
			assert((await inputs.count()) === 2, 'Cannot remove a subtask');
			await inputs.first().fill('Купить хлеб!');
			await save();
			const task = (await read()).tasks[0];
			assert(task.value === 'Первая строка\nВторая строка', 'Multiline text lost');
			assert(
				task.subtasks[0].value === 'Купить хлеб!' && task.subtasks[1].value === 'Купить молоко',
				'Subtask edits lost',
			);
		}
		await page.reload();
		const task = (await read()).tasks[0];
		assert(
			task.subtasks.length === 2 && task.subtasks[0].value === 'Купить хлеб!',
			'Subtasks lost after reload',
		);
		assert(errors.length === 0, errors.join('\n'));
		return 'PASS: multiline task with subtasks at 640×360, 320×480 and 1024×768; touch/edit/add/delete/save/reload';
	} finally {
		await context.close();
	}
};
