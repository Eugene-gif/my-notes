<script setup lang="ts">
	import type { MenuActionId, UserMenuActionId, ContainerType } from '@/types/notes';

	defineProps<{ name: MenuActionId | UserMenuActionId | ContainerType | 'sun' | 'moon' }>();
</script>

<template>
	<svg
		class="icon menu__icon"
		xmlns="http://www.w3.org/2000/svg"
		width="22"
		height="22"
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<template v-if="name === 'add'"><path d="M5 12h14m-7-7v14" /></template>
		<template v-else-if="name === 'search'">
			<path d="m21 21l-4.34-4.34" />
			<circle cx="11" cy="11" r="8" />
		</template>
		<template v-else-if="name === 'view'">
			<rect width="7" height="7" x="3" y="3" rx="1" />
			<rect width="7" height="7" x="14" y="3" rx="1" />
			<rect width="7" height="7" x="14" y="14" rx="1" />
			<rect width="7" height="7" x="3" y="14" rx="1" />
		</template>
		<template v-else-if="name === 'sun'">
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42m-11.3 11.3-1.42 1.42"
			/>
		</template>
		<template v-else-if="name === 'theme' || name === 'moon'">
			<path d="M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z" />
		</template>
		<template v-else-if="name === 'register'">
			<circle cx="9" cy="7" r="4" />
			<path d="M2 21v-2a7 7 0 0 1 14 0v2m4-13v6m-3-3h6" />
		</template>
		<template v-else-if="name === 'login'">
			<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M3 12h12m-4-4 4 4-4 4" />
		</template>
		<template v-else-if="name === 'install'">
			<path d="M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
		</template>
		<template v-else-if="name === 'update'">
			<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 2M4 17l2 2a8 8 0 0 0 13-2" />
		</template>
		<template v-else-if="name === 'select'">
			<path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />
			<path d="m9 11l3 3L22 4" />
		</template>
		<template v-else-if="name === 'rename' || name === 'edit' || name === 'edit-note'">
			<path
				d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4"
			/>
		</template>
		<template v-else-if="name === 'delete'">
			<path
				d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
			/>
		</template>
		<template v-else-if="name === 'open'">
			<path
				d="m6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
			/>
		</template>
		<template v-else-if="name === 'move'">
			<path
				d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1m0-4h10"
			/>
			<path d="m9 16l3-3l-3-3" />
		</template>
		<template v-else-if="name === 'swap'">
			<path d="m16 3l4 4l-4 4m4-4H4m4 14l-4-4l4-4m-4 4h16" />
		</template>
		<template v-else-if="name === 'folder'">
			<path
				d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
			/>
		</template>
		<template v-else-if="name === 'note'">
			<path
				d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
			/>
			<path d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8" />
		</template>
		<template v-else-if="name === 'checklist'">
			<path d="M13 5h8m-8 7h8m-8 7h8M3 17l2 2l4-4" />
			<rect width="6" height="6" x="3" y="4" rx="1" />
		</template>
	</svg>
</template>

<style scoped>
	.icon {
		display: block;
		flex-shrink: 0;
		pointer-events: none;
	}
</style>
