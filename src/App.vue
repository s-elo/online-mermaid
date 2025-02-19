<script setup lang="ts">
import { onMounted } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MermaidEditor from './components/MermaidEditor/MermaidEditor.vue';
import MermaidPreview from './components/MermaidPreview.vue';
import MermaidCollection from './components/MermaidCollection.vue';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import { ElMessage, ElInput, ElButton } from 'element-plus';
import { useMermaid } from './hooks/mermaid';
import { useAuth } from './hooks/auth';
import { getIssue } from './api/github';
import { TreeData } from './types';
import { fullLoading, asyncDebounce, isFile } from './utils/common';

const {
  content,
  parsedError,
  collection,
  initCollection,
  setCollection,
  createMermaid,
  updateMermaid,
  deleteMermaid,
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
  fullLoading.start();
  try {
    await setCollection();
  } catch (err) {
    ElMessage({
      message: (err as Error).message,
      type: 'error',
    });
  } finally {
    fullLoading.close();
  }
}
const debounceAfterNodeOperation = asyncDebounce(afterNodeOperation, 500);

async function syncMermaidContent(selectedNodeId: number) {
  fullLoading.start();
  try {
    const res = await getIssue(selectedNodeId);
    content.value = res.body ?? '';
  } catch (err) {
    ElMessage({
      message: (err as Error).message,
      type: 'error',
    });
  } finally {
    fullLoading.close();
  }
}

function selectNode(node: TreeViewNodeMetaModel) {
  syncMermaidContent(node.data.id);
}

onMounted(async () => {
  if (showAuth.value) return;

  fullLoading.start();
  try {
    await initCollection();
  } catch (err) {
    const msg = (err as Error).message;
    if (!msg.startsWith('Not Found')) {
      ElMessage({
        message: msg,
        type: 'error',
      });
    }
  } finally {
    fullLoading.close();
  }
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
        <MermaidEditor v-model="content" :parsed-error="parsedError" />
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
