# Atlas Step

Atlas Step turns Path of Building loadouts into a clickable league-progression guide. Each loadout has two goal lists:

- **During this step** for active upgrades and progression work.
- **Before next step** for the conditions that make a transition complete.

The MVP ships with the two Winter Orb Elementalist PoBs used to shape the project. Progress and custom goals are saved locally in the browser.

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

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the static `build/` directory on pushes to `main`. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.

The workflow sets SvelteKit's base path automatically for both project pages (`owner.github.io/repository`) and root user pages (`owner.github.io`).

## MVP boundary

The importer recognizes the two supplied PoB links and loads their real loadout names. The UI and data model are ready for a generic PoB extraction adapter, but arbitrary live `pobb.in` extraction is intentionally left as the next integration because a static GitHub Pages app cannot rely on a same-origin backend.
