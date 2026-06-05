Here’s a practical, modern best-practices checklist for building and publishing an npm library (TypeScript + Node, 2026 style):

✅ 📦 Package structure & publishing
Use a dist/ folder for compiled output; never publish raw src/
Define "files": ["dist"] in package.json to control what gets published
Always run npm pack or npm publish --dry-run before publishing
Include README.md and LICENSE in your package
Keep your package small—avoid shipping tests, configs, or unused assets

✅ 🚪 Module system & exports
Use "exports" to define your public API (don’t rely only on "main")
Support both ESM and CommonJS if building a general-purpose library
Keep exports minimal—only expose what you intend to support long-term
Avoid "./*": "./dist/*" (this breaks encapsulation)
Use "type": "module" unless you have a strong reason not to

✅ 📦 TypeScript setup
Use "module": "nodenext" and "moduleResolution": "nodenext" for Node libraries
Accept .js extensions in imports (import "./foo.js")
Enable "declaration": true to generate .d.ts files
Turn on "strict": true for better type safety
Use "outDir": "dist" and "rootDir": "src"
Add "skipLibCheck": true for faster builds

✅ 🏗️ Build process
Use a bundler like tsup, esbuild, or rollup (don’t rely on tsc alone)
Output both:
ESM (.js)
CJS (.cjs)
Generate type definitions alongside builds
Ensure your build matches your exports paths exactly

✅ 🏷️ Versioning & releases
Follow semantic versioning (semver):
patch → bug fixes
minor → new features
major → breaking changes
Use npm version to:
bump version
create commit
create Git tag
Keep package.json version === Git tag

✅ 🚀 Publishing workflow
Ensure clean repo (git status)
Build project (npm run build)
Verify package (npm pack)
Bump version (npm version patch|minor|major)
Push with tags (git push --tags)
Publish (npm publish)
Optionally create a GitHub release with notes

✅ 🔒 API design
Treat everything not exported as private
Avoid exposing internal file paths
Use stable entry points (your-lib, your-lib/utils)
Think long-term: removing exports = breaking change

✅ ⚡ DX (developer experience)
Provide TypeScript types (types field)
Write a clear README with usage examples
Keep API simple and predictable
Use meaningful function names and exports

✅ 🧪 Quality & safety
Test your built output, not just src/

Try installing your package locally:

npm pack
npm install ./your-lib-1.0.0.tgz
Validate both:
import (ESM)
require (CJS)
✅ ⚙️ Nice-to-have
Add "sideEffects": false for tree-shaking (if safe)
Use peerDependencies for shared libs (e.g., React)
Add "engines" to define supported Node versions
Automate releases with CI (e.g., GitHub Actions)
Consider tools like changesets or semantic-release
🧠 Golden rules
📦 Control what you publish (files)
🚪 Control how it’s consumed (exports)
🏷️ Keep versions, tags, and releases aligned
🔍 Always preview before publishing
🔒 Don’t expose more than you can maintain