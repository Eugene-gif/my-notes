import home from './navigation/home.svg?raw';

export default function IconHome() {
  return home.replace('<svg ', '<svg class="folder__svg" aria-hidden="true" ');
}
