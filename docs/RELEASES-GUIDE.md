1) Git tags (the foundation)

A Git tag is just a label pointing to a specific commit.

Example:

git tag v1.2.0
git push origin v1.2.0
Lives in Git only
Immutable reference (shouldn’t move once created)
Used to mark versions like v1.0.0, v2.3.1, etc.

👉 This is the source of truth for version snapshots.

2) GitHub releases (a UI + metadata layer)

A GitHub release is built on top of a Git tag.

When you create a release on GitHub:

It points to a tag (existing or newly created)
Adds:
Release notes
Changelog
Binary assets (zips, builds, etc.)

👉 So:

Every GitHub release = a Git tag + extra info

But:

Not every Git tag has a GitHub release

3) npm versions (package distribution)

In the npm ecosystem, versioning is defined in package.json:

{
  "version": "1.2.0"
}

When you run:

npm version 1.2.0

It actually does 3 things automatically:

Updates package.json
Creates a Git commit
Creates a Git tag (v1.2.0)

Then:

npm publish

uploads that version to npm registry.

👉 So npm versions:

Are tied to semantic versioning (semver)
Usually correspond to a Git tag
Represent what users install (npm install your-lib@1.2.0)
How they connect (the typical flow)

A common real-world workflow:

# 1. Bump version
npm version 1.2.0

# 2. Push commit + tag
git push origin main --tags

# 3. Publish package
npm publish

Then optionally:

Create a GitHub release for v1.2.0
Mental model
Git tag → “This commit is version 1.2.0”
GitHub release → “Here’s a nice page describing version 1.2.0”
npm version → “This is the version users can install”
Key pitfalls (where people get confused)
❌ Changing package.json version without tagging → mismatch
❌ Tag exists but not published to npm → users can’t install it
❌ npm version != Git tag → breaks traceability
❌ GitHub release without npm publish → just documentation
Clean best practice

Keep all three aligned:

package.json version === git tag === github release === npm published version