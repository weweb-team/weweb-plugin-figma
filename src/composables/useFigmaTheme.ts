import { useMutationObserver } from '@vueuse/core';
import { onMounted } from 'vue';

export function useFigmaTheme() {
    const applyTheme = () => {
        const htmlElement = document.documentElement;
        const isDarkMode = htmlElement.classList.contains('figma-dark');
        if (isDarkMode) {
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
}
