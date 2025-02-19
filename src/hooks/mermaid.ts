import { ref, toRaw } from 'vue';
import {
  getRepoContent,
  createOrUpdateRepoContent,
  createIssue,
  updateIssue,
  deleteIssue,
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

  async function updateMermaid(id: number, params: UpdateIssueParams) {
    return updateIssue(id, params);
  }

  async function deleteMermaid(id: number) {
    return deleteIssue(id);
  }

  return {
    content,
    parsedError,
    collection,
    initCollection,
    setCollection,
    createMermaid,
    updateMermaid,
    deleteMermaid,
  };
}
