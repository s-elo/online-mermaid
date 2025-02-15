<script setup lang="ts">
import { ref } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MermaidEditor from './components/MermaidEditor/MermaidEditor.vue';
import MermaidPreview from './components/MermaidPreview.vue';
import { MarkerData } from './utils/errorHandler';
import { initAuth, searchIssues } from './api/github';

const content = ref('');
const paredError = ref<{
  error: Error;
  marker?: MarkerData;
} | null>(null);
const showAuth = ref(false);
const pwd = ref('');

const checkAuth = async () => {
  try {
    initAuth(pwd.value);
    await searchIssues({ content: '' });
    localStorage.setItem('mermaid_token_pwd', pwd.value);
    showAuth.value = false;
  } catch {
    showAuth.value = true;
    alert('wrong password');
  }
};

const isAuth = initAuth();
if (!isAuth) {
  showAuth.value = true;
}
</script>

<template>
  <div class="container">
    <Splitpanes v-if="!showAuth" size="50">
      <Pane min-size="25" max-size="100">
        <MermaidEditor v-model="content" :parsed-error="paredError" />
      </Pane>
      <Pane>
        <MermaidPreview :content="content" @parse-error="paredError = $event" />
      </Pane>
    </Splitpanes>
    <div v-else>
      <input v-model="pwd" type="text" />
      <button @click="checkAuth">confirm</button>
    </div>
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
