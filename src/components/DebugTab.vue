<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDebugMode } from '@/composables/useDebugMode';
import { copyToClipboard } from '@/lib/clipboard';

const selectedNode = ref<any>(null);
const hasSelection = ref(false);
const copied = ref(false);

const { debugMode } = useDebugMode();

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
});

// Initial check for selection
parent.postMessage({
    pluginMessage: { type: 'GET_SELECTION' },
}, '*');

async function handleCopyToClipboard(text: string) {
    await copyToClipboard(text);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
}

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
</script>

<template>
    <div class="space-y-4">
        <!-- Debug Mode Toggle -->
        <div class="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <label for="debug-mode" class="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <span class="icon-[lucide--bug] size-4" />
                Debug Mode
            </label>
            <Switch
                id="debug-mode"
                v-model="debugMode"
            />
        </div>
        <div v-if="!hasSelection" class="text-center">
            <div class="p-8 border-2 border-dashed border-border rounded-lg">
                <p class="text-muted-foreground text-sm">
                    Please select a layer in Figma to debug
                </p>
            </div>
        </div>

        <div v-else class="space-y-4">
            <div class="p-4 bg-muted rounded-lg">
                <p class="text-sm font-medium mb-1">
                    Selected Layer:
                </p>
                <p class="text-sm text-foreground font-mono">
                    {{ selectedNode?.name }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                    Type: {{ selectedNode?.type }}
                </p>
            </div>

            <Button variant="brand" class="w-full" @click="copyRawFigmaNode">
                <span class="flex items-center justify-center gap-2">
                    <span class="icon-[carbon--copy] size-4" />
                    Copy Raw Node Data
                </span>
            </Button>

            <div v-if="copied" class="flex items-center justify-center gap-1.5 text-success text-sm">
                <span class="icon-[lucide--check-circle] size-4" />
                Node data copied to clipboard!
            </div>

            <div class="mt-4 p-3 bg-secondary/50 rounded-lg">
                <p class="text-xs text-muted-foreground">
                    <strong>Debug Info:</strong> This will copy the raw Figma node structure
                    including all properties, constraints, and children. Useful for understanding
                    Figma's data model and debugging plugin issues.
                </p>
            </div>
        </div>
    </div>
</template>
