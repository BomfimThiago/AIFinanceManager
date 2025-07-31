# Konta Project Structure

This document outlines the clean, production-ready structure of the Konta finance management application.

## 📁 Root Directory
```
AIFinanceManager/
├── README.md                 # Main project documentation
├── CLAUDE.md                 # Claude AI assistant instructions
├── Makefile                  # Build and development commands
├── .gitignore               # Git ignore rules
├── backend/                 # FastAPI backend application
├── finance-dashboard/       # React frontend application
└── terraform/              # AWS infrastructure as code
```

## 🔧 Backend (`/backend/`)
```
backend/
├── pyproject.toml          # Python dependencies (uv)
├── uv.lock                 # Dependency lock file
├── run.py                  # Development server entry point
├── Dockerfile              # Container definition
├── docker-compose.yml      # Local development setup
├── alembic.ini            # Database migration config
├── alembic/               # Database migrations
│   ├── versions/          # Migration files
│   └── env.py            # Migration environment
├── scripts/               # Utility scripts
│   ├── format.sh         # Code formatting (ruff)
│   ├── lint.sh           # Code linting (ruff)
│   ├── migrate.sh        # Database migrations
│   ├── init.sql          # Initial database setup
│   ├── populate_category_translations.py
│   └── translate.py      # Translation utilities
└── src/                   # Source code
    ├── main.py           # FastAPI application entry
    ├── config.py         # Application configuration
    ├── database.py       # Database connection
    ├── auth/             # Authentication system
    ├── budgets/          # Budget and goals management
    ├── categories/       # Expense categories
    ├── currency/         # Multi-currency support
    ├── expenses/         # Expense tracking
    ├── insights/         # AI-powered insights
    ├── integrations/     # Bank integrations (Belvo)
    ├── translations/     # Multi-language support
    ├── upload_history/   # File upload tracking
    ├── user_preferences/ # User settings
    ├── core/            # Core utilities
    ├── middleware/      # HTTP middleware
    ├── services/        # External services (AI, Belvo)
    ├── shared/          # Shared utilities
    └── utils/           # Helper functions
```

## 🎨 Frontend (`/finance-dashboard/`)
```
finance-dashboard/
├── package.json            # NPM dependencies
├── package-lock.json       # Dependency lock file
├── vite.config.js         # Vite build configuration
├── tailwind.config.js     # Tailwind CSS config
├── tsconfig.json          # TypeScript configuration
├── index.html             # HTML entry point
├── netlify.toml           # Netlify deployment config
├── _redirects             # Netlify routing rules
├── public/                # Static assets
│   ├── konta-icon.svg    # App icon
│   └── konta-logo.svg    # App logo
└── src/                   # Source code
    ├── main.tsx          # React application entry
    ├── App.tsx           # Main application component
    ├── components/       # React components
    │   ├── auth/        # Authentication UI
    │   ├── charts/      # Data visualization
    │   ├── integrations/ # Bank integration UI
    │   ├── layout/      # Layout components
    │   ├── pages/       # Page components
    │   └── ui/          # Reusable UI components
    ├── contexts/        # React contexts
    ├── hooks/           # Custom React hooks
    │   └── queries/     # TanStack Query hooks
    ├── services/        # API services
    ├── types/           # TypeScript definitions
    ├── utils/           # Utility functions
    └── constants/       # Application constants
```

## ☁️ Infrastructure (`/terraform/`)
```
terraform/
├── README.md              # Terraform documentation
├── main.tf               # Provider configuration
├── variables.tf          # Input variables
├── terraform.tfvars     # Variable values (customize this)
├── outputs.tf           # Output values
├── vpc.tf               # Network infrastructure
├── security_groups.tf   # Security rules
├── ec2.tf              # Application server
├── rds.tf              # Database
├── s3.tf               # File storage
└── user_data.sh        # Server initialization script
```

## 🛠️ Key Files to Configure

### Backend Configuration
- `backend/.env` - Environment variables (create from template)
- `backend/src/config.py` - Application settings

### Frontend Configuration
- `finance-dashboard/.env` - Environment variables (create from template)

### Infrastructure Configuration
- `terraform/terraform.tfvars` - AWS deployment settings

## 🚀 Development Commands

### Backend
```bash
cd backend
uv sync                 # Install dependencies
uv run python run.py    # Start development server
./scripts/lint.sh       # Run linter
./scripts/format.sh     # Format code
./scripts/migrate.sh    # Run database migrations
```

### Frontend
```bash
cd finance-dashboard
npm install             # Install dependencies
npm run dev            # Start development server
npm run build          # Build for production
npm run lint           # Run linter
npm run typecheck      # Type checking
```

### Infrastructure
```bash
cd terraform
terraform init         # Initialize Terraform
terraform plan         # Preview changes
terraform apply        # Deploy infrastructure
```

## 📦 Production Deployment

1. **Frontend**: Deployed on Netlify at `https://getkonta.app`
2. **Backend**: Will be deployed on AWS EC2 at `https://api.getkonta.app`
3. **Database**: AWS RDS PostgreSQL
4. **File Storage**: AWS S3

## 🧹 Cleaned Up Files

The following files were removed during cleanup:
- Duplicate documentation files
- Log files (`*.log`)
- Unused Docker configurations
- Legacy directories
- Development-only scripts
- Backup and temporary files

## 📋 File Count Summary

- **Backend**: ~80 files (core application)
- **Frontend**: ~60 files (React components & hooks)
- **Infrastructure**: 8 files (Terraform configuration)
- **Documentation**: 3 files (README, CLAUDE.md, this file)

Total: ~150 essential files for a production-ready application.