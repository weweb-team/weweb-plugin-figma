<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';

const selectedNode = ref<any>(null);
const hasSelection = ref(false);
const wewebComponent = ref<any>(null);
const htmlOutput = ref<any>(null);
const copied = ref(false);
const copiedHtml = ref(false);

// Robust clipboard function that works in Figma plugins
async function copyToClipboard(text: string, isHtml: boolean = false) {
    try {
        // First try the modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            if (isHtml) {
                copiedHtml.value = true;
                setTimeout(() => { copiedHtml.value = false; }, 2000);
            } else {
                copied.value = true;
                setTimeout(() => { copied.value = false; }, 2000);
            }
            return;
        }
    } catch (err) {
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
        if (prevActive) prevActive.focus();
        
        if (success) {
            if (isHtml) {
                copiedHtml.value = true;
                setTimeout(() => { copiedHtml.value = false; }, 2000);
            } else {
                copied.value = true;
                setTimeout(() => { copied.value = false; }, 2000);
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
            wewebComponent.value = null;
            htmlOutput.value = null;
        }
        
        if (message.type === 'WEWEB_CONVERTED') {
            wewebComponent.value = message.component;
            console.log('WeWeb Component:', message.component);
            
            // Auto-copy to clipboard with robust method
            const componentString = JSON.stringify(message.component, null, 2);
            copyToClipboard(componentString, false);
        }
        
        if (message.type === 'HTML_CONVERTED') {
            htmlOutput.value = {
                html: message.html,
                css: message.css
            };
            console.log('HTML Output:', htmlOutput.value);
            
            // Auto-copy HTML to clipboard
            let htmlString = message.html;
            if (message.css) {
                htmlString = `${message.html}\n\n<style>\n${message.css}\n</style>`;
            }
            copyToClipboard(htmlString, true);
        }
        
        if (message.type === 'RAW_NODE_COPIED') {
            console.log('Raw Figma Node:', message.rawNode);
            
            // Copy raw node data to clipboard
            const rawNodeString = JSON.stringify(message.rawNode, null, 2);
            copyToClipboard(rawNodeString, false);
        }
    };
});

function convertToWeWeb() {
    if (hasSelection.value) {
        parent.postMessage({
            pluginMessage: { type: 'CONVERT_TO_WEWEB' }
        }, '*');
    }
}

function convertToHtml() {
    if (hasSelection.value) {
        parent.postMessage({
            pluginMessage: { type: 'CONVERT_TO_HTML' }
        }, '*');
    }
}

function copyRawFigmaNode() {
    if (hasSelection.value) {
        parent.postMessage({
            pluginMessage: { type: 'COPY_RAW_NODE' }
        }, '*');
    }
}
</script>

<template>
    <div class="p-4 space-y-4">
        <div class="text-center">
            <h1 class="text-lg font-semibold mb-4">Figma to WeWeb Converter</h1>
            
            <div v-if="!hasSelection" class="text-gray-500 text-sm">
                Please select a layer in Figma
            </div>
            
            <div v-else class="space-y-4">
                <div class="p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm font-medium">Selected Layer:</p>
                    <p class="text-xs text-gray-600">{{ selectedNode?.name }}</p>
                    <p class="text-xs text-gray-500">{{ selectedNode?.type }}</p>
                </div>
                
                <div class="grid grid-cols-1 gap-2">
                    <Button @click="convertToWeWeb" class="w-full">
                        Convert to WeWeb & Copy to Clipboard
                    </Button>
                    
                    <Button @click="convertToHtml" class="w-full" variant="secondary">
                        Convert to HTML & Copy to Clipboard
                    </Button>
                    
                    <Button @click="copyRawFigmaNode" class="w-full" variant="outline">
                        Copy Raw Figma Node to Clipboard
                    </Button>
                </div>
                
                <div v-if="copied" class="text-green-600 text-sm">
                    ✓ WeWeb JSON copied to clipboard!
                </div>
                
                <div v-if="copiedHtml" class="text-green-600 text-sm">
                    ✓ HTML copied to clipboard!
                </div>
            </div>
        </div>
        
        <div v-if="wewebComponent" class="mt-4">
            <h3 class="text-sm font-medium mb-2">WeWeb Component:</h3>
            <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">{{ JSON.stringify(wewebComponent, null, 2) }}</pre>
        </div>
        
        <div v-if="htmlOutput" class="mt-4">
            <h3 class="text-sm font-medium mb-2">HTML Output:</h3>
            <div class="space-y-2">
                <div v-if="htmlOutput.html">
                    <h4 class="text-xs font-medium text-gray-700">HTML:</h4>
                    <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">{{ htmlOutput.html }}</pre>
                </div>
                <div v-if="htmlOutput.css">
                    <h4 class="text-xs font-medium text-gray-700">CSS:</h4>
                    <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">{{ htmlOutput.css }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>
