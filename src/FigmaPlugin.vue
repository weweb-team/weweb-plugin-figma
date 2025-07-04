<script setup lang="ts">
import { ref } from 'vue';
import DebugTab from '@/components/DebugTab.vue';
import DesignSystemTab from '@/components/DesignSystemTab.vue';
import ExportTab from '@/components/ExportTab.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeWebLogo from '@/components/WeWebLogo.vue';

const activeTab = ref('export');
</script>

<template>
    <div class="min-h-screen bg-background text-foreground flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-border">
            <div class="flex items-center justify-center gap-2">
                <WeWebLogo class="size-8" />
                <h1 class="text-lg font-semibold">
                    WeWeb Figma Plugin
                </h1>
            </div>
        </div>

        <!-- Tabs Container -->
        <div class="flex-1 p-4">
            <Tabs v-model="activeTab" class="w-full">
                <TabsList class="grid w-full mb-4" style="grid-template-columns: 1fr 1fr auto;">
                    <TabsTrigger value="export">
                        <span class="icon-[lucide--download] size-4 mr-2" />
                        Export
                    </TabsTrigger>
                    <TabsTrigger value="design-system">
                        <span class="icon-[ph--palette-bold] size-4 mr-2" />
                        Design System
                    </TabsTrigger>
                    <TabsTrigger value="debug" class="px-3">
                        <span class="icon-[lucide--bug] size-4" />
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="export">
                    <ExportTab />
                </TabsContent>

                <TabsContent value="design-system">
                    <DesignSystemTab />
                </TabsContent>

                <TabsContent value="debug">
                    <DebugTab />
                </TabsContent>
            </Tabs>
        </div>
    </div>
</template>
