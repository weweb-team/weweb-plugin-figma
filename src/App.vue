<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';

const selectedNode = ref<any>(null);
const hasSelection = ref(false);
const copied = ref(false);
const extractingVariables = ref(false);
const variablesCopied = ref(false);

// Robust clipboard function that works in Figma plugins
async function copyToClipboard(text: string, isVariables: boolean = false) {
    try {
        // First try the modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
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
            return;
        }
    } catch {
        console.log('Modern clipboard API failed, trying fallback...');
    }

    // Fallback to the textarea/execCommand method
    try {
        const prevActive = document.activeElement;
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const success = document.execCommand('copy');
        textArea.remove();
        if (prevActive)
            prevActive.focus();

        if (success) {
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
        } else {
            throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('All clipboard methods failed:', err);
        // Show an alert as last resort
        alert('Copy failed. Please manually copy the code from the console or UI below.');
    }
}

onMounted(() => {
    window.onmessage = (event) => {
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
                copyToClipboard(rawNodeString);
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
                copyToClipboard(variablesString, true);
            } else {
                console.log('No variables found');
                alert('No variables found in this Figma file');
            }
        }
    };
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
    <div class="p-4 space-y-4">
        <div class="text-center">
            <h1 class="text-lg font-semibold mb-4">
                Figma to WeWeb
            </h1>

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

                <div v-if="variablesCopied" class="text-green-600 text-sm mt-2">
                    ✓ Variables copied to clipboard!
                </div>
            </div>

            <div class="border-t pt-4">
                <div v-if="!hasSelection" class="text-gray-500 text-sm">
                    Please select a layer in Figma to copy nodes
                </div>

                <div v-else class="space-y-4">
                    <div class="p-3 bg-blue-50 rounded-lg">
                        <p class="text-sm font-medium">
                            Selected Layer:
                        </p>
                        <p class="text-xs text-gray-600">
                            {{ selectedNode?.name }}
                        </p>
                        <p class="text-xs text-gray-500">
                            {{ selectedNode?.type }}
                        </p>
                    </div>

                    <div>
                        <Button variant="brand" class="w-full" @click="copyRawFigmaNode">
                            Copy Figma Node to Clipboard
                        </Button>
                    </div>

                    <div v-if="copied" class="text-green-600 text-sm">
                        ✓ Figma node copied to clipboard!
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
