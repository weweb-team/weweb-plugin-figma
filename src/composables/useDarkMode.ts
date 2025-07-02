import { inject } from 'vue';
import { THEME_INJECTION_KEY } from './useFigmaTheme';

export function useDarkMode() {
    const isDark = inject(THEME_INJECTION_KEY);

    if (!isDark) {
        throw new Error('useDarkMode must be used within a component that has called useFigmaTheme');
    }

    return {
        isDark,
    };
}
