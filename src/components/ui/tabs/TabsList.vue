<script setup lang="ts">
import type { TabsListProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { TabsList, useForwardProps } from 'reka-ui';
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props;
    return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <TabsList
        :class="cn(
            'inline-flex items-center justify-center rounded-lg bg-secondary border border-border p-1 text-tertiary font-medium text-xs min-h-[28px]',
            props.class,
        )"
        v-bind="forwardedProps"
    >
        <slot />
    </TabsList>
</template>
