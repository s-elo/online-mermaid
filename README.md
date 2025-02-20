# Online Mermaid

Use github issue to store mermaid charts with organized structure.

## Quick start

### Fork this repo

Fork this repo so that you can setup your own online-mermaid tool.

### Create a repo

Create a repo to store the mermaid charts as issues, then provide the `owner` and `repo name` in `/src/config.json`

```json
{
  "owner": "you",
  "repo": "your mermaid repo"
}
```

you can make it private if you want.

### Setup github ci

- Go to the repo's `settings->pages`: enable the github page from the `main` branch.
- Go to the repo's `settings->Secrets and variables->Actions`: add `MY_API_TOKEN` and `MY_PASSWORD` as `secret keys`
  - `MY_API_TOKEN`: your personal github api access token
  - `MY_PASSWORD`: the password to verify

> To protect the github token at the pure front-end, we firstly symmetricly encrypt the token using the password

After you setup the github ci and run the action, you can visit it at `https://<owner>.github.io/online-mermaid/`

## Develop

### set password

before start this project, you need to generate the encrypted key to auth.

```bash
$ pnpm encrypt [token] [password]
```

### start dev server

```bash
$ pnpm dev
```

### build

```bash
$ pnpm build
```
