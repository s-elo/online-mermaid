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
