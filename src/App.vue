<script setup lang="ts">
import { ref } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MermaidEditor from './components/MermaidEditor/MermaidEditor.vue';
import MermaidPreview from './components/MermaidPreview.vue';
import { MarkerData } from './utils/errorHandler';

const content = ref('');
const paredError = ref<{
  error: Error;
  marker?: MarkerData;
} | null>(null);
</script>

<template>
  <div class="container">
    <Splitpanes size="50">
      <Pane min-size="25" max-size="100">
        <MermaidEditor v-model="content" :parsed-error="paredError" />
      </Pane>
      <Pane>
        <MermaidPreview :content="content" @parse-error="paredError = $event" />
      </Pane>
    </Splitpanes>
  </div>
</template>

<style scoped lang="scss">
.container {
  height: 100%;
  padding: 20px;
}
</style>
<style lang="scss">
.splitpanes--vertical > .splitpanes__splitter {
  width: 0.5rem;
}
.splitpanes__splitter {
  background-color: #fafafa;
  cursor: col-resize;
  &:hover {
    background-color: #e9e7e7;
  }
}
</style>
