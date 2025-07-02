<script setup lang="ts">
import { computed } from 'vue';
import LogoDark from '@/assets/img/logo_dark.svg?raw';
import LogoLight from '@/assets/img/logo_light.svg?raw';
import { useDarkMode } from '@/composables/useDarkMode';

interface Props {
    class?: string;
}

defineProps<Props>();

const { isDark } = useDarkMode();

const logoSvg = computed(() => {
    return isDark.value ? LogoLight : LogoDark;
});
</script>

<template>
    <div :class="$props.class" v-html="logoSvg" />
</template>
