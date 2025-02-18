<script setup lang="ts">
import { ref } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MermaidEditor from './components/MermaidEditor/MermaidEditor.vue';
import MermaidPreview from './components/MermaidPreview.vue';
import MermaidCollection from './components/MermaidCollection.vue';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import { MarkerData } from './utils/errorHandler';
import { initAuth, searchIssues } from './api/github';
import { TreeData, OperationType } from './types';

const content = ref('');
const paredError = ref<{
  error: Error;
  marker?: MarkerData;
} | null>(null);
const showAuth = ref(false);
const pwd = ref('');

const mermaidCollection = ref<TreeData[]>([]);

const checkAuth = async () => {
  if (!pwd.value.trim()) {
    return alert('wrong password');
  }
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

async function afterNodeOperation(
  node: TreeViewNodeMetaModel | TreeData[],
  operationType: OperationType,
) {
  console.log(
    'afterNodeOperation',
    node,
    operationType,
    JSON.parse(JSON.stringify(mermaidCollection.value)),
  );
}
</script>

<template>
  <div class="container">
    <Splitpanes v-if="!showAuth" size="50">
      <Pane min-size="15" max-size="20" size="15">
        <MermaidCollection
          v-model="mermaidCollection"
          :after-node-operation="afterNodeOperation"
        />
      </Pane>
      <Pane min-size="25" max-size="100">
        <MermaidEditor v-model="content" :parsed-error="paredError" />
      </Pane>
      <Pane>
        <MermaidPreview :content="content" @parse-error="paredError = $event" />
      </Pane>
    </Splitpanes>
    <div v-else class="auth-container">
      <input v-model="pwd" type="text" class="auth-input" />
      <button class="auth-button" @click="checkAuth">Login</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  height: 100%;
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
.auth {
  &-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  &-input {
    width: 200px;
    height: 30px;
    border-radius: 5px;
    border: 1px solid #ccc;
    padding: 0.5rem;
    &:focus {
      outline: none;
      border: 1px solid #2673dd;
    }
  }
  &-button {
    height: 30px;
    padding: 0.5rem;
    cursor: pointer;
    line-height: 15px;
    margin-left: 10px;
    border-radius: 5px;
    outline: none;
    border: 1px solid #ccc;
    background-color: white;
    &:hover {
      background-color: #eee;
    }
  }
}
</style>
