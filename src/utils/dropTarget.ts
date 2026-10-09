import type { DropDestination, Entry, ParentId } from '@/types/notes';
interface TargetOptions {
  root: HTMLElement;
  ids: string[];
  dragged: Entry;
  x: number;
  y: number;
  getEntry: (id: ParentId) => Entry | undefined;
  canDrop: (ids: string[], destination: DropDestination) => boolean;
}
export function insertionTarget(
  card: HTMLElement,
  entry: Entry,
  x: number,
  y: number,
): DropDestination {
  const box = card.getBoundingClientRect();
  const columns =
    Number(getComputedStyle(card.closest('.todo__list') ?? card).getPropertyValue('--columns')) ||
    1;
  const horizontal = columns > 1;
  return {
    element: card,
    type: 'order',
    parentId: entry.parentId,
    referenceId: entry.id,
    horizontal,
    position: (horizontal ? x < box.left + box.width / 2 : y < box.top + box.height / 2)
      ? 'before'
      : 'after',
  };
}
export function findDropTarget({
  root,
  ids,
  dragged,
  x,
  y,
  getEntry,
  canDrop,
}: TargetOptions): DropDestination | null {
  const hit = document.elementFromPoint(x, y);
  if (!hit || !root.contains(hit)) return null;
  const card = hit.closest<HTMLElement>('.todo__item');
  let destination: DropDestination | null = null;
  if (card) {
    const entry = getEntry(card.dataset.id ?? null);
    if (!entry || ids.includes(entry.id)) return null;
    const insertion = insertionTarget(card, entry, x, y);
    const box = card.getBoundingClientRect();
    const offset = insertion.horizontal ? (x - box.left) / box.width : (y - box.top) / box.height;
    const edge = Math.min(20, (insertion.horizontal ? box.width : box.height) / 4);
    const inside = insertion.horizontal
      ? x > box.left + edge && x < box.right - edge
      : y > box.top + edge && y < box.bottom - edge;
    destination =
      ids.length === 1 &&
      dragged.type === 'task' &&
      entry.type === 'task' &&
      offset > 0.25 &&
      offset < 0.75
        ? { ...insertion, type: 'swap' }
        : entry.type !== 'task' && inside
          ? { ...insertion, type: 'folder', parentId: entry.id }
          : insertion;
  } else {
    const list = hit.closest<HTMLElement>('.todo__list');
    if (list) {
      const candidates = [...list.querySelectorAll<HTMLElement>(':scope > [data-id]')].filter(
        (item) => !ids.includes(item.dataset.id!),
      );
      const nearest = candidates
        .map((item) => {
          const box = item.getBoundingClientRect();
          return {
            item,
            distance: Math.hypot(
              Math.max(box.left - x, 0, x - box.right),
              Math.max(box.top - y, 0, y - box.bottom),
            ),
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];
      const entry = nearest ? getEntry(nearest.item.dataset.id ?? null) : undefined;
      destination =
        nearest && nearest.distance <= 24 && entry
          ? insertionTarget(nearest.item, entry, x, y)
          : {
              element: list,
              type: 'order',
              parentId: list.dataset.dropFolder || null,
              referenceId: null,
              position: 'after',
            };
    } else {
      const element = hit.closest<HTMLElement>('[data-drop-folder]');
      if (element)
        destination = { element, type: 'folder', parentId: element.dataset.dropFolder || null };
    }
  }
  if (!destination) return null;
  if (canDrop(ids, destination)) return destination;
  if (
    dragged.type === 'task' &&
    destination.type === 'folder' &&
    (getEntry(destination.parentId)?.type === 'folder' ||
      destination.element.matches('.todo__path-button'))
  )
    return { ...destination, type: 'navigate' };
  return null;
}
export function clampMenuPoint(
  point: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  return {
    x: Math.max(12, Math.min(point.x, viewport.width - size.width - 12)),
    y: Math.max(12, Math.min(point.y, viewport.height - size.height - 12)),
  };
}
