# Commit and Push Command

Please commit the changes to the repository and push them to the remote branch: $ARGUMENTS

Follow this comprehensive commit and push workflow:

## 1. Testing

- Run pnpm test and fix any failing tests
- Update snapshots if needed with pnpm vitest run <test-file> -u

## 2. Linting

- Run pnpm lint:fix and fix any issues
- Run pnpm typecheck and fix any issues

## 3. Commit Message

- Commit the changes with a clear message that describes the changes

## 4. Push to Remote

- Push the committed changes to the remote branch
