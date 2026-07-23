# Atlas Step

Atlas Step turns Path of Building loadouts into a clickable league-progression checklist. Each loadout has two action lists:

- **Do during this step** for concrete gear, gem, tree, and verification work.
- **Before moving on** for the checks that make a transition safe to complete.

The MVP is focused on the six-loadout Winter Orb transition PoB, from the life-based Elementalist mapping baseline through Occultist, Chaos Inoculation, and the final power-charge setup. Checklist progress and custom actions are saved locally in the browser. Named build copies can be kept in a device-local library, and compressed share links carry a complete portable snapshot in the URL fragment without requiring a backend or account.

Every loadout also lists its equipment, modifier priorities, equipped uniques, exact gem groups, changes from the previous loadout, trade links, and cached poe.ninja market estimates.

## Saved and shared builds

- **Save copy** creates a named build in the browser's local storage.
- Opening a saved build makes it the active copy; checklist changes and the active step then save automatically.
- **Generate link** creates and copies a self-contained link for the current build.
- Opening a share link loads the shared snapshot without changing the recipient's existing saved builds. They can use **Save copy** to keep it.

Clearing browser storage removes saved builds from that device. Share links should be regenerated after making changes that another person needs to receive.

## Stack

- SvelteKit 2 / Svelte 5
- Tailwind CSS 4
- Flowbite Svelte
- `@sveltejs/adapter-static`
- GitHub Pages deployment through GitHub Actions

## Local development

```sh
pnpm install
pnpm dev
```

Quality checks:

```sh
pnpm check
pnpm lint
pnpm build
```

Refresh the local price snapshot and validate unique-item wiki routes:

```sh
node scripts/update-pob-gems.mjs
node scripts/update-pob-equipment.mjs
node scripts/update-pob-uniques.mjs
pnpm prices:update
pnpm wiki:validate
```

`update-pob-gems.mjs` rebuilds each checkpoint's socket groups from its matching PoB skill set.
Run it with `--check` to verify the committed gem data.

`update-pob-equipment.mjs` rebuilds the complete equipped gear and modifier list for every
checkpoint. Run it with `--check` to validate the committed equipment data.

`update-pob-uniques.mjs` decodes the configured pobb.in builds and rebuilds each checkpoint's
unique list from its selected equipment set and matching passive-tree jewel sockets. Run it with
`--check` to verify the committed data without rewriting it.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the static `build/` directory on pushes to `main`. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.

The workflow sets SvelteKit's base path automatically for both project pages (`owner.github.io/repository`) and root user pages (`owner.github.io`).

The same workflow refreshes `static/data/poe-ninja-prices.json` before each deployment and runs hourly so the static site can show current prices without making every visitor call the poe.ninja API. Until the next challenge league is active, poe.ninja's first active economy league may be Standard; the snapshot switches automatically when the league list changes.

Wiki links are derived from each item's name. Variant names that do not have their own page can set a `wikiTitle` override in `src/lib/data/unique-items.json`; `pnpm wiki:validate` checks every resulting title against the public PoE Wiki API.

## MVP boundary

The importer recognizes the supplied transition PoB and loads its real loadout names. The UI and data model are ready for a generic PoB extraction adapter, but arbitrary live `pobb.in` extraction is intentionally left as the next integration because a static GitHub Pages app cannot rely on a same-origin backend.
