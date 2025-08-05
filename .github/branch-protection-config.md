# Branch Protection Configuration

This document outlines the required branch protection rules for this repository.

## Main Branch Protection Rules

The following settings should be configured for the `main` branch in GitHub repository settings:

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging

**Required status checks:**
- `Backend Tests & Linting`
- `Frontend Tests & Linting` 
- `Security & Dependency Checks`
- `Quality Gate`
- `PR Validation`
- `Code Coverage Report`
- `Dependency Review`

### Pull Request Requirements
- [x] Require a pull request before merging
- [x] Require approvals: **1** (Solo contributor - can self-approve)
- [x] Dismiss stale reviews when new commits are pushed
- [ ] Require review from code owners: **Disabled** (Solo contributor)
- [x] Require approval of the most recent reviewable push

### Additional Restrictions
- [x] Restrict pushes that create files: **Enabled**
- [x] Restrict force pushes: **Enabled** 
- [x] Allow force pushes by: **Nobody**
- [x] Restrict deletions: **Enabled**

### Administrative Settings
- [x] Include administrators: **Enabled** (Admins must follow the same rules)
- [x] Allow specified actors to bypass required pull requests: **Disabled**

### Solo Contributor Notes
Since you're the only contributor, you can:
- Create PRs from your feature branches
- Self-approve your own PRs after all automated checks pass
- Merge your own PRs once approved and all status checks are green

This setup maintains code quality through automation while allowing you to work efficiently as a solo developer.

## Develop Branch Protection Rules (Optional)

For the `develop` branch, you may want similar but slightly relaxed rules:

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging

**Required status checks:**
- `Backend Tests & Linting`
- `Frontend Tests & Linting`
- `Quality Gate`

### Pull Request Requirements
- [x] Require a pull request before merging
- [x] Require approvals: **1**
- [x] Dismiss stale reviews when new commits are pushed

## How to Apply These Settings

1. Go to your GitHub repository
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit existing rule for `main`
4. Configure the settings as outlined above
5. Save the branch protection rule

## Additional Repository Settings

### General Settings
- Default branch: `main`
- Allow merge commits: **Enabled**
- Allow squash merging: **Enabled** 
- Allow rebase merging: **Disabled**
- Automatically delete head branches: **Enabled**

### Security Settings
- Enable vulnerability alerts: **Enabled**
- Enable automated security fixes: **Enabled** 
- Enable private vulnerability reporting: **Enabled**

### Code Security and Analysis
- CodeQL analysis: **Enabled**
- Secret scanning: **Enabled**
- Push protection for secrets: **Enabled**
- Dependency graph: **Enabled**

## Enforced Commit Message Format

The PR validation workflow enforces semantic commit messages with these types:
- `feat`: New features
- `fix`: Bug fixes  
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Example valid commit messages:**
- `feat: add user authentication system`
- `fix: resolve currency conversion bug`  
- `docs: update API documentation`
- `test: add unit tests for insights service`

## Workflow Status Badge

Add this badge to your README.md to show build status:

```markdown
[![CI](https://github.com/yourusername/AIFinanceManager/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/AIFinanceManager/actions/workflows/ci.yml)
```