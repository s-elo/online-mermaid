import { debounce } from 'lodash';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import { LoadingOptionsResolved, ElLoading } from 'element-plus';
import { TreeData } from '../types';

export function findParentInTree(
  tree: TreeData,
  target: TreeData,
): TreeData | null {
  const children = tree.children;
  if (!children) return null;

  for (const node of children) {
    if (node.id === target.id) {
      return tree;
    }

    const ret = findParentInTree(node, target);
    if (ret) return ret;
  }

  return null;
}

export function sort(nodes: TreeData[]) {
  nodes.sort((a, b) => {
    if (!a.children && b.children) return 1;

    if ((a.children && b.children) || (!a.children && !b.children)) {
      return a.label > b.label ? 1 : -1;
    }

    return -1;
  });
}

class FullLoading {
  private loadingService: ReturnType<typeof ElLoading.service> | null = null;

  start(options: Partial<LoadingOptionsResolved> = {}) {
    this.loadingService = ElLoading.service({
      lock: true,
      background: 'rgba(0, 0, 0, 0.5)',
      ...options,
    });
  }

  close() {
    this.loadingService?.close();
  }
}
export const fullLoading = new FullLoading();

export function asyncDebounce<T extends Function>(fn: T, wait: number) {
  const debounced = debounce((resolve, reject, args) => {
    fn(...args)
      .then(resolve)
      .catch(reject);
  }, wait);
  return (...args: unknown[]) =>
    new Promise((resolve, reject) => {
      debounced(resolve, reject, args);
    }) as unknown as T;
}

export function isFile(node: TreeData) {
  return !node.children;
}

export function isRootNode(node: TreeViewNodeMetaModel, tree: TreeData[]) {
  return tree.find((n) => n.id === node.data.id);
}
