import text from './notes/text.svg?raw';

export default function IconText() {
  return text.replace('<svg ', '<svg class="folder__svg" aria-hidden="true" ');
}
