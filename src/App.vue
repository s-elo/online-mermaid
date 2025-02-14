<script setup lang="ts">
import mermaid from 'mermaid';
import { onMounted, ref } from 'vue';

mermaid.initialize({ startOnLoad: false });
const mermaidPreviewRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  const content = `graph TB\na-->b`;
  const { svg } = await mermaid.render('graphDiv', content);
  mermaidPreviewRef.value!.innerHTML = svg;
});
</script>

<template>
  <div class="container">
    <div id="mermaid-preview" ref="mermaidPreviewRef" />
  </div>
</template>

<style scoped></style>
