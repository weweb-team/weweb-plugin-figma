<script setup lang="ts">
import { useFigmaTheme } from '@/composables/useFigmaTheme';
import FigmaPlugin from './FigmaPlugin.vue';

// Set up theme provider at the root level
useFigmaTheme();
</script>

<template>
    <FigmaPlugin />
</template>
