import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createAppRouter, savedContainer } from './router';
import { useNotesStore } from './store/notesStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { applyTheme } from './utils/theme';
import './assets/styles/style.css';
import './assets/styles/themes.css';

const pinia = createPinia();
const workspace = useWorkspaceStore(pinia);
workspace.initialize();
applyTheme(workspace.theme);
const saved = savedContainer();
const router = createAppRouter(pinia);
const app = createApp(App).use(pinia).use(router);
document.title = import.meta.env.VITE_APP_TITLE || 'My notes';
await router.isReady();
if (
	saved &&
	location.pathname === import.meta.env.BASE_URL &&
	useNotesStore(pinia).entry(saved)?.type !== 'task' &&
	useNotesStore(pinia).entry(saved)
)
	await router.replace({ name: 'entry', params: { id: saved } });
app.mount('#app');
