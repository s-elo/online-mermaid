export type UpdateIssueParams = {
  title?: string;
  body?: string;
};

export type CreateIssueParams = {
  title: string;
  body: string;
};

export type SearchIssuesParams = {
  content?: string;
  labels?: string[];
  date?: number;
};

export type GetIssuesParams = {
  pageIndex?: number;
  pageSize?: number;
};

export type CreateOrUpdateRepoContentParams = {
  /** file path */
  path: string;
  /** base64 */
  content: string;
  sha: string;
  /** commit message */
  message: string;
};
