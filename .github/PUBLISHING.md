# Publishing Extensions

Auto-publish workflow for independent extension releases.

## Publishing Process

### Automatic (Git Tags)

1. Update version in extension's `package.json`
2. Commit changes
3. Create and push tag:
   ```bash
   git tag dynamic-json/v1.0.0
   git push origin dynamic-json/v1.0.0
   ```

Workflow will:
- Build extension
- Generate changelog from commits
- Publish to npm as `directus-dynamic-json`
- Create GitHub release with tarball
- Directus Marketplace auto-detects via keywords

### Manual (GitHub UI)

1. Go to Actions → Publish Extension → Run workflow
2. Enter:
   - Extension name (e.g., `dynamic-json`)
   - Version (e.g., `1.0.0`)
   - Optional: Check dry-run to test

## Tag Format

`{extension-name}/v{version}`

Examples:
- `dynamic-json/v1.0.0`
- `dynamic-json/v1.0.1-beta`
- `another-extension/v0.1.0`

## Changelog

Auto-generated from git commits between releases for that extension's `packages/{name}` directory.
