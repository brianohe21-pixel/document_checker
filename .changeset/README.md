# Changesets

When you change `@certchain/shared` (types, ABI, constants), add a changeset:

```bash
pnpm changeset
```

Select `@certchain/shared` and choose patch / minor / major. Commit the generated file with your PR.

On merge to `main`, the release workflow opens a "Version Packages" PR or publishes to npm when versions are bumped.
