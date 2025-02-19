import { ref, toRaw, watch } from 'vue';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import {
  getRepoContent,
  createOrUpdateRepoContent,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssue,
} from '../api/github';
import { TreeData } from '../types';
import { base64ToStr } from '../utils/encrypt';
import { UpdateIssueParams } from '../api/type';
import { MarkerData } from '../utils/errorHandler';

export function useMermaid() {
  const content = ref('');
  const parsedError = ref<{
    error: Error;
    marker?: MarkerData;
  } | null>(null);
  const collectionSha = ref('');
  const collection = ref<TreeData[]>([]);
  const selectedNode = ref<TreeViewNodeMetaModel | null>(null);

  const mermaids = new Map<
    /** node/issue id */
    string,
    {
      /** the actual content stored in the issue pool */
      online: string;
      /** local changed content */
      local: string;
    }
  >();

  watch(content, () => {
    if (!selectedNode.value) return;

    // handle the changes in editor
    const cached = mermaids.get(String(selectedNode.value.data.id));
    if (cached) {
      cached.local = content.value;
    }
  });

  async function getMermaid(selectedNodeId: string) {
    const cached = mermaids.get(String(selectedNodeId));
    if (cached) {
      content.value = cached.local;
      return;
    }

    const res = await getIssue(Number(selectedNodeId));
    content.value = res.body ?? '';

    mermaids.set(selectedNodeId, {
      online: content.value,
      local: content.value,
    });
  }

  async function initCollection() {
    const res = await getRepoContent('collection.json');
    const collectionData = JSON.parse(base64ToStr(res.content));
    collection.value = collectionData;
    collectionSha.value = res.sha || '';
  }

  async function setCollection() {
    const res = await createOrUpdateRepoContent({
      content: JSON.stringify(toRaw(collection.value), null, 2),
      path: 'collection.json',
      sha: collectionSha.value,
      message: 'update collection list',
    });
    collectionSha.value = res.content?.sha || '';
  }

  async function createMermaid(title: string) {
    const res = await createIssue({
      body: '',
      title,
    });
    return res;
  }

  async function updateMermaid(id: string, params: UpdateIssueParams) {
    return updateIssue(Number(id), params);
  }

  async function deleteMermaid(id: string) {
    return deleteIssue(Number(id));
  }

  return {
    content,
    parsedError,
    selectedNode,
    collection,
    initCollection,
    setCollection,
    createMermaid,
    updateMermaid,
    deleteMermaid,
    getMermaid,
  };
}
