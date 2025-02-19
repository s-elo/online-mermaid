<script lang="ts" setup>
import { ref } from 'vue';
import {
  TreeView,
  TreeViewNodeMetaModelDefaults,
  TreeViewNodeMetaModel,
} from '@grapoza/vue-tree';
import {
  ElDropdownMenu,
  ElDropdownItem,
  ElDropdown,
  ElDialog,
  ElButton,
  ElInput,
  ElMessage,
} from 'element-plus';
import { uid } from 'uid';
import {
  sort,
  findParentInTree,
  isFile,
  isRootNode,
  callAsync,
} from '../utils/common';
import { TreeData, OperationType } from '../types';

const props = defineProps<{
  modelValue: TreeData[];
  /** how to create node with id and extra data */
  createNode?: (
    label: string,
  ) => Promise<{ id: string; extra?: Record<string, string> }>;
  handleRename?: (
    node: TreeViewNodeMetaModel,
    newName: string,
  ) => Promise<void>;
  handleDelete?: (node: TreeViewNodeMetaModel) => Promise<void>;
  /**
   * node operation finished hook
   * called when the tree is updated
   * */
  afterNodeOperation?: (
    node: TreeViewNodeMetaModel | TreeData[],
    operation: OperationType,
  ) => Promise<void>;
}>();
const emit = defineEmits(['update:modelValue', 'selectNode']);

const treeRef = ref<InstanceType<typeof TreeView> | null>(null);
const currentSelectedNode = ref<TreeViewNodeMetaModel>();
/**
 * - create folder name
 * - create file name
 * - rename
 */
const dialogInput = ref('');

const dialogVisible = ref(false);
const currentOperation = ref<{
  operationType: OperationType;
  node: TreeViewNodeMetaModel | TreeData[];
} | null>(null);

function modelDefaults(node: TreeData) {
  const baseDefaults: TreeViewNodeMetaModelDefaults = {
    draggable: true,
    allowDrop: true,
    state: {
      expanded: false,
    },

    focusable: false,
    deletable: true,
  };

  if (isFile(node)) {
    baseDefaults.allowDrop = false;
    baseDefaults.expandable = false;
  }

  // every drop will add one "-1"
  // we need to remove it
  // note that it will call modelDefault again
  if (node.id.endsWith('-1')) {
    node.id = node.id.slice(0, -2);
    // wait for the tree to update in the modelValue
    setTimeout(() => {
      callAsync(afterDrop, node);
    }, 0);
  }

  return baseDefaults;
}

function setCurrentOperation(
  operationType: OperationType,
  node: TreeViewNodeMetaModel | TreeData[],
) {
  currentOperation.value = {
    operationType,
    node,
  };
  if (operationType === OperationType.Rename) {
    dialogInput.value = (node as TreeViewNodeMetaModel).data.label;
  } else {
    dialogInput.value = '';
  }
  dialogVisible.value = true;
}

async function afterDrop(node: TreeData) {
  const parentNode = findParentInTree(
    { id: 'root', label: 'root', children: props.modelValue },
    node,
  );
  const parentMetaModel = treeRef.value?.getMatching(
    (n) => n.data.id === parentNode?.id,
  );
  if (parentMetaModel?.length) {
    parentMetaModel[0].state.expanded = true;
    sort(parentMetaModel[0].data.children);
  }

  await props.afterNodeOperation?.(
    node as unknown as TreeViewNodeMetaModel,
    OperationType.Drop,
  );
}

async function createFolder(node: TreeViewNodeMetaModel | TreeData[]) {
  const isRoot = Array.isArray(node);
  const children = isRoot ? node : node.data.children;
  children?.push({
    id: uid(),
    label: dialogInput.value,
    children: [],
  });

  if (children) sort(children);

  if (!isRoot) {
    node.state.expanded = true;
  }
}

async function createFile(node: TreeViewNodeMetaModel | TreeData[]) {
  const createdNode = await props.createNode?.(dialogInput.value);
  const isRoot = Array.isArray(node);
  const children = isRoot ? node : node.data.children;
  children?.push({
    id: createdNode?.id ?? uid(),
    label: dialogInput.value,
    extra: createdNode?.extra,
  });

  if (children) sort(children);

  if (!isRoot) {
    node.state.expanded = true;
  }
}

