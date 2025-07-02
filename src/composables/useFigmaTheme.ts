import type { InjectionKey, Ref } from 'vue';
import { useMutationObserver } from '@vueuse/core';
import { onMounted, provide, ref } from 'vue';

export const THEME_INJECTION_KEY: InjectionKey<Ref<boolean>> = Symbol('figma-theme');

export function useFigmaTheme() {
    const isDark = ref(false);

    const applyTheme = () => {
        const htmlElement = document.documentElement;
        isDark.value = htmlElement.classList.contains('figma-dark');

        if (isDark.value) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    };

    // Apply theme initially when component mounts
    onMounted(() => {
        applyTheme();
    });

    // Watch for theme changes
    useMutationObserver(
        document.documentElement,
        () => {
            applyTheme();
        },
        {
            attributes: true,
            attributeFilter: ['class'],
        },
    );

    // Provide the theme state to child components
    provide(THEME_INJECTION_KEY, isDark);

    return {
        isDark,
    };
}
