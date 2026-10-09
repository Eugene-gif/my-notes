import type { Task, TaskStatus } from '@/types/notes';
const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];
export function getTaskStatus(task: Pick<Task, 'status' | 'completed'>): TaskStatus {
  return task.status && statuses.includes(task.status)
    ? task.status
    : task.completed
      ? 'completed'
      : 'pending';
}
export function advanceTaskStatus(task: Task): TaskStatus {
  task.status = statuses[(statuses.indexOf(getTaskStatus(task)) + 1) % statuses.length];
  task.completed = task.status === 'completed';
  return task.status;
}
export const taskStatusLabel = (status: TaskStatus) =>
  ({ pending: 'Без статуса', 'in-progress': 'В процессе', completed: 'Выполнено' })[status];
