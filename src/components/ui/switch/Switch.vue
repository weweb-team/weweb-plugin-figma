<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
    SwitchRoot,

    SwitchThumb,
    useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>();

const emits = defineEmits<SwitchRootEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <SwitchRoot
        v-bind="forwarded"
        :class="cn(
            'relative inline-flex h-[18px] w-[32px] items-center rounded-full border border-border bg-secondary transition-all duration-300 cursor-pointer',
            'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            'data-[state=checked]:hover:opacity-90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            props.class,
        )"
    >
        <SwitchThumb
            :class="cn(
                'pointer-events-none absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-muted-foreground transition-all duration-300',
                'data-[state=checked]:translate-x-[14px] data-[state=checked]:bg-primary-foreground',
            )"
        >
            <slot name="thumb" />
        </SwitchThumb>
    </SwitchRoot>
</template>
