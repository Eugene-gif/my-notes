import type { Task, TaskStatus } from '@/types/notes';

const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];

const advanceTaskStatus = (task: Task): TaskStatus => {
	task.status = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
	task.completed = task.status === 'completed';

	return task.status;
};

const taskStatusLabel = (status: TaskStatus) =>
	({ pending: 'Без статуса', 'in-progress': 'В процессе', completed: 'Выполнено' })[status];

export { advanceTaskStatus, taskStatusLabel };
