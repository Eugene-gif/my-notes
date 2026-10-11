import type { Subtask, Task, TaskStatus } from '@/types/notes';

const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];

const advanceTaskStatus = (task: Pick<Task, 'status' | 'completed'>): TaskStatus => {
	task.status = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
	task.completed = task.status === 'completed';

	return task.status;
};

const getSubtasksStatus = (subtasks: Subtask[]): TaskStatus => {
	if (!subtasks.length || subtasks.every((subtask) => subtask.status === 'pending'))
		return 'pending';
	return subtasks.every((subtask) => subtask.status === 'completed') ? 'completed' : 'in-progress';
};

const syncTaskStatus = (task: Task) => {
	if (task.subtasks?.length) task.status = getSubtasksStatus(task.subtasks);
	task.completed = task.status === 'completed';
};

const taskStatusLabel = (status: TaskStatus) =>
	({ pending: 'Без статуса', 'in-progress': 'В процессе', completed: 'Выполнено' })[status];

export { advanceTaskStatus, getSubtasksStatus, syncTaskStatus, taskStatusLabel };
