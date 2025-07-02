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
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="design-system">
                        Design System
                    </TabsTrigger>
                    <TabsTrigger value="debug">
                        Debug
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="design-system" class="mt-4">
                    <DesignSystemTab />
                </TabsContent>

                <TabsContent value="debug" class="mt-4">
                    <DebugTab />
                </TabsContent>
            </Tabs>
        </div>
    </div>
</template>