async function rename(node: TreeViewNodeMetaModel) {
  await props.handleRename?.(node, dialogInput.value);
  node.data.label = dialogInput.value;
}

async function deleteNode(node: TreeViewNodeMetaModel, needToHandle = true) {
  if (needToHandle) {
    await props.handleDelete?.(node);
  }

  // when specify deletable as true, there will be a delete button
  // sadly, looks like no api to customize deleting operation;
  // so we display-none the button, and call click()
  const deleteBtn = document
    .querySelector(`#node-id-${node.data.id}`)
    ?.parentNode?.querySelector('.grtvn-self-action') as HTMLElement;
  deleteBtn?.click();
}

async function backToTop(node: TreeViewNodeMetaModel) {
  const nodeData = node.data as TreeData;
  await deleteNode(node, false);
  const newData = [...props.modelValue, nodeData];
  sort(newData);
  emit('update:modelValue', newData);
  await props.afterNodeOperation?.(node, OperationType.BackToTop);
}

async function confirmOperation() {
  if (!currentOperation.value) return;

  const curOperationType = currentOperation.value.operationType;
  if (curOperationType === OperationType.CreateFolder) {
    await createFolder(currentOperation.value.node);
  } else if (curOperationType === OperationType.CreateFile) {
    await createFile(currentOperation.value.node);
  } else if (curOperationType === OperationType.Rename) {
    await rename(currentOperation.value.node as TreeViewNodeMetaModel);
  } else if (curOperationType === OperationType.Delete) {
    await deleteNode(currentOperation.value.node as TreeViewNodeMetaModel);
  }

  await props.afterNodeOperation?.(
    currentOperation.value.node,
    currentOperation.value.operationType,
  );
  dialogVisible.value = false;

  ElMessage({
    message: `${curOperationType} successfully`,
    type: 'success',
  });
}

function clickNode(node: TreeViewNodeMetaModel) {
  if (currentSelectedNode.value?.data.id === node.data.id) return;

  if (isFile(node.data as TreeData)) {
    currentSelectedNode.value = node;
    emit('selectNode', node);
  }
  node.state.expanded = !node.state.expanded;
}

const filterText = ref('');
const filterMethod = ref<((node: TreeViewNodeMetaModel) => boolean) | null>(
  null,
);

const applyFilter = () => {
  if (filterText.value === '') {
    filterMethod.value = null;
  } else {
    const lowercaseFilter = filterText.value.toLowerCase();
    filterMethod.value = (n) =>
      n.data.label.toLowerCase().includes(lowercaseFilter);
  }
};
</script>

