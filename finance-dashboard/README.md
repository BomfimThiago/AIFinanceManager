# AI Finance Manager

A modern, AI-powered personal finance dashboard built with React and Tailwind CSS.

## Features

- 📊 **Dashboard Overview**: Track income, expenses, and net savings
- 📸 **AI Receipt Processing**: Upload receipts and let AI extract expense data automatically
- 💰 **Expense Tracking**: Categorize and monitor all your transactions
- 🎯 **Budget Management**: Set and track budgets with visual progress indicators
- 🧠 **AI Insights**: Get personalized financial recommendations and insights
- 📈 **Data Visualization**: Interactive charts and graphs using Recharts
- 🔒 **Privacy Controls**: Hide/show amounts for privacy

## Technology Stack

- **Frontend**: React 19.1.0 + Vite 6.x
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI Integration**: Claude (Anthropic API)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd finance-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file and add your API keys:
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Features Overview

### Dashboard
- Real-time financial summary
- Income vs expenses chart
- Category-wise spending breakdown
- Financial health score

### AI Receipt Processing
- Upload PDF receipts or images
- Automatic data extraction using AI
- Intelligent categorization
- Bulk processing support

### Budget Management
- Create custom budget categories
- Visual progress tracking
- Overspending alerts
- Budget vs actual comparison

### AI Insights
- Personalized spending analysis
- Financial recommendations
- Trend identification
- Actionable advice

## Environment Variables

```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Project Structure

```
finance-dashboard/
├── src/
│   ├── App.jsx          # Main application component
│   ├── index.css        # Tailwind CSS imports and custom styles
│   └── main.jsx         # Application entry point
├── public/              # Static assets
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you have any questions or need help, please open an issue on GitHub.
