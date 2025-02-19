<script setup lang="ts">
import { onMounted } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MermaidEditor from './components/MermaidEditor/MermaidEditor.vue';
import MermaidPreview from './components/MermaidPreview.vue';
import MermaidCollection from './components/MermaidCollection.vue';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import { ElInput, ElButton, ElMessage } from 'element-plus';
import { useMermaid } from './hooks/mermaid';
import { useAuth } from './hooks/auth';
import { TreeData } from './types';
import { asyncDebounce, isFile, callAsync } from './utils/common';

const {
  content,
  parsedError,
  collection,
  initCollection,
  setCollection,
  createMermaid,
  updateMermaid,
  deleteMermaid,
  getMermaid,
  selectedNode,
} = useMermaid();

const { checkAuth, showAuth, pwd, checkLoading } = useAuth(initCollection);

/** create a issue and make the issue id to be the node id */
async function createNode(label: string) {
  const issue = await createMermaid(label);
  return {
    id: String(issue.number),
    extra: { url: issue.url },
  };
}

async function handleRename(node: TreeViewNodeMetaModel, newName: string) {
  if (isFile(node.data as TreeData)) {
    await updateMermaid(node.data.id, { title: newName });
  }
}

async function handleDelete(node: TreeViewNodeMetaModel) {
  if (isFile(node.data as TreeData)) {
    await deleteMermaid(node.data.id);
  }
}

async function afterNodeOperation() {
  return setCollection();
}
const debounceAfterNodeOperation = asyncDebounce(afterNodeOperation, 500);

async function selectNode(node: TreeViewNodeMetaModel) {
  return callAsync(async () => {
    selectedNode.value = node;
    await getMermaid(node.data.id);
  });
}

async function save(content: string) {
  if (!selectedNode.value) return;

  try {
    await updateMermaid(selectedNode.value.data.id, {
      body: content,
    });
  } catch (err) {
    ElMessage({
      type: 'error',
      message: (err as Error).message,
    });
  }
}

onMounted(async () => {
  if (showAuth.value) return;

  callAsync(initCollection);
});
</script>

<template>
  <div class="container">
    <Splitpanes v-if="!showAuth" size="50">
      <Pane min-size="15" max-size="20" size="15">
        <MermaidCollection
          v-model="collection"
          :after-node-operation="debounceAfterNodeOperation"
          :create-node="createNode"
          :handle-rename="handleRename"
          :handle-delete="handleDelete"
          @select-node="selectNode"
        />
      </Pane>
      <Pane min-size="25" max-size="100">
        <MermaidEditor
          v-model="content"
          :parsed-error="parsedError"
          @save="save"
        />
      </Pane>
      <Pane>
        <MermaidPreview
          :content="content"
          @parse-error="parsedError = $event"
        />
      </Pane>
    </Splitpanes>
    <div v-else class="auth-container">
      <el-input v-model="pwd" type="text" class="auth-input" />
      <el-button
        class="auth-button"
        type="primary"
        :loading="checkLoading"
        @click="checkAuth"
        >Verify</el-button
      >
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
    margin-right: 1rem;
  }
}
</style>
