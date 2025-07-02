<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import WeWebLogo from '@/components/WeWebLogo.vue';
import { copyToClipboard } from '@/lib/clipboard';

const selectedNode = ref<any>(null);
const hasSelection = ref(false);
const copied = ref(false);
const extractingVariables = ref(false);
const variablesCopied = ref(false);

// Helper function to handle clipboard copy with status updates
async function handleCopyToClipboard(text: string, isVariables: boolean = false) {
    await copyToClipboard(text);
    if (isVariables) {
        variablesCopied.value = true;
        setTimeout(() => {
            variablesCopied.value = false;
        }, 2000);
    } else {
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    }
}

useEventListener(window, 'message', (event) => {
    const message = event.data.pluginMessage;

    if (message.type === 'SELECTION_CHANGED') {
        hasSelection.value = message.hasSelection;
        selectedNode.value = message.selectedNode;
    }

    if (message.type === 'RAW_NODE_COPIED') {
        console.log('Received RAW_NODE_COPIED message');
        console.log('Raw Figma Node:', message.rawNode);

        if (message.error) {
            console.error('Error in raw node extraction:', message.error);
            alert(`Error extracting node data: ${message.error}`);
            return;
        }

        if (message.rawNode) {
            // Copy raw node data to clipboard
            const rawNodeString = JSON.stringify(message.rawNode, null, 2);
            console.log('Copying to clipboard, length:', rawNodeString.length);
            handleCopyToClipboard(rawNodeString);
        } else {
            console.log('No raw node data received');
        }
    }

    if (message.type === 'VARIABLES_EXTRACTED') {
        extractingVariables.value = false;
        console.log('Received VARIABLES_EXTRACTED message');
        console.log('Variables:', message.variables);

        if (message.error) {
            console.error('Error extracting variables:', message.error);
            alert(`Error extracting variables: ${message.error}`);
            return;
        }

        if (message.variables) {
            const variablesString = JSON.stringify(message.variables, null, 2);
            console.log('Copying variables to clipboard, count:', message.variables.length);
            handleCopyToClipboard(variablesString, true);
        } else {
            console.log('No variables found');
            alert('No variables found in this Figma file');
        }
    }
});

function copyRawFigmaNode() {
    console.log('copyRawFigmaNode clicked, hasSelection:', hasSelection.value);
    if (hasSelection.value) {
        console.log('Sending COPY_RAW_NODE message');
        parent.postMessage({
            pluginMessage: { type: 'COPY_RAW_NODE' },
        }, '*');
    } else {
        console.log('No selection available');
    }
}

function extractVariables() {
    console.log('extractVariables clicked');
    extractingVariables.value = true;
    parent.postMessage({
        pluginMessage: { type: 'EXTRACT_VARIABLES' },
    }, '*');
}
</script>

<template>
    <div class="min-h-screen bg-background text-foreground p-4 space-y-4">
        <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-4">
                <WeWebLogo class="w-8 h-8" />
                <h1 class="text-lg font-semibold">
                    Figma to WeWeb
                </h1>
            </div>

            <!-- Extract Variables Button - Always visible -->
            <div class="mb-4">
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

            <div class="border-t border-border pt-4">
                <div v-if="!hasSelection" class="text-muted-foreground text-sm">
                    Please select a layer in Figma to copy nodes
                </div>

                <div v-else class="space-y-4">
                    <div class="p-3 bg-muted rounded-lg">
                        <p class="text-sm font-medium">
                            Selected Layer:
                        </p>
                        <p class="text-xs text-foreground">
                            {{ selectedNode?.name }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                            {{ selectedNode?.type }}
                        </p>
                    </div>

                    <div>
                        <Button variant="brand" class="w-full" @click="copyRawFigmaNode">
                            Copy Figma Node to Clipboard
                        </Button>
                    </div>

                    <div v-if="copied" class="text-success text-sm">
                        ✓ Figma node copied to clipboard!
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
