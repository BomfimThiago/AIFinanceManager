# AI Finance Manager

A comprehensive full-stack AI-powered personal finance management system built with React TypeScript frontend and FastAPI Python backend. Track expenses, manage budgets, and gain financial insights through artificial intelligence.

## 🏗️ Project Architecture

This is a modern full-stack application with clear separation of concerns:

```
AIFinanceManager/
├── finance-dashboard/          # React TypeScript Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks & TanStack Query
│   │   ├── services/         # API communication
│   │   ├── types/            # TypeScript definitions
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── README.md
├── backend/                   # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Configuration
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── pyproject.toml
│   └── README.md
├── CLAUDE.md                  # Development guidelines
└── README.md                  # This file
```

## ✨ Features

### 🚀 **Frontend Dashboard**
- 📊 Real-time financial dashboard with interactive charts
- 📸 AI-powered receipt processing and expense extraction
- 💰 Intelligent expense categorization and tracking
- 🎯 Budget creation and monitoring with visual progress
- 🧠 Personalized financial insights and recommendations
- 📱 Responsive design with privacy controls

### ⚡ **Backend API**
- 🔥 High-performance FastAPI with async/await
- 🤖 Server-side AI processing with Anthropic Claude
- 📊 Advanced financial calculations and analytics
- 🔧 RESTful API with automatic documentation
- 🛡️ Comprehensive error handling and validation

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.x for fast development
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query v5 for server state
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI with Python 3.12+
- **Package Manager**: uv for fast dependency management
- **Data Validation**: Pydantic v2 for type safety
- **AI Integration**: Anthropic Claude API
- **Development**: Hot reload with uvicorn

## 🚀 Quick Start

### Prerequisites
- **Frontend**: Node.js 18+, npm
- **Backend**: Python 3.12+, uv
- **AI Features**: Anthropic API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AIFinanceManager
```

### 2. Backend Setup
```bash
cd backend
uv sync                          # Install dependencies
cp .env.example .env            # Create environment file
# Add your ANTHROPIC_API_KEY to .env
uv run python run.py            # Start backend server
```
Backend runs on: http://localhost:8001

### 3. Frontend Setup
```bash
cd finance-dashboard
npm install                     # Install dependencies
cp .env.example .env           # Create environment file
# Configure VITE_API_BASE_URL=http://localhost:8001
npm run dev                    # Start frontend server
```
Frontend runs on: http://localhost:5173

### 4. Environment Configuration

**Backend (.env)**:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend (.env)**:
```env
VITE_API_BASE_URL=http://localhost:8001
```

## 📚 Documentation

- **[Frontend Documentation](./finance-dashboard/README.md)** - React TypeScript app setup, best practices, and development guide
- **[Backend Documentation](./backend/README.md)** - FastAPI setup, API endpoints, and architecture details
- **[Development Guidelines](./CLAUDE.md)** - Claude Code assistant instructions and project conventions

## 🎯 Core Features

### AI-Powered Receipt Processing
- Upload PDF receipts and images via drag-and-drop
- Server-side AI processing with Claude for accurate data extraction
- Automatic expense categorization and merchant identification
- Smart item parsing for detailed expense tracking

### Real-Time Financial Dashboard
- Live expense and income tracking with TanStack Query caching
- Interactive charts showing spending patterns and trends
- Net savings calculations and financial health indicators
- Category-wise analysis with color-coded visualizations

### Advanced Budget Management
- Create and manage custom budget categories
- Real-time budget vs actual spending comparison
- Visual progress indicators with overspending alerts
- Server-side budget calculations for accuracy

### Intelligent Financial Insights
- AI-generated personalized financial advice
- Spending pattern analysis and recommendations
- Trend identification across categories and time periods
- Actionable insights for better financial decision-making

## 🏃‍♂️ Development Workflow

### Frontend Development
```bash
cd finance-dashboard
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run lint         # ESLint checking
```

### Backend Development
```bash
cd backend
uv run python run.py # Development server with hot reload
uv add <package>     # Add dependencies
uv run pytest       # Run tests (when implemented)
```

## 🔄 API Communication

The application uses a modern API-first architecture:

- **Frontend**: TanStack Query for intelligent caching and state management
- **Backend**: FastAPI with automatic OpenAPI documentation
- **Communication**: RESTful APIs with JSON payloads
- **Real-time**: Automatic cache invalidation and background refetching

API Documentation available at: http://localhost:8001/docs

## 🧪 Testing & Quality

- **TypeScript**: Full type safety across frontend and backend
- **Linting**: ESLint for code quality and consistency
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Performance**: Optimized with TanStack Query caching and lazy loading

## 🚧 Current Status

✅ **Completed**
- Full-stack architecture with TypeScript frontend and Python backend
- AI-powered receipt processing and expense extraction
- Real-time dashboard with interactive charts and analytics
- Complete budget management system
- TanStack Query integration for optimal data fetching

🔜 **Roadmap**
- [ ] Database integration (PostgreSQL/SQLite)
- [ ] User authentication and multi-user support
- [ ] Advanced analytics and reporting features
- [ ] Mobile-responsive PWA capabilities
- [ ] Bank integration APIs
- [ ] Automated testing suite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the development guidelines in `CLAUDE.md`
4. Make your changes with proper TypeScript types
5. Test both frontend and backend changes
6. Commit with descriptive messages
7. Push to your branch and open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

- **Frontend Issues**: Check [Frontend README](./finance-dashboard/README.md)
- **Backend Issues**: Check [Backend README](./backend/README.md)
- **API Issues**: Visit http://localhost:8001/docs for API documentation
- **General Help**: Review [CLAUDE.md](./CLAUDE.md) for development guidelines

## 🙏 Acknowledgments

- **Frontend**: Built with React 19, TypeScript, and TanStack Query
- **Backend**: Powered by FastAPI and modern Python ecosystem
- **AI**: Enhanced by Anthropic's Claude for intelligent insights
- **UI/UX**: Modern design with Tailwind CSS and Lucide icons