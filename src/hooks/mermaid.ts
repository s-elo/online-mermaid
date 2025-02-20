import { ref, toRaw, watch } from 'vue';
import {
  getRepoContent,
  createOrUpdateRepoContent,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssue,
} from '../api/github';
import { TreeData, TabItem } from '../types';
import { base64ToStr } from '../utils/encrypt';
import { UpdateIssueParams } from '../api/type';
import { MarkerData } from '../utils/errorHandler';
import { callAsync } from '../utils/common';

export function useMermaid() {
  const content = ref('');
  const parsedError = ref<{
    error: Error;
    marker?: MarkerData;
  } | null>(null);
  const collectionSha = ref('');
  const collection = ref<TreeData[]>([]);
  const selectedNodeId = ref('');
  const mermaidTabs = ref<TabItem[]>([]);

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
    if (!selectedNodeId.value) return;

    // handle the changes in editor
    const cached = mermaids.get(selectedNodeId.value);
    if (!cached) return;

    cached.local = content.value;
    const tab = mermaidTabs.value.find((t) => t.name === selectedNodeId.value);
    if (!tab) return;

    tab.stale = cached.local !== cached.online;
  });

  async function getMermaid(id: string) {
    selectedNodeId.value = id;
    const cached = mermaids.get(id);
    if (cached) {
      content.value = cached.local;
      return;
    }

    const res = await callAsync(getIssue, Number(id));
    content.value = res.body ?? '';

    mermaids.set(id, {
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
    mermaids.set(String(res.number), {
      local: '',
      online: '',
    });
    return res;
  }

  async function updateMermaid(id: string, params: UpdateIssueParams) {
    await updateIssue(Number(id), params);
    const cached = mermaids.get(id);
    if (cached) {
      cached.online = cached.local;
    }
  }

  async function deleteMermaid(id: string) {
    return deleteIssue(Number(id));
  }

  function syncMermaidCache(id: string, content: string) {
    const cached = mermaids.get(id);
    if (cached) {
      cached.online = cached.local = content;

      const tab = mermaidTabs.value.find((t) => t.name === id);
      if (!tab) return;

      tab.stale = false;
    }
  }

  return {
    content,
    mermaidTabs,
    parsedError,
    selectedNodeId,
    collection,
    initCollection,
    setCollection,
    createMermaid,
    updateMermaid,
    deleteMermaid,
    getMermaid,
    syncMermaidCache,
  };
}
