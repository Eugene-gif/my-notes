import type { InjectionKey } from 'vue';
import type { PwaController } from '@/types/pwa';

export const PWA_KEY: InjectionKey<PwaController> = Symbol('pwa');

// Workbox проверяет pathname + search; query не должен влиять на исключение маршрута.
export const PWA_NAVIGATION_DENYLIST = [/^[^?]*\/api\//, /^[^?]*\.[^/?]+(?:\?.*)?$/];
