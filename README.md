# Atlas Step

Atlas Step turns Path of Building loadouts into a clickable league-progression guide. Each loadout has two goal lists:

- **During this step** for active upgrades and progression work.
- **Before next step** for the conditions that make a transition complete.

The MVP ships with the two Winter Orb Elementalist PoBs used to shape the project. Progress and custom goals are saved locally in the browser. Named build copies can be kept in a device-local library, and compressed share links carry a complete portable snapshot in the URL fragment without requiring a backend or account.

Every loadout also lists its equipped uniques, links directly to a pre-filled Path of Exile trade search, and displays a cached poe.ninja market estimate. The primary build includes timestamped checkpoint briefings distilled from the supplied Zizaran and Fubgun video guides.

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
node scripts/update-pob-uniques.mjs
pnpm prices:update
pnpm wiki:validate
```

`update-pob-uniques.mjs` decodes the configured pobb.in builds and rebuilds each checkpoint's
unique list from its selected equipment set and matching passive-tree jewel sockets. Run it with
`--check` to verify the committed data without rewriting it.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the static `build/` directory on pushes to `main`. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.

The workflow sets SvelteKit's base path automatically for both project pages (`owner.github.io/repository`) and root user pages (`owner.github.io`).

The same workflow refreshes `static/data/poe-ninja-prices.json` before each deployment and runs hourly so the static site can show current prices without making every visitor call the poe.ninja API. Until the next challenge league is active, poe.ninja's first active economy league may be Standard; the snapshot switches automatically when the league list changes.

Wiki links are derived from each item's name. Variant names that do not have their own page can set a `wikiTitle` override in `src/lib/data/unique-items.json`; `pnpm wiki:validate` checks every resulting title against the public PoE Wiki API.

## MVP boundary

The importer recognizes the two supplied PoB links and loads their real loadout names. The UI and data model are ready for a generic PoB extraction adapter, but arbitrary live `pobb.in` extraction is intentionally left as the next integration because a static GitHub Pages app cannot rely on a same-origin backend.
