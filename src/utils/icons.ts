import type { Container, NotesState } from '@/types/notes';
import IconFolder from '@/assets/icons/IconFolder';
import IconTasks from '@/assets/icons/IconTasks';
import IconText from '@/assets/icons/IconText';
import { getChildren, getChecklistStats } from './entries';
export function containerIcon(entry: Container, state: NotesState, open = false): string {
  return entry.type === 'note'
    ? IconText()
    : entry.type === 'checklist'
      ? IconTasks(getChecklistStats(state, entry.id).status)
      : IconFolder(open, getChildren(state, entry.id).length === 0);
}
