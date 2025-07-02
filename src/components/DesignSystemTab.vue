<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { useDebugMode } from '@/composables/useDebugMode';
import { copyToClipboard } from '@/lib/clipboard';

const extractingVariables = ref(false);
const variablesCopied = ref(false);
const progressLogs = ref<string[]>([]);
const showProgress = ref(false);

const { debugMode } = useDebugMode();

useEventListener(window, 'message', (event) => {
    const message = event.data.pluginMessage;

    if (message.type === 'EXTRACTION_PROGRESS') {
        progressLogs.value.push(message.message);
        // Keep only the last 100 messages to prevent memory issues
        if (progressLogs.value.length > 100) {
            progressLogs.value = progressLogs.value.slice(-100);
        }
        // Auto-scroll to bottom of progress area
        requestAnimationFrame(() => {
            const progressArea = document.querySelector('.progress-logs');
            if (progressArea) {
                progressArea.scrollTop = progressArea.scrollHeight;
            }
        });
    }

    if (message.type === 'VARIABLES_EXTRACTED') {
        extractingVariables.value = false;
        showProgress.value = false;

        if (message.error) {
            alert(`Error extracting variables: ${message.error}`);
            return;
        }

        if (message.variables) {
            const variablesString = JSON.stringify(message.variables, null, 2);
            handleCopyToClipboard(variablesString);
        } else {
            alert('No variables found in this Figma file');
        }
    }
});

async function handleCopyToClipboard(text: string) {
    await copyToClipboard(text);
    variablesCopied.value = true;
    setTimeout(() => {
        variablesCopied.value = false;
    }, 2000);
}

function extractVariables() {
    extractingVariables.value = true;
    showProgress.value = true;
    progressLogs.value = []; // Clear previous logs
    parent.postMessage({
        pluginMessage: { type: 'EXTRACT_VARIABLES' },
    }, '*');
}
</script>

<template>
    <div class="space-y-4">
        <div class="text-center">
            <p class="text-sm text-muted-foreground mb-4">
                Extract all design tokens and variables from your Figma file
            </p>

            <div v-if="extractingVariables" class="text-xs text-muted-foreground mb-3 animate-pulse">
                ⏱️ This may take some time depending on your project size...
            </div>

            <Button
                :disabled="extractingVariables"
                variant="binding"
                class="w-full"
                @click="extractVariables"
            >
                <span v-if="extractingVariables" class="flex items-center justify-center gap-2">
                    <span class="icon-[lucide--loader-2] size-4 animate-spin" />
                    Extracting Variables...
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                    <span class="icon-[ph--magic-wand-bold] size-4" />
                    Extract All Variables
                </span>
            </Button>

            <div v-if="variablesCopied" class="flex items-center justify-center gap-1.5 text-success text-sm mt-2">
                <span class="icon-[lucide--check-circle] size-4" />
                Variables copied to clipboard!
            </div>
        </div>

        <!-- Progress logs -->
        <div v-if="showProgress && debugMode" class="mt-4 p-3 bg-secondary/30 rounded-lg">
            <h4 class="text-xs font-medium mb-2 text-muted-foreground">
                Extraction Progress:
            </h4>
            <div class="progress-logs max-h-40 overflow-y-auto text-xs space-y-1 font-mono">
                <div
                    v-for="(log, index) in progressLogs"
                    :key="index"
                    :class="{
                        'text-muted-foreground': !log.includes('⚠️') && !log.includes('✅'),
                        'text-warning': log.includes('⚠️'),
                        'text-success': log.includes('✅'),
                    }"
                >
                    {{ log }}
                </div>
            </div>
        </div>

        <div class="mt-6 p-4 bg-muted rounded-lg">
            <h3 class="text-sm font-medium mb-2">
                What this does:
            </h3>
            <ul class="text-xs text-muted-foreground space-y-1.5">
                <li class="flex items-start gap-2">
                    <span class="icon-[lucide--palette] size-3 mt-0.5 flex-shrink-0" />
                    <span>Extracts all color, text, and effect styles</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="icon-[lucide--layers] size-3 mt-0.5 flex-shrink-0" />
                    <span>Captures variable collections and modes</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="icon-[lucide--refresh-cw] size-3 mt-0.5 flex-shrink-0" />
                    <span>Converts values to WeWeb-compatible format</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="icon-[lucide--clipboard-check] size-3 mt-0.5 flex-shrink-0" />
                    <span>Copies JSON to your clipboard</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.progress-logs {
    scrollbar-width: thin;
    scrollbar-color: var(--muted-foreground) transparent;
}

.progress-logs::-webkit-scrollbar {
    width: 6px;
}

.progress-logs::-webkit-scrollbar-track {
    background: transparent;
}

.progress-logs::-webkit-scrollbar-thumb {
    background-color: var(--muted-foreground);
    border-radius: 3px;
}

.progress-logs::-webkit-scrollbar-thumb:hover {
    background-color: var(--foreground);
}
</style>
