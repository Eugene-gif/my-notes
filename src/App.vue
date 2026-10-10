<script setup lang="ts">
	import { RouterView } from 'vue-router';
	import { provide } from 'vue';
	import { usePwa } from '@/composables/usePwa';
	import { PWA_KEY } from '@/constants/pwa';
	import AppUpdatePrompt from '@/components/AppUpdatePrompt.vue';
	import Notice from '@/components/Notice.vue';

	provide(PWA_KEY, usePwa());
</script>

<template>
	<RouterView />
	<Notice />
	<AppUpdatePrompt />
</template>
