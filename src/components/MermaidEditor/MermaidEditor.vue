<script lang="ts" setup>
import { onMounted, ref, onBeforeUnmount, watch } from 'vue';
import { initEditor } from './monacoExtra';
import * as monaco from 'monaco-editor';
import monacoEditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import monacoJsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { MarkerData } from '../../utils/errorHandler';

const props = defineProps<{
  modelValue: string;
  parsedError?: {
    error: Error;
    marker?: MarkerData;
  } | null;
}>();
const emits = defineEmits(['update:modelValue', 'save']);

const editorDivRef = ref<HTMLElement | null>(null);
// looks like being proxied by ref will cause some errors
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

watch(
  () => props.modelValue,
  () => {
    if (editor?.getValue() === props.modelValue) return;
    editor?.setScrollTop(0);
    editor?.setValue(props.modelValue);
  },
);

onMounted(() => {
  window.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') {
        return new monacoJsonWorker();
      }
      return new monacoEditorWorker();
    },
  };

  initEditor(monaco);

  if (!editorDivRef.value) return;

  editor = monaco.editor.create(editorDivRef.value, {
    minimap: {
      enabled: false,
    },
    theme: 'mermaid',
    overviewRulerLanes: 0,
  });

  editor.addAction({
    id: 'mermaid-render-diagram',
    label: 'Render Diagram',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: function () {
      emits('save', props.modelValue);
    },
  });

  const model = editor.getModel();
  if (!model) {
    console.error("editor model doesn't exist");
    return;
  }
  monaco.editor.setModelLanguage(model, 'mermaid');
  monaco.editor.setTheme('mermaid');

  editor.onDidChangeModelContent(({ isFlush }) => {
    const newText = editor?.getValue();
    if (props.modelValue === newText || isFlush) {
      return;
    }

    emits('update:modelValue', newText);
  });

  const resizeObserver = new ResizeObserver((entries) => {
    editor?.layout({
      height: entries[0].contentRect.height,
      width: entries[0].contentRect.width,
    });
  });

  if (editorDivRef.value.parentElement) {
    resizeObserver.observe(editorDivRef.value);
  }
});

onBeforeUnmount(() => {
  editor?.dispose();
});
</script>

<template>
  <div class="editor-container">
    <div ref="editorDivRef" class="mermaid-editor"></div>
    <div v-if="parsedError?.error" class="error-container">
      <div class="error-header flex items-center gap-2 bg-red-700 p-2">
        <p>Diagram syntax error</p>
      </div>
      <div
        class="error-body"
        v-html="parsedError?.error?.toString().replaceAll('\n', '<br />')"
      ></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
  position: relative;
}
.mermaid-editor {
  height: 100%;
  overflow: auto;
}
.error-container {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: column;

  .error-header {
    background-color: rgb(185 28 28);
    padding: 0.5rem;
    color: white;
  }

  .error-body {
    overflow: auto;
    max-height: 8rem;
    padding: 0.5rem;
    background-color: rgb(220 38 38);
    color: white;
  }
}
</style>
