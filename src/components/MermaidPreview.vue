<script lang="ts" setup>
import mermaid from 'mermaid';
import { onMounted, ref, watch } from 'vue';
import { handleParseError } from '../utils/errorHandler';
import { ParsedError } from '../utils/errorHandler';

const props = defineProps<{
  content: string;
}>();
const emits = defineEmits(['parseError']);

const mermaidPreviewRef = ref<HTMLElement | null>(null);
const parsedError = ref<ParsedError | null>(null);
const outOfSync = ref<boolean>(false);

const render = async () => {
  if (!mermaidPreviewRef.value) return;
  if (!props.content) {
    updateParsedError(null);
    return;
  }

  const ret = await mermaid.parse(props.content);
  mermaid.initialize({ startOnLoad: false, ...ret.config });
  const { svg, bindFunctions } = await mermaid.render(
    'previewDiv',
    props.content,
  );

  mermaidPreviewRef.value.innerHTML = svg;

  if (bindFunctions) {
    bindFunctions(mermaidPreviewRef.value);
  }
};

const updateParsedError = (data: ParsedError | null) => {
  parsedError.value = data;
  emits('parseError', data);
};

watch(
  () => props.content,
  async () => {
    outOfSync.value = true;
    try {
      await render();
      updateParsedError(null);
    } catch (error) {
      const ret = handleParseError(error as Error, props.content);
      updateParsedError(ret);
    } finally {
      outOfSync.value = false;
    }
  },
);

onMounted(() => {
  render();
});
</script>

<template>
  <div
    class="view-container"
    :class="{ error: parsedError?.error, outOfSync: outOfSync }"
  >
    <div id="mermaid-preview" ref="mermaidPreviewRef"></div>
  </div>
</template>

<style lang="scss" scoped>
.view-container {
  height: 100%;
  &.error {
    opacity: 0.5;
  }

  &.outOfSync {
    opacity: 0.5;
  }
}
</style>
