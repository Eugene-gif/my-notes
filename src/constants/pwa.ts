import type { InjectionKey } from 'vue';
import type { PwaController } from '@/types/pwa';

export const PWA_KEY: InjectionKey<PwaController> = Symbol('pwa');
