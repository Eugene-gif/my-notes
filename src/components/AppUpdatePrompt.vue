<script setup lang="ts">
	import { inject } from 'vue';
	import { PWA_KEY } from '@/constants/pwa';
	import Button from '@/components/Button.vue';
	import BaseDialog from '@/components/BaseDialog.vue';

	const pwa = inject(PWA_KEY)!;
	const {
		needRefresh,
		dismissed,
		updating,
		error,
		updateBlocked,
		hasUnsavedChanges,
		showInstallHelp,
	} = pwa;
</script>

<template>
	<aside
		v-if="!dismissed && (needRefresh || error)"
		class="pwa-update"
		aria-label="Обновление приложения"
		aria-live="polite"
	>
		<p v-if="needRefresh">Доступна новая версия My notes.</p>
		<p v-if="updateBlocked && hasUnsavedChanges" class="pwa-update__warning">
			Сохраните изменения в открытой форме или отмените их, затем нажмите «Обновить».
		</p>
		<p v-if="error" role="alert">{{ error }}</p>
		<div class="pwa-update__actions">
			<Button v-if="needRefresh" :disabled="updating" @click="pwa.update">
				{{ updating ? 'Обновление…' : 'Обновить' }}
			</Button>
			<Button class="pwa-update__later" :disabled="updating" @click="pwa.dismiss">Позже</Button>
		</div>
	</aside>
	<BaseDialog v-model="showInstallHelp" title="Установка My notes">
		<p class="modal-description">
			На iPhone и iPad откройте меню «Поделиться», затем выберите «На экран Домой».
		</p>
		<p class="modal-description">
			На Android и компьютере найдите в меню браузера пункт «Установить приложение», «Добавить на
			главный экран» или «Добавить в Dock». Доступность зависит от браузера.
		</p>
		<Button @click="showInstallHelp = false">Понятно</Button>
	</BaseDialog>
</template>

<style scoped>
	.pwa-update__later {
		background: var(--color-gray-light);
		border-color: var(--color-gray-border-light);
		color: var(--color-gray-dark);
	}
	.pwa-update {
		position: fixed;
		bottom: max(16px, env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
		width: min(460px, calc(100% - 32px));
		max-height: calc(100dvh - 32px);
		overflow: auto;
		padding: 16px;
		border: 1px solid var(--color-blue-border);
		border-radius: 12px;
		background: var(--color-white);
		color: var(--color-gray-dark);
		box-shadow: 0 6px 18px var(--color-shadow-medium);
		text-align: left;
		font-size: 14px;
	}
	.pwa-update__warning {
		margin-top: 8px;
		color: var(--color-gray);
	}
	.pwa-update__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}
</style>
