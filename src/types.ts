import { TreeViewNodeMetaModel } from '@grapoza/vue-tree';

export type TreeData = {
  id: string;
  label: string;
  /** only for dir node */
  children?: TreeData[];
  metaModel?: Partial<TreeViewNodeMetaModel>;
};

export enum OperationType {
  CreateFolder = 'Create Folder',
  CreateFile = 'Create File',
  Drop = 'Drop',
  BackToTop = 'Back To Top',
  Rename = 'Rename',
  Delete = 'Delete',
}
