# Publishing

## Verify the package

From the repository root:

```bash
bun install
bun run check
npm pack --workspace packages/create-tauri-workspace
```

Test the resulting tarball:

```bash
npm exec --yes \
  --package ./create-tauri-workspace-0.1.0.tgz \
  -- create-tauri-workspace smoke-app --no-install --no-git
```

## Publish the GitHub repository

```bash
gh repo create erchoc/create-tauri-workspace \
  --public \
  --source . \
  --remote origin \
  --push
```

Enable **Template repository** under **Settings → General** if you also want
GitHub's **Use this template** button. The npm CLI remains the recommended path
because it replaces the application name.

## Log in to npm

```bash
npm login
npm whoami
```

The current npm login flow opens a browser. Complete authentication and any
two-factor challenge, then confirm that `npm whoami` prints your username.

## Publish to npm

```bash
npm publish --workspace packages/create-tauri-workspace --access public
```

Verify the public package:

```bash
npm view create-tauri-workspace
npx create-tauri-workspace published-smoke-app --no-install --no-git
```

For later releases, update the package version first:

```bash
npm version patch --workspace packages/create-tauri-workspace
npm publish --workspace packages/create-tauri-workspace --access public
```

Use `minor` or `major` instead of `patch` when the change warrants it.

## Enable token-free automated publishing

After the first version exists on npm, configure this repository as its trusted
publisher. With npm 11.5.1 or newer, you can run:

```bash
npm trust github create-tauri-workspace \
  --repo erchoc/create-tauri-workspace \
  --file publish-npm.yml \
  --allow-publish \
  --yes
```

You can also configure the same values on the npm package settings page. The
included `publish-npm.yml` workflow then publishes from a GitHub Release through
short-lived OIDC credentials. No `NPM_TOKEN` repository secret is required, and
npm adds provenance automatically for this public repository.
