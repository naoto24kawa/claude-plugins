# Git Worktree Best Practices and Patterns

## Overview

Git worktrees allow multiple working directories to be attached to the same repository, enabling parallel work on different branches without the overhead of cloning or constant branch switching.

## Directory Structure Patterns

### Recommended Layout

```
project-repo/           # Main repository (can be bare or regular)
├── main/              # Primary worktree (main/master branch)
├── feature-xxx/       # Feature branch worktree
├── hotfix-yyy/        # Hotfix worktree
└── experimental-zzz/  # Experimental worktree
```

### Alternative: Bare Repository Pattern

```
project-repo.git/      # Bare repository
├── worktrees/
│   ├── main/
│   ├── feature-xxx/
│   └── hotfix-yyy/
```

## Naming Conventions

### Worktree Directory Names

- **Feature branches**: `feature-<description>` or `feat-<ticket-id>`
- **Bug fixes**: `bugfix-<description>` or `fix-<ticket-id>`
- **Hotfixes**: `hotfix-<version>` or `hotfix-<issue>`
- **Releases**: `release-<version>`
- **Experiments**: `experimental-<name>` or `exp-<name>`

### Branch Names

Follow the same naming convention as worktree directories for consistency:
- `feature/user-authentication`
- `bugfix/memory-leak`
- `hotfix/security-patch`
- `release/v2.0.0`

## Common Workflows

### Feature Development Workflow

1. Create a new worktree for the feature:
   ```bash
   git worktree add ../feature-user-auth -b feature/user-auth
   ```

2. Work in the feature worktree:
   ```bash
   cd ../feature-user-auth
   # Make changes, commit, test
   ```

3. When complete, remove the worktree:
   ```bash
   git worktree remove ../feature-user-auth
   # or from another worktree:
   git worktree remove feature-user-auth
   ```

### Hotfix Workflow

1. Create worktree from production branch:
   ```bash
   git worktree add ../hotfix-security -b hotfix/security-patch origin/production
   ```

2. Apply fix and test:
   ```bash
   cd ../hotfix-security
   # Fix, test, commit
   ```

3. Merge to production and main:
   ```bash
   git push origin hotfix/security-patch
   # Create PR or merge directly
   ```

4. Clean up:
   ```bash
   git worktree remove ../hotfix-security
   git branch -d hotfix/security-patch
   ```

### Parallel Review Workflow

When reviewing multiple PRs simultaneously:

```bash
# Review PR #123
git worktree add ../review-pr-123 pr-123

# Review PR #456
git worktree add ../review-pr-456 pr-456

# Work in each directory independently
```

## Best Practices

### Do's

1. **Keep worktrees short-lived**: Remove worktrees when work is complete
2. **Use descriptive names**: Make it easy to identify the purpose
3. **Maintain one worktree per task**: Avoid mixing concerns
4. **Regular cleanup**: Run `git worktree prune` periodically
5. **Document active worktrees**: Keep a README or use `git worktree list`

### Don'ts

1. **Don't nest worktrees**: Keep them at the same directory level
2. **Don't share worktrees**: Each developer should have their own
3. **Don't forget to clean up**: Remove both worktree and branch when done
4. **Don't use worktrees for long-term parallel development**: Consider separate clones instead
5. **Don't check out the same branch in multiple worktrees**: Git prevents this by default

## Common Pitfalls and Solutions

### Orphaned Worktrees

**Problem**: Manually deleted worktree directory without using `git worktree remove`

**Solution**:
```bash
git worktree prune
```

### Locked Worktrees

**Problem**: Worktree shows as locked in `git worktree list`

**Solution**:
```bash
git worktree unlock <path>
# or force remove
git worktree remove --force <path>
```

### Disk Space Issues

**Problem**: Multiple worktrees consuming significant disk space

**Solution**:
- Use `git worktree prune` to clean up metadata
- Remove unused worktrees with `git worktree remove`
- Consider using sparse checkouts for large repositories

## Advanced Patterns

### Bare Repository Setup

For teams working exclusively with worktrees:

```bash
# Clone as bare repository
git clone --bare <url> project.git
cd project.git

# Create worktrees for different branches
git worktree add worktrees/main main
git worktree add worktrees/develop develop
```

### Sparse Worktrees

For large monorepos:

```bash
git worktree add --no-checkout ../feature-api feature/api
cd ../feature-api
git sparse-checkout init --cone
git sparse-checkout set packages/api
```

### Temporary Worktrees

For quick experiments or builds:

```bash
# Create temporary worktree
git worktree add --detach ../temp-build HEAD

# Do work...

# Remove when done
git worktree remove ../temp-build
```

## Integration with CI/CD

### CI Pipeline Considerations

- Worktrees share the same `.git` directory
- Each worktree can run independent builds
- Clean up worktrees in CI `after` scripts
- Use `--detach` for disposable CI worktrees

### Example CI Pattern

```bash
# In CI script
git worktree add --detach build-$CI_JOB_ID $CI_COMMIT_SHA
cd build-$CI_JOB_ID
# Run tests, build, etc.
cd ..
git worktree remove build-$CI_JOB_ID
```

## Troubleshooting

### List All Worktrees

```bash
git worktree list
```

### Check Worktree Details

```bash
git worktree list --porcelain
```

### Repair Corrupted Worktrees

```bash
git worktree repair
```

### Force Remove Stubborn Worktrees

```bash
git worktree remove --force <path>
```

## Performance Considerations

- **Faster than cloning**: Shares object database
- **Faster than branch switching**: No need to update working directory
- **Memory efficient**: Shares `.git` directory
- **I/O overhead**: Multiple worktrees = multiple file system operations

## Migration Guide

### From Branch Switching to Worktrees

Before (traditional workflow):
```bash
git checkout main
# Do work
git checkout feature-branch
# Do work
git checkout main
```

After (worktree workflow):
```bash
cd ~/projects/myapp-main        # Main worktree
# Do work

cd ~/projects/myapp-feature     # Feature worktree
# Do work

cd ~/projects/myapp-main        # Switch back instantly
```

## References

- Official Git documentation: `git help worktree`
- Git worktree blog posts and tutorials
- Team-specific conventions (add your team's guidelines here)
