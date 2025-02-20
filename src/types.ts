export type TreeData = {
  id: string;
  label: string;
  /** only for dir node */
  children?: TreeData[];
  extra?: Record<string, string>;
};

export enum OperationType {
  CreateFolder = 'Create Folder',
  CreateFile = 'Create File',
  Drop = 'Drop',
  BackToTop = 'Back To Top',
  Rename = 'Rename',
  Delete = 'Delete',
}

export type TabItem = { title: string; name: string; stale?: boolean };
