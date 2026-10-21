# Releasing cartis

Every cartis version is published the same way: one dedicated release commit on `main`, one GitHub release whose tag
points at exactly that commit, and the `Release` workflow publishing it to npm. Nothing is published from a laptop.

The four things below always agree, and the release workflow refuses to publish when they don't:

| What                    | Example                       |
| ----------------------- | ----------------------------- |
| `package.json` version  | `0.7.0`                       |
| Release commit subject  | `chore(release): v0.7.0 (#9)` |
| Git tag / release title | `v0.7.0`                      |
| npm version             | `cartis@0.7.0`                |

## Choosing the version

cartis follows [semantic versioning](https://semver.org/). While on `0.x`, the minor number carries breaking changes:

- **Patch** (`0.6.0` → `0.6.1`): bug fixes only, no API change.
- **Minor** (`0.6.1` → `0.7.0`): new features, and any breaking change.
- **Prerelease** (`0.7.0-beta.1`): a version to try out before the real one. Published under npm's `beta` dist-tag,
  so `npm install cartis` keeps installing the latest stable version.

From `1.0.0` the usual rules apply: breaking changes bump the major number, features the minor, fixes the patch.

## The release commit

A version bump always gets its own commit and its own pull request. Feature and fix pull requests never touch the
`version` field; it changes only in a release pull request, which changes nothing else.

1. Start from an up-to-date `main` with every change meant for the release already merged.
2. Bump the version in both `package.json` and `package-lock.json`, without letting npm commit or tag:

   ```bash
   npm version 0.7.0 --no-git-tag-version
   ```

3. Commit it with exactly this subject and no body:

   ```
   chore(release): v0.7.0
   ```

4. Open a pull request with the same title, `chore(release): v0.7.0`, and **squash-merge** it so the commit on `main`
   keeps that subject (GitHub appends the PR number, which is fine).

CI checks a release pull request: when a pull request changes the version, its title has to be
`chore(release): v<new version>` and it may only change `package.json` and `package-lock.json`.

## The tag and the GitHub release

Tags are only ever created through a GitHub release, never pushed by hand.

1. Open [a new release](https://github.com/xavier-batista-fernandes/cartis/releases/new).
2. **Tag:** type `v0.7.0` and choose *Create new tag on publish*.
3. **Target:** the release commit. Pick `main` only if the release commit is still its latest commit; otherwise pick
   the release commit itself under *Recent commits*.
4. **Title:** `v0.7.0`, the tag and nothing else.
5. **Notes:** see [Release notes](#release-notes) below.
6. Tick **Set as a pre-release** for a `-beta.N` version, otherwise leave **Set as the latest release** ticked.
7. Publish. Creating the tag starts the `Release` workflow (`.github/workflows/release.yml`), which checks that:
   - the tag matches the `package.json` version,
   - the tagged commit is a release commit for that version (`chore(release): v0.7.0`),
   - the tagged commit is on `main`,

   then lints, builds, checks the package contents and publishes to npm with provenance.

If the workflow fails before *Publish*, nothing reached npm: delete the release and its tag, fix the cause, and create
the release again. A version that did reach npm can never be republished; fix it forward with a new patch release.

## Release notes

### While on 0.x

Leave the notes **empty**. The version is all a release says; what changed lives in the merged pull requests.

### From 1.0.0

Once cartis has real users, every release explains itself. Write the notes in this shape, keeping only the sections
that have entries and linking each entry to its pull request:

```markdown
## Breaking changes

- `CountryMap.create()` now rejects when the container has no size, instead of drawing an empty map. (#42)
  **Migrating:** give the container a size before calling `create()`.

## Added

- `fitToDistricts()` accepts a `padding` option. (#40)

## Changed

- Hover styles fade over 150ms instead of 300ms. (#41)

## Deprecated

- `styleDistricts()` with a `strokeWidth` of `0`; use the new `blend` option. Removed in 2.0.0. (#43)

## Fixed

- `destroy()` no longer throws when called twice. (#39)

**Full changelog:** https://github.com/xavier-batista-fernandes/cartis/compare/v1.0.0...v1.1.0
```

Write each entry for someone using the library, not for someone reading the diff: what they can now do or what
behaves differently, never which internal file moved. Every breaking change carries a **Migrating:** line telling them
what to change in their own code. Pull requests that only touch tests, CI or docs don't get an entry.
