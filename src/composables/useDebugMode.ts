import { ref } from 'vue';

// Global debug mode state
const debugMode = ref(false);

export function useDebugMode() {
    const toggleDebugMode = () => {
        debugMode.value = !debugMode.value;
    };

    const setDebugMode = (value: boolean) => {
        debugMode.value = value;
    };

    return {
        debugMode,
        toggleDebugMode,
        setDebugMode,
    };
}
