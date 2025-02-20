import { debounce } from 'lodash';
import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';
import {
  LoadingOptionsResolved,
  ElLoading,
  ElMessage,
  ElMessageBox,
} from 'element-plus';
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
    if (isFile(a) && !isFile(b)) return 1;

    if ((!isFile(a) && !isFile(b)) || (isFile(a) && isFile(b))) {
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

export async function confirm(msg: string) {
  try {
    await ElMessageBox.confirm(msg);
  } catch {
    return false;
  }

  return true;
}

/**
 * with loading and error message
 */
export async function callAsync<T extends (...args: any) => any>(
  fn: T,
  ...args: Parameters<T>
): Promise<ReturnType<T>> {
  fullLoading.start();
  let ret = null as ReturnType<T>;
  try {
    ret = await fn(...args);
  } catch (err) {
    ElMessage({
      message: (err as Error).message,
      type: 'error',
    });
  } finally {
    fullLoading.close();
  }

  return ret;
}

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
