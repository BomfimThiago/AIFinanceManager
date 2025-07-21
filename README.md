# AI Finance Manager

A comprehensive AI-powered personal finance management system designed to help you track expenses, manage budgets, and gain financial insights through artificial intelligence.

## Project Structure

```
AIFinanceManager/
├── finance-dashboard/          # React frontend application
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── README.md              # Frontend documentation
├── README.md                  # This file
└── .gitignore                 # Git ignore rules
```

## Features

🚀 **Frontend Dashboard (`finance-dashboard/`)**
- 📊 Real-time financial dashboard with interactive charts
- 📸 AI-powered receipt processing and expense extraction
- 💰 Intelligent expense categorization and tracking
- 🎯 Budget creation and monitoring with visual progress
- 🧠 Personalized financial insights and recommendations
- 📈 Data visualization using Recharts
- 🔒 Privacy controls for sensitive financial data

## Technology Stack

### Frontend
- **Framework**: React 19.1.0 with Vite 6.x
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **AI Integration**: Claude (Anthropic API)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AIFinanceManager.git
cd AIFinanceManager
```

2. Set up the frontend:
```bash
cd finance-dashboard
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

### Frontend Development
The main application is located in the `finance-dashboard/` directory. See the [frontend README](./finance-dashboard/README.md) for detailed development instructions.

### Environment Variables
Create a `.env` file in the `finance-dashboard/` directory:
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Features Overview

### AI-Powered Receipt Processing
- Upload PDF receipts and images
- Automatic data extraction using Claude AI
- Smart categorization of expenses
- Bulk processing capabilities

### Financial Dashboard
- Real-time income and expense tracking
- Category-wise spending analysis
- Net savings and financial health indicators
- Interactive charts and visualizations

### Budget Management
- Create custom budget categories
- Visual progress tracking with alerts
- Budget vs actual spending comparison
- Overspending notifications

### AI Financial Insights
- Personalized spending pattern analysis
- Financial recommendations and tips
- Trend identification and forecasting
- Actionable advice for better financial health

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Roadmap

- [ ] Backend API development
- [ ] User authentication and data persistence
- [ ] Mobile application
- [ ] Advanced analytics and reporting
- [ ] Integration with banks and financial institutions
- [ ] Machine learning for expense prediction

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the [frontend documentation](./finance-dashboard/README.md)
- Review the troubleshooting guide

## Acknowledgments

- Built with React and modern web technologies
- AI capabilities powered by Anthropic's Claude
- UI components inspired by modern design systems 