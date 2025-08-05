# CI/CD Pipeline Guide

This repository uses GitHub Actions for continuous integration and deployment. All changes must pass automated checks before being merged to the main branch.

## 🛡️ Branch Protection

### Main Branch Rules
- **Direct commits to main are PROHIBITED**
- All changes must go through Pull Requests
- Minimum 2 reviewers required
- All status checks must pass
- Branch must be up-to-date before merging

### Required Status Checks
✅ Backend Tests & Linting  
✅ Frontend Tests & Linting  
✅ Security & Dependency Checks  
✅ Quality Gate  
✅ PR Validation  
✅ Code Coverage Report  
✅ Dependency Review  

## 🔄 Workflow Overview

### 1. Continuous Integration (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests

**Backend Pipeline:**
- Python 3.12 setup with uv package manager
- PostgreSQL test database setup
- Install dependencies with `uv sync`
- Run linting with `./scripts/lint.sh --check`
- Run type checking with mypy
- Execute test suite with pytest
- Generate test reports

**Frontend Pipeline:**
- Node.js 20 setup with npm caching
- Install dependencies with `npm ci`
- Run ESLint for code quality
- Run TypeScript type checking
- Execute test suite (when available)
- Build production bundle

**Security Checks:**
- Trivy vulnerability scanner
- Dependency vulnerability assessment
- SARIF report upload to GitHub Security

**Integration Tests:**
- Full stack integration testing
- Database migration verification
- API endpoint validation

### 2. Pull Request Checks (`pr-checks.yml`)
**Triggers:** PR opened, synchronized, reopened

**Validations:**
- Semantic commit message format
- PR title and description quality
- Breaking change detection
- PR size analysis (warns on large PRs)
- Code coverage reporting
- Dependency security review

**Automated Comments:**
- Large PR warnings
- Breaking change notifications
- Coverage reports with Codecov integration

### 3. Release Workflow (`release.yml`)
**Triggers:** Tags starting with 'v', push to main

**Release Process:**
- Automated changelog generation
- GitHub release creation with installation instructions
- Staging deployment pipeline
- Production deployment (on version tags)

### 4. Dependency Management (`dependency-updates.yml`)
**Triggers:** Weekly schedule (Mondays 9 AM UTC), Manual dispatch

**Automated Updates:**
- Python dependencies via uv
- Node.js dependencies via npm
- Security vulnerability fixes
- Automated PR creation for updates
- Critical vulnerability issue creation

## 🚀 Development Workflow

### Standard Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feat/your-feature-name
   ```
   - Create PR through GitHub UI
   - Add descriptive title and description
   - Link related issues
   - Request reviewers

4. **PR Review Process**
   - Automated checks run (CI pipeline)
   - Code review by team members
   - Address feedback and update PR
   - All checks must pass ✅

5. **Merge to Main**
   - Squash and merge recommended
   - Delete feature branch after merge
   - Automated deployment to staging

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```
feat: add user authentication system
fix: resolve currency conversion rounding bug
docs: update API documentation with new endpoints
test: add unit tests for insights service
```

## 🔧 Local Development Setup

### Backend Testing
```bash
cd backend
uv sync --dev
./scripts/lint.sh  # Run linting
uv run python -m pytest tests/ -v  # Run tests
```

### Frontend Testing
```bash
cd finance-dashboard
npm install
npm run lint  # Run linting
npm run typecheck  # Type checking
npm test  # Run tests
npm run build  # Build production
```

## 📊 Quality Gates

### Code Coverage
- Minimum 70% code coverage required
- Coverage reports generated with pytest-cov
- Results uploaded to Codecov
- Coverage trends tracked in PRs

### Code Quality Standards
- **Backend:** Ruff linting + mypy type checking
- **Frontend:** ESLint + TypeScript strict mode
- **Security:** Trivy vulnerability scanning
- **Dependencies:** Automated security audits

### Performance Requirements
- Backend tests must complete in < 5 minutes
- Frontend build must complete in < 3 minutes
- Integration tests must complete in < 10 minutes

## 🚨 Security & Compliance

### Automated Security Checks
- **Dependency scanning** for known vulnerabilities
- **Secret scanning** to prevent credential leaks
- **Code analysis** with CodeQL
- **Container scanning** with Trivy

### Security Incident Response
1. Critical vulnerabilities trigger automatic issues
2. Security patches get high priority review
3. Emergency hotfix process available
4. Security advisories published for major issues

## 🎯 Monitoring & Observability

### CI/CD Metrics
- Build success/failure rates
- Test execution times
- Deployment frequency
- Lead time for changes

### Alerts & Notifications
- Failed builds notify team immediately
- Security vulnerabilities create high-priority issues
- Large PRs get automated warnings
- Breaking changes require team coordination

## 🛠️ Troubleshooting

### Common Issues

**❌ Tests failing locally but passing in CI**
- Check Python/Node.js versions match CI
- Ensure database migrations are up to date
- Verify environment variables are set correctly

**❌ Linting errors**
```bash
# Backend
cd backend && ./scripts/lint.sh --fix

# Frontend  
cd finance-dashboard && npm run lint -- --fix
```

**❌ Type checking errors**
```bash
# Backend
cd backend && uv run python -m mypy src/

# Frontend
cd finance-dashboard && npm run typecheck
```

**❌ Dependency conflicts**
```bash
# Backend - regenerate lock file
cd backend && rm uv.lock && uv sync

# Frontend - clean install
cd finance-dashboard && rm -rf node_modules package-lock.json && npm install
```

### Getting Help

1. Check workflow logs in GitHub Actions tab
2. Review failed check details in PR status
3. Consult this guide and CLAUDE.md
4. Ask team members for assistance
5. Create issue for persistent CI/CD problems

## 📈 Continuous Improvement

### Metrics to Track
- Build time optimization
- Test coverage improvements
- Security vulnerability resolution time
- Developer productivity metrics

### Regular Reviews
- Monthly CI/CD pipeline review
- Quarterly security audit
- Annual tooling evaluation
- Feedback collection from development team