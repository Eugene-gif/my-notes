import plus from './menu/plus.svg?raw';
import search from './menu/search.svg?raw';
import grid from './menu/layout-grid.svg?raw';
import select from './menu/square-check-big.svg?raw';
import pencil from './menu/pencil.svg?raw';
import trash from './menu/trash-2.svg?raw';
import open from './menu/folder-open.svg?raw';
import move from './menu/folder-input.svg?raw';
import swap from './menu/arrow-right-left.svg?raw';
import folder from './menu/folder.svg?raw';
import note from './menu/file-text.svg?raw';
import checklist from './menu/list-todo.svg?raw';

const icons: Record<string, string> = {
  add: plus,
  search,
  view: grid,
  select,
  rename: pencil,
  edit: pencil,
  'edit-note': pencil,
  delete: trash,
  open,
  move,
  swap,
  folder,
  text: note,
  checklist,
};

export default function IconMenu(action: string) {
  const icon = icons[action];
  if (!icon) throw new Error(`Unknown menu action: ${action}`);
  return icon.replace('<svg ', '<svg class="menu__icon" aria-hidden="true" focusable="false" ');
}
