<script setup lang="ts">
import type { ConversionResult, ConversionSettings } from '@/types/conversion';
import { computed, onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { copyToClipboard } from '@/lib/clipboard';

const isExporting = ref(false);
const hasSelection = ref(false);
const selectedNode = ref<{ id: string; name: string; type: string } | null>(null);
const exportResult = ref<ConversionResult | null>(null);
const showSuccess = ref(false);

// Export settings
const settings = ref<ConversionSettings>({
    responsive: true,
    optimizeAssets: true,
    trackPerformance: false,
});

// Progress tracking
const exportProgress = ref({
    current: 0,
    total: 0,
    message: '',
});

const canExport = computed(() => hasSelection.value && !isExporting.value);

const progressPercentage = computed(() => {
    if (exportProgress.value.total === 0)
        return 0;
    return Math.round((exportProgress.value.current / exportProgress.value.total) * 100);
});

onMounted(() => {
    // Listen for selection changes
    window.addEventListener('message', handleMessage);

    // Request initial selection
    parent.postMessage({
        pluginMessage: { type: 'GET_SELECTION' },
    }, '*');
});

function handleMessage(event: MessageEvent) {
    console.log('[ExportTab] Received message:', event.data);

    const { type, ...data } = event.data.pluginMessage || {};

    console.log('[ExportTab] Message type:', type, 'data:', data);

    switch (type) {
        case 'SELECTION_CHANGED':
            console.log('[ExportTab] Selection changed:', data);
            hasSelection.value = data.hasSelection;
            selectedNode.value = data.selectedNode;
            break;

        case 'EXPORT_PROGRESS':
            console.log('[ExportTab] Export progress:', data.message);
            exportProgress.value.message = data.message;
            break;

        case 'EXPORT_COMPLETE':
            console.log('[ExportTab] Export complete:', data);
            isExporting.value = false;
            if (data.result) {
                exportResult.value = data.result;
                handleExportComplete();
            }
            break;

        case 'EXPORT_ERROR':
            console.log('[ExportTab] Export error:', data.error);
            isExporting.value = false;
            console.error('Export failed:', data.error);
            break;

        default:
            if (type) {
                console.log('[ExportTab] Unknown message type:', type);
            }
            break;
    }
}

async function exportToWeWeb() {
    console.log('[ExportTab] Export button clicked');

    if (!canExport.value) {
        console.log('[ExportTab] Cannot export - canExport is false');
        console.log('[ExportTab] hasSelection:', hasSelection.value);
        console.log('[ExportTab] isExporting:', isExporting.value);
        return;
    }

    console.log('[ExportTab] Starting export process');
    isExporting.value = true;
    showSuccess.value = false;
    exportResult.value = null;

    exportProgress.value = {
        current: 0,
        total: 100,
        message: 'Starting export...',
    };

    const messageData = {
        pluginMessage: {
            type: 'EXPORT_TO_WEWEB',
            settings: {
                responsive: settings.value.responsive,
                optimizeAssets: settings.value.optimizeAssets,
                trackPerformance: settings.value.trackPerformance,
            },
        },
    };

    console.log('[ExportTab] Sending message to plugin:', messageData);

    // Send export request to plugin
    parent.postMessage(messageData, '*');

    console.log('[ExportTab] Message sent to plugin');
}

async function handleExportComplete() {
    if (!exportResult.value)
        return;

    try {
        const output = {
            component: exportResult.value.component,
            variables: exportResult.value.usedVariables,
            fonts: exportResult.value.fonts,
            assets: exportResult.value.assets,
        };

        const jsonOutput = JSON.stringify(output, null, 2);
        console.log('[ExportTab] Copying to clipboard:');
        console.log(jsonOutput);

        await copyToClipboard(jsonOutput);
        showSuccess.value = true;

        setTimeout(() => {
            showSuccess.value = false;
        }, 3000);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
    }
}

function toggleSetting(key: keyof ConversionSettings) {
    settings.value[key] = !settings.value[key];
}
</script>

<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="text-center">
            <h2 class="text-lg font-semibold mb-1">
                Export to WeWeb
            </h2>
            <p class="text-xs text-muted-foreground">
                Convert your selected Figma node to WeWeb component format
            </p>
        </div>

        <!-- Selection Status -->
        <div class="p-3 border border-border rounded-lg">
            <div class="flex items-center gap-2">
                <div
                    class="size-2 rounded-full"
                    :class="hasSelection ? 'bg-green-500' : 'bg-gray-400'"
                />
                <div class="flex-1">
                    <p class="text-sm font-medium">
                        {{ hasSelection ? 'Selection Ready' : 'No Selection' }}
                    </p>
                    <p v-if="selectedNode" class="text-xs text-muted-foreground">
                        {{ selectedNode.name }} ({{ selectedNode.type }})
                    </p>
                    <p v-else class="text-xs text-muted-foreground">
                        Select a Figma node to export
                    </p>
                </div>
            </div>
        </div>

        <!-- Export Settings -->
        <div class="space-y-3">
            <h3 class="text-sm font-medium">
                Export Settings
            </h3>

            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium">
                            Responsive Design
                        </p>
                        <p class="text-xs text-muted-foreground">
                            Generate mobile and tablet breakpoints
                        </p>
                    </div>
                    <Switch
                        :checked="settings.responsive"
                        @click="toggleSetting('responsive')"
                    />
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium">
                            Optimize Assets
                        </p>
                        <p class="text-xs text-muted-foreground">
                            Compress images and optimize output
                        </p>
                    </div>
                    <Switch
                        :checked="settings.optimizeAssets"
                        @click="toggleSetting('optimizeAssets')"
                    />
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium">
                            Performance Tracking
                        </p>
                        <p class="text-xs text-muted-foreground">
                            Show detailed conversion metrics
                        </p>
                    </div>
                    <Switch
                        :checked="settings.trackPerformance"
                        @click="toggleSetting('trackPerformance')"
                    />
                </div>
            </div>
        </div>

        <!-- Export Progress -->
        <div v-if="isExporting" class="space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium">Exporting...</span>
                <span class="text-xs text-muted-foreground">{{ progressPercentage }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
                <div
                    class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    :style="{ width: `${progressPercentage}%` }"
                />
            </div>
            <p class="text-xs text-muted-foreground">
                {{ exportProgress.message }}
            </p>
        </div>

        <!-- Export Button -->
        <Button
            :disabled="!canExport"
            class="w-full"
            @click="exportToWeWeb"
        >
            <span v-if="isExporting" class="icon-[lucide--loader-2] size-4 mr-2 animate-spin" />
            <span v-else class="icon-[lucide--download] size-4 mr-2" />
            {{ isExporting ? 'Exporting...' : 'Export to WeWeb' }}
        </Button>

        <!-- Success Message -->
        <div
            v-if="showSuccess"
            class="p-3 bg-green-50 border border-green-200 rounded-lg"
        >
            <div class="flex items-center gap-2 text-green-800">
                <span class="icon-[lucide--check-circle] size-4" />
                <p class="text-sm font-medium">
                    Export successful!
                </p>
            </div>
            <p class="text-xs text-green-700 mt-1">
                WeWeb component copied to clipboard
            </p>
        </div>
    </div>
</template>
