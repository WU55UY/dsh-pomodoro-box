# Contributing

Thanks for helping out. This plugin ships as a single `client.js` with **no build step**, so most fixes are small and easy to review.

## Before opening a PR

- Read the [开发 / Dev section of the README](README.md#开发). `client.js` is the shipped artifact, not source that gets compiled.
- **Keep both dictionaries in sync.** The runtime `EN` / `ZH` objects in `client.js` drive the UI; `locale/en.json` / `locale/zh.json` drive the plugin list in the Host. Change all four when you touch any copy.
- **New files must be listed in `package.json` → `files`**, otherwise they never reach the npm tarball.
- Use `--dsw-alias-*` theme tokens or the plugin's own `--dsh-pomo-*` variables. Confirm a token exists in the Harness theme before adding it; hardcoded colours break dark mode.
- `window.__ModuleLoader__.load({ id })` in `client.js` must stay equal to the package name.

## Test locally

```sh
dsh plugin --profile desktop add .      # install the cloned folder as a bundle
```

Then enable it in **Settings → Plugins** and reload the page. Disabling and re-enabling the plugin is enough to pick up a changed `client.js` (HMR may do it automatically).

To regenerate the README previews from the real component:

```sh
python3 tools/render-preview.py          # macOS + Microsoft Edge + Pillow
python3 tools/render-preview.py --reassemble   # re-quantize the GIF from existing frames
```

## Report a bug

Use the issue template and include: Harness version, profile name (`desktop` / `web`), browser, and the exact steps. State whether the timer or only the blind box misbehaves — they are separate state machines.

## Releases

Version bumps touch `package.json`, `CHANGELOG.md`, README install examples and `market/index.json` (`node market/build-index.mjs --source npm`). Only maintainers publish to npm; please do not open a PR just to bump the version.

By contributing you agree that your changes are released under the [MIT License](LICENSE).