<template>
  <div class="mermaid-collection">
    <el-dropdown
      trigger="click"
      class="create-node-dropdown"
      :hide-on-click="false"
    >
      <el-button class="create-node-btn" type="primary">Create New +</el-button>
      <template #dropdown>
        <el-dropdown-menu class="create-node-menu">
          <el-dropdown-item
            @click="setCurrentOperation(OperationType.CreateFolder, modelValue)"
          >
            Create Folder
          </el-dropdown-item>
          <el-dropdown-item
            @click="setCurrentOperation(OperationType.CreateFile, modelValue)"
          >
            Create Chart
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-input
      v-model="filterText"
      style="max-width: 600px"
      placeholder="Search"
      class="search-node-input"
    >
      <template #append>
        <span class="material-symbols-outlined search-icon" @click="applyFilter"
          >search</span
        >
      </template>
    </el-input>

    <TreeView
      ref="treeRef"
      :model-value="modelValue || []"
      :model-defaults="modelDefaults"
      :filter-method="filterMethod"
      @update:model-value="emit('update:modelValue', $event)"
      @tree-node-click="clickNode"
    >
      <template #expander="{ metaModel, expanderId }">
        <div
          v-if="!isFile(metaModel.data)"
          :id="expanderId"
          :title="metaModel.expanderTitle"
          class="grtvn-self-expander folder-expander"
          :class="{
            'folder-expander-expanded': metaModel.state.expanded,
          }"
          @click="metaModel.state.expanded = !metaModel.state.expanded"
        >
          <span class="material-symbols-outlined arrow">chevron_right</span>
          <span
            v-show="metaModel.state.expanded"
            class="material-symbols-outlined folder"
            >folder_open</span
          >
          <span
            v-show="!metaModel.state.expanded"
            class="material-symbols-outlined folder"
            >folder</span
          >
        </div>
        <img
          v-else
          class="file-logo"
          src="https://www.mermaidchart.com/img/favicon.ico"
        />
      </template>
      <template #text="{ metaModel }">
        <div :id="`node-id-${metaModel.data.id}`" class="node-text-container">
          <div
            class="node-text"
            :class="{
              selected: metaModel.data.id === currentSelectedNode?.data?.id,
            }"
          >
            {{ metaModel.data.label }}
          </div>
          <el-dropdown
            trigger="click"
            class="node-operation"
            :hide-on-click="false"
          >
            <span class="material-symbols-outlined" @click.stop>menu</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="!isFile(metaModel.data)"
                  @click.stop="
                    setCurrentOperation(OperationType.CreateFolder, metaModel)
                  "
                >
                  Create Folder
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="!isFile(metaModel.data)"
                  @click.stop="
                    setCurrentOperation(OperationType.CreateFile, metaModel)
                  "
                  >Create Chart</el-dropdown-item
                >
                <el-dropdown-item
                  @click.stop="
                    setCurrentOperation(OperationType.Rename, metaModel)
                  "
                  >Rename</el-dropdown-item
                >
                <el-dropdown-item
                  v-if="!isRootNode(metaModel, modelValue)"
                  @click.stop="callAsync(backToTop, metaModel)"
                  >Back To Top</el-dropdown-item
                >
                <el-dropdown-item
                  @click.stop="
                    setCurrentOperation(OperationType.Delete, metaModel)
                  "
                  >Delete</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </TreeView>

    <div v-if="!modelValue.length" class="empty-container">
      No mermaids yet, create one!
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="currentOperation?.operationType"
      width="500"
    >
      <el-input
        v-if="
          [
            OperationType.CreateFolder,
            OperationType.CreateFile,
            OperationType.Rename,
          ].includes(currentOperation!.operationType)
        "
        v-model="dialogInput"
      />
      <span v-else>Are you sure to delete?</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="callAsync(confirmOperation)">
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.mermaid-collection {
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 14px;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 5px;
  background-color: rgb(241 248 250);
  .search-icon {
    cursor: pointer;
  }
  .search-node-input {
    margin-bottom: 1rem;
  }
  .create-node-dropdown {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .create-node-btn {
    width: 100%;
    height: 32px;
    margin: 10px 0;
  }
  .node-text-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .node-text {
    height: 32px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    padding: 5px;
    &.selected {
      color: #2673dd;
    }
  }
  .node-operation {
    width: fit-content;
    opacity: 0.5;
    display: none;
    height: 24px;
    &:hover {
      opacity: 1;
    }
  }
  .folder-expander {
    height: 32px;
    display: flex;
    align-items: center;
    margin-right: 0.3rem;
    &-expanded {
      .arrow {
        transform: rotate(90deg);
      }
    }
    span {
      transition: 0.2s;
      font-weight: lighter;
    }
  }

  .file-logo {
    width: 16px;
    height: 16px;
    margin-left: 0.5rem;
  }

  :deep(.grtv-wrapper) {
    min-width: fit-content;
  }
  :deep(.grtvn-self) {
    border-radius: 5px;
    cursor: pointer;
    justify-content: flex-start;
    align-items: center;
    &:hover {
      background-color: rgb(133 133 164 / 20%);
      .node-operation {
        display: block;
      }
    }
  }
  :deep(.grtvn-children-wrapper) {
    margin-left: 1rem;
  }
  :deep(.grtv-wrapper.grtv-default-skin) {
    .grtvn[role='treeitem'] {
      .grtvn-self {
        outline: none;
      }
    }
  }
  :deep(.grtvn-self-action) {
    display: none;
  }

  .empty-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a7a4a4;
  }
}
</style>
<style>
.create-node-menu {
  width: 300px;
}
</style>
