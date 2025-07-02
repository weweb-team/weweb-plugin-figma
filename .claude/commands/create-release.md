# Create Release Command

Create a new GitHub release with auto-generated notes.

## Usage
```
/create-release [nice-name]
```

Examples:
```
/create-release Amélioration de l'expérience utilisateur
/create-release
```

## What this command does:

1. **Generate version tag**: Creates a tag in format `vYYYY.MM.DD` based on current date
   - If a release already exists for today, adds a suffix: `vYYYY.MM.DD.1`, `vYYYY.MM.DD.2`, etc.
2. **Create release title**: Formats as "vYYYY.MM.DD : <nice-name>" (or with suffix if multiple releases)
3. **Auto-generate release notes**: Uses GitHub's auto-generation from last release
4. **Push tag and create release**: Publishes everything to GitHub

## Steps performed:

1. Get current date and format as vYYYY.MM.DD (e.g., v2025.6.19)
2. Check if tag already exists:
   - If v2025.6.19 exists, try v2025.6.19.1
   - If v2025.6.19.1 exists, try v2025.6.19.2
   - Continue incrementing until finding an available tag
3. If no nice name provided, generate one automatically by:
   - Analyzing commits since last release
   - Creating a concise, meaningful title in French
   - Focusing on the main improvements or features
4. Create git tag with: `git tag <version>`
5. Push tag to origin: `git push origin <version>`
6. Create GitHub release with:
   ```bash
   gh release create <version> \
     --title "<version> : <nice-name>" \
     --generate-notes
   ```

## Arguments:
- `$ARGUMENTS`: (Optional) The nice name for the release. If not provided, will be auto-generated based on recent commits.

## Requirements:
- Must be on main branch with clean working directory
- Must have push access to repository
- GitHub CLI (gh) must be authenticated
