import open from './checklists/task-list-open.svg?raw';
import progress from './checklists/task-list-progress.svg?raw';
import done from './checklists/task-list-done.svg?raw';

const icons = { empty: open, partial: progress, complete: done };

export default function IconTasks(status = 'empty') {
  return (icons[status] ?? open).replace('<svg ', '<svg class="folder__svg" aria-hidden="true" focusable="false" ');
}
