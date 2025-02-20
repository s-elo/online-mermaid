<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MermaidEditor from './components/MermaidEditor/MermaidEditor.vue';
import MermaidPreview from './components/MermaidPreview.vue';
import MermaidCollection from './components/MermaidCollection.vue';
import MermaidTabs from './components/MermaidTabs.vue';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import { ElInput, ElButton, ElMessage } from 'element-plus';
import { useMermaid } from './hooks/mermaid';
import { useAuth } from './hooks/auth';
import { TreeData, OperationType } from './types';
import { asyncDebounce, isFile, callAsync, confirm } from './utils/common';

const {
  content,
  parsedError,
  collection,
  initCollection,
  setCollection,
  getMermaid,
  createMermaid,
  updateMermaid,
  deleteMermaid,
  selectedNodeId,
  mermaidTabs,
  syncMermaidCache,
} = useMermaid();

const { checkAuth, showAuth, pwd, checkLoading } = useAuth(initCollection);

const showEmpty = computed(() => !mermaidTabs.value.length);

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

async function afterNodeOperation(
  node: TreeViewNodeMetaModel | TreeData[],
  operationType: OperationType,
) {
  await setCollection();

  if (operationType === OperationType.Rename) {
    const updatedNodeData = (node as TreeViewNodeMetaModel).data;
    const tab = mermaidTabs.value.find((t) => t.name === updatedNodeData.id);
    if (tab) {
      tab.title = updatedNodeData.label;
    }
  }
}
const debounceAfterNodeOperation = asyncDebounce(afterNodeOperation, 500);

async function selectNode(node: TreeViewNodeMetaModel) {
  await getMermaid(node.data.id);
  if (!mermaidTabs.value.find((t) => t.name === node.data.id)) {
    mermaidTabs.value.push({
      name: node.data.id,
      title: node.data.label,
    });
  }
}

async function selectTab(tabName: string) {
  await getMermaid(tabName);
}

async function removeTab(tabName: string) {
  const tabIdx = mermaidTabs.value.findIndex((t) => t.name === tabName);

  if (
    mermaidTabs.value[tabIdx].stale &&
    !(await confirm(`The ${mermaidTabs.value[tabIdx].title} is not saved`))
  ) {
    return;
  }

  mermaidTabs.value.splice(tabIdx, 1);

  if (tabName !== selectedNodeId.value) return;

  if (mermaidTabs.value.length) {
    const lastTab = mermaidTabs.value[mermaidTabs.value.length - 1];
    await getMermaid(lastTab.name);
  } else {
    content.value = '';
  }
}

async function save(content: string) {
  if (!selectedNodeId.value) return;

  try {
    await updateMermaid(selectedNodeId.value, {
      body: content,
    });
    syncMermaidCache(selectedNodeId.value, content);
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
          :selected-node-id="selectedNodeId"
          :after-node-operation="debounceAfterNodeOperation"
          :create-node="createNode"
          :handle-rename="handleRename"
          :handle-delete="handleDelete"
          @select-node="selectNode"
        />
      </Pane>
      <Pane>
        <MermaidTabs
          :tabs="mermaidTabs"
          :tab="selectedNodeId"
          @select-tab="selectTab"
          @tab-remove="removeTab"
        />
        <Splitpanes v-show="!showEmpty" size="50">
          <Pane>
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
        <div v-if="showEmpty" class="empty-view">
          Select or create a mermaid chart now!
        </div>
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
  .empty-view {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #a7a4a4;
  }
  .auth-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    .auth-input {
      width: 300px;
      margin-right: 0.5rem;
    }
  }
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
