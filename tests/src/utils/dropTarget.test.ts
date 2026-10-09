import { expect, it, vi } from 'vitest';
import { findDropTarget, insertionTarget, clampMenuPoint } from '@/utils/dropTarget';
import { getEntry } from '@/utils/entries';
import { fixture } from '../../fixtures';
it('clamps menus and chooses insertion edges for both layouts', () => {
  expect(
    clampMenuPoint({ x: 999, y: -20 }, { width: 240, height: 100 }, { width: 400, height: 300 }),
  ).toEqual({ x: 148, y: 12 });
  const list = document.createElement('ul'),
    card = document.createElement('li');
  list.className = 'todo__list';
  list.style.setProperty('--columns', '1');
  list.append(card);
  document.body.append(list);
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 200,
    bottom: 80,
    width: 200,
    height: 80,
  } as DOMRect);
  expect(insertionTarget(card, fixture().tasks[0], 100, 60).position).toBe('after');
  list.style.setProperty('--columns', '2');
  expect(insertionTarget(card, fixture().tasks[0], 20, 60)).toMatchObject({
    horizontal: true,
    position: 'before',
  });
});
it('distinguishes swap, insertion, container drop and invalid destinations', () => {
  const state = fixture(),
    root = document.createElement('div'),
    card = document.createElement('li');
  card.className = 'todo__item';
  card.dataset.id = 'task2';
  root.append(card);
  document.body.append(root);
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 200,
    bottom: 80,
    width: 200,
    height: 80,
  } as DOMRect);
  vi.spyOn(document, 'elementFromPoint').mockReturnValue(card);
  const options = {
    root,
    ids: ['task'],
    dragged: state.tasks[0],
    x: 100,
    y: 40,
    getEntry: (id: string | null) => getEntry(state, id),
    canDrop: () => true,
  };
  expect(findDropTarget(options)?.type).toBe('swap');
  expect(findDropTarget({ ...options, y: 5 })?.type).toBe('order');
  expect(findDropTarget({ ...options, ids: ['task2'] })).toBeNull();
  card.dataset.id = 'folder';
  expect(findDropTarget(options)?.type).toBe('folder');
  expect(findDropTarget({ ...options, canDrop: () => false })?.type).toBe('navigate');
  vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
  expect(findDropTarget(options)).toBeNull();
});
