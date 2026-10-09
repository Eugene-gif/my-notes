import progress from './tasks/task-progress-check.svg?raw';

const completed = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>';

export default function IconTaskStatus(status) {
  if (status === 'completed') return completed;
  if (status === 'in-progress') return progress.replace('width="1em" height="1em"', 'width="32" height="32" aria-hidden="true" focusable="false"');
  return '';
}
