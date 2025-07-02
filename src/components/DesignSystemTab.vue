<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';

const extractingVariables = ref(false);
const variablesCopied = ref(false);

useEventListener(window, 'message', (event) => {
    const message = event.data.pluginMessage;

    if (message.type === 'VARIABLES_EXTRACTED') {
        extractingVariables.value = false;

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

            <Button
                :disabled="extractingVariables"
                variant="binding"
                class="w-full"
                @click="extractVariables"
            >
                <span v-if="extractingVariables">Extracting Variables...</span>
                <span v-else>Extract All Variables</span>
            </Button>

            <div v-if="variablesCopied" class="text-success text-sm mt-2">
                ✓ Variables copied to clipboard!
            </div>
        </div>

        <div class="mt-6 p-4 bg-muted rounded-lg">
            <h3 class="text-sm font-medium mb-2">
                What this does:
            </h3>
            <ul class="text-xs text-muted-foreground space-y-1">
                <li>• Extracts all color, text, and effect styles</li>
                <li>• Captures variable collections and modes</li>
                <li>• Converts values to WeWeb-compatible format</li>
                <li>• Copies JSON to your clipboard</li>
            </ul>
        </div>
    </div>
</template>
