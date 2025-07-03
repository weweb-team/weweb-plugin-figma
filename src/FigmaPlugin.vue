<script setup lang="ts">
import { ref } from 'vue';
import DebugTab from '@/components/DebugTab.vue';
import DesignSystemTab from '@/components/DesignSystemTab.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeWebLogo from '@/components/WeWebLogo.vue';

const activeTab = ref('design-system');
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
                <TabsList class="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="design-system">
                        <span class="icon-[ph--palette-bold] size-4 mr-2" />
                        Design System
                    </TabsTrigger>
                    <TabsTrigger value="debug">
                        <span class="icon-[lucide--bug] size-4 mr-2" />
                        Debug
                    </TabsTrigger>
                </TabsList>

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
