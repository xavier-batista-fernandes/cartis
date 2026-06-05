# TODO

This file tracks follow-up work discussed after `v0.1.0`.

None of the items below are implemented yet. This is only a reminder list.

## Docs / npm page

- Rewrite `README.md` for npm users.
- Add an installation section.
- Add a quickstart example.
- Add a realistic usage example for the current public API.
- Document that the consumer must provide a container `HTMLElement`.
- Document that the container needs explicit dimensions for the map to render correctly.
- Document the current scope clearly: Portugal is the only supported geography for now.
- Add an API overview for `CountryMap` and `Country`.
- Add examples for styling municipalities and districts.
- Keep the early-stage / `0.x` warning in the docs, but make it clearer and more intentional.

## CountryMap API / runtime behavior

- Decide how the library should expose map readiness/loading state.
- Review the async constructor behavior via `initMap()` and decide whether the current pattern is acceptable.
- Ensure consumers cannot easily call styling methods before the map is ready, or define/document that behavior clearly.
- Review default option handling so optional fields are accessed safely.
- Review `MapOptions` and `StyleOptions` usage for missing/null/undefined cases.
- Remove or reconsider debug `console.log` calls in library runtime code.
- Review whether the current public methods on `CountryMap` are the right minimum API.

## Public package surface

- Reconfirm that the intended public surface is only `CountryMap` and `Country`.
- Keep `CountryData` out of the public API unless it gets a clear purpose.
- Decide whether `CountryData` should be deleted, kept internal, or redesigned later.
- Reconfirm whether any additional root exports are actually needed before adding them.

## Package metadata / distribution

- Decide whether to add `main` back to `package.json` in addition to `exports` and `types` for broader tooling compatibility.
- Review whether the current `exports` definition is sufficient for intended consumers.
- Review npm metadata quality in `package.json`.
- Consider adding better package metadata later, such as repository info, bugs URL, and keywords.

## Verification / quality

- Add at least one lightweight verification path before future releases.
- Decide whether that verification should be tests, a smoke test, an example consumer, or another minimal validation approach.
- Make sure the release process includes build verification and package dry-run verification.

## Release planning

- Before the next release, make sure docs and basic runtime behavior are in a better state.
- Decide whether the next public release should be `0.2.0` rather than `0.1.1`.
- If releasing, make sure the release notes clearly explain what changed since `v0.1.0`.
