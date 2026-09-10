# Publishing

## Verify the package

From the repository root:

```bash
bun install
bun run check
npm pack --workspace packages/create-tauri-workspace
```

`bun run check` runs the CLI tests and `bun run verify:package`, which asserts
the tarball's file list and size. If it reports build output, clean
`packages/create-tauri-workspace/templates/default/` before publishing.

Test the resulting tarball:

```bash
npm exec --yes \
  --package ./create-tauri-workspace-0.1.0.tgz \
  -- create-tauri-workspace smoke-app --no-install --no-git
```

## One-time repository setup

Two settings are not in version control and have to be switched on by hand:

1. **GitHub Pages.** Open **Settings → Pages** and set **Source** to
   **GitHub Actions**. Until that is set, `publish-site.yml` runs and fails at
   the deploy step. Once enabled, every push to `main` that touches `site/`
   republishes <https://erchoc.github.io/create-tauri-workspace/>.
2. **Template repository** under **Settings → General**, only if you also want
   GitHub's **Use this template** button. The npm CLI remains the recommended
   path because it substitutes the application name.

## Log in to npm

```bash
npm login
npm whoami
```

The current npm login flow opens a browser. Complete authentication and any
two-factor challenge, then confirm that `npm whoami` prints your username.

## Enable npm two-factor authentication

npm requires account-level 2FA or a granular token that can bypass 2FA for
every package publish, including the first release. For an interactive first
release, enable account 2FA instead of creating a long-lived bypass token:

1. Open your account settings on [npmjs.com](https://www.npmjs.com/).
2. Under **Two-Factor Authentication**, select **Enable 2FA**.
3. Register a passkey or security key, such as Touch ID.
4. **Save the recovery codes in a password manager, not on the machine you
   registered the passkey on.**

After setup, `npm publish` prompts for the configured second factor
automatically.

> **Step 4 is the one that bites.** A passkey is bound to the device or browser
> that created it. Lose that device without the recovery codes and you cannot
> publish, cannot run `npm owner`, and cannot unpublish — the package name is
> stuck with an account you can no longer reach. Recovery then means a support
> ticket and access to the account's registered email address. See
> [recovering a 2FA-enabled account](https://docs.npmjs.com/recovering-your-2fa-enabled-account).
>
> Keep the publishing account's email address one you will still control in
> five years, and store the recovery codes somewhere that survives losing the
> laptop.

## Publish to npm

```bash
npm run publish
```

The script requires a clean `main` branch synchronized with `origin/main`, runs
the test and package checks, verifies npm authentication and account 2FA, and
ensures the version is not already present in the registry. It publishes only
when you press Enter at the final confirmation prompt. Any other input cancels.

To exercise the same flow without uploading a package:

```bash
npm run publish -- --dry-run
```

Verify the public package:

```bash
npm view create-tauri-workspace

verification_directory=$(mktemp -d)
cd "$verification_directory"
npx create-tauri-workspace published-smoke-app --no-install --no-git
```

Run the `npx` verification outside this monorepo so npm does not prefer the
local workspace with the same package name.

For later releases, update the package version first:

```bash
npm version patch \
  --workspace packages/create-tauri-workspace \
  --no-git-tag-version

git add packages/create-tauri-workspace/package.json
git commit -m "chore: release create-tauri-workspace"
git push

npm run publish
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
