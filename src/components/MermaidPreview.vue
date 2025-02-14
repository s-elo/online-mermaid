<script lang="ts" setup>
import mermaid from 'mermaid';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
  content: string;
}>();

mermaid.initialize({ startOnLoad: false });
const mermaidPreviewRef = ref<HTMLElement | null>(null);

const render = async () => {
  const { svg } = await mermaid.render('previewDiv', props.content);
  if (mermaidPreviewRef.value) {
    mermaidPreviewRef.value.innerHTML = svg;
  }
};

watch(
  () => props.content,
  () => {
    render();
  },
);

onMounted(() => {
  render();
});
</script>

<template>
  <div id="mermaid-preview" ref="mermaidPreviewRef"></div>
</template>

<style lang="scss" scoped></style>
