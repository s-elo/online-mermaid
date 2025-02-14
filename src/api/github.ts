import {
  GithubMeta,
  SearchIssuesParams,
  CreateOrUpdateRepoContentParams,
  GetIssuesParams,
  CreateIssueParams,
  UpdateIssueParams,
} from './type';
import { Octokit } from '@octokit/rest';
import { strToBase64 } from '../utils/common';

let OWNER = '';
let REPO = '';
export function setGithubMeta(meta: GithubMeta) {
  OWNER = meta.owner;
  REPO = meta.repo;
}
export function getGithubMeta(): GithubMeta {
  return {
    owner: OWNER,
    repo: REPO,
  };
}

// TODO auth
const octokit = new Octokit();

export async function searchIssues({
  content = '',
  labels = [],
}: SearchIssuesParams) {
  const labelQuery = labels.length
    ? ` ${labels.map((label) => `label:${label}`).join(' ')}`
    : '';

  return octokit.rest.search
    .issuesAndPullRequests({
      q: `${content} is:issue repo:${OWNER}/${REPO}${labelQuery}`,
    })
    .then((res) => res.data);
}

export async function getIssues(
  params: GetIssuesParams = { pageIndex: 1, pageSize: 10 },
) {
  return octokit.rest.issues
    .listForRepo({
      per_page: params.pageSize,
      page: params.pageIndex,
      owner: OWNER,
      repo: REPO,
    })
    .then((res) => res.data);
}

export async function createIssue(params: CreateIssueParams) {
  return octokit.rest.issues
    .create({
      owner: OWNER,
      repo: REPO,
      ...params,
    })
    .then((res) => res.data);
}

export async function updateIssue(issueNum: number, params: UpdateIssueParams) {
  return octokit.rest.issues
    .update({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNum,
      ...params,
    })
    .then((res) => res.data);
}

export async function getIssue(issueNum: number) {
  return octokit.rest.issues
    .get({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNum,
    })
    .then((res) => res.data);
}

/**
 * @description get repo file content
 * @param path the file path
 */
export async function getRepoContent(path: string) {
  return octokit.rest.repos
    .getContent({
      owner: OWNER,
      repo: REPO,
      path,
    })
    .then((res) => res.data);
}

/**
 *
 * @param path the file path
 * @param content base64 encoded content
 * @param message commit message
 * @param sha the last content sha, need to first get from `getRepoContent` or the last `createOrUpdateRepoContent`
 */
export async function createOrUpdateRepoContent(
  params: CreateOrUpdateRepoContentParams,
) {
  params.content = strToBase64(params.content);

  return octokit.rest.repos
    .createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      ...params,
    })
    .then((res) => res.data);
}
