import folder from './folders/folder.svg?raw';
import folderOpen from './folders/folder-open.svg?raw';
import folderEmpty from './folders/folder-empty.svg?raw';
import folderEmptyOpen from './folders/folder-empty-open.svg?raw';

export default function IconFolder(isOpen = false, isEmpty = false) {
  const icon = isEmpty ? (isOpen ? folderEmptyOpen : folderEmpty) : (isOpen ? folderOpen : folder);
  return icon.replace('<svg ', '<svg class="folder__svg" aria-hidden="true" ');
}
