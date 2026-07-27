# Publishing

## 1. Verify the package

From the repository root:

`bash
bun install
bun run check
npm pack --workspace packages/create-tauri-workspace
`

Test the resulting tarball before publishing:

`bash
npm exec --yes \
  --package ./create-tauri-workspace-0.1.0.tgz \
  -- create-tauri-workspace smoke-app --no-install --no-git
`

## 2. Publish the GitHub repository

`bash
git init
git add .
git commit -m "feat: initialize create-tauri-workspace"
git branch -M main
gh repo create erchoc/create-tauri-workspace \
  --public \
  --source . \
  --remote origin \
  --push
`

To enable GitHub's **Use this template** button, open the repository settings
and enable **Template repository**. The npm CLI is still the recommended path
because it replaces the application name automatically.

## 3. Log in to npm

`bash
npm login
npm whoami
`

`npm login` opens a browser for current npm authentication flows. Complete
the account and two-factor-authentication steps there, then confirm that
`npm whoami` prints your npm username.

## 4. Publish the npm package

The first release is:

`bash
npm publish --workspace packages/create-tauri-workspace --access public
`

Verify the public registry and execute a real generation:

`bash
npm view create-tauri-workspace
npx create-tauri-workspace published-smoke-app --no-install --no-git
`

For later releases, update the package version first:

`bash
npm version patch --workspace packages/create-tauri-workspace
npm publish --workspace packages/create-tauri-workspace --access public
`

Use `minor` or `major` instead of `patch` when the change warrants it.

## Optional automated publishing

The included `publish-npm.yml` workflow publishes when a GitHub Release is
published. Configure npm trusted publishing for the repository, or add an
`NPM_TOKEN` repository secret if your npm policy still uses tokens.
