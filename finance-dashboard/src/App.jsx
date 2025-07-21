import React, { useState, useRef, useCallback } from 'react';
import { Upload, DollarSign, TrendingUp, PieChart, Calendar, Brain, AlertCircle, Target, FileText, Camera, BarChart3, Wallet, CreditCard, Home, Car, ShoppingCart, Utensils, Gamepad2, Plus, X, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const FinanceManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      date: '2025-07-20',
      amount: 89.99,
      category: 'Groceries',
      description: 'Weekly grocery shopping',
      merchant: 'Whole Foods',
      type: 'expense'
    },
    {
      id: 2,
      date: '2025-07-19',
      amount: 45.00,
      category: 'Utilities',
      description: 'Electricity bill',
      merchant: 'Power Company',
      type: 'expense'
    },
    {
      id: 3,
      date: '2025-07-18',
      amount: 3200.00,
      category: 'Income',
      description: 'Salary deposit',
      merchant: 'Employer',
      type: 'income'
    }
  ]);
  
  const [budgets, setBudgets] = useState({
    'Groceries': { limit: 400, spent: 89.99 },
    'Utilities': { limit: 200, spent: 45.00 },
    'Entertainment': { limit: 150, spent: 0 },
    'Transport': { limit: 300, spent: 0 },
    'Dining': { limit: 250, spent: 0 }
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', limit: '' });
  const [hideAmounts, setHideAmounts] = useState(false);

  const fileInputRef = useRef(null);

  const categories = [
    { name: 'Groceries', icon: ShoppingCart, color: '#10B981' },
    { name: 'Utilities', icon: Home, color: '#3B82F6' },
    { name: 'Transport', icon: Car, color: '#8B5CF6' },
    { name: 'Dining', icon: Utensils, color: '#F59E0B' },
    { name: 'Entertainment', icon: Gamepad2, color: '#EF4444' },
    { name: 'Healthcare', icon: Plus, color: '#EC4899' },
    { name: 'Income', icon: DollarSign, color: '#059669' }
  ];

  const processFileWithAI = async (file) => {
    setIsProcessing(true);
    try {
      // Convert file to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: file.type,
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: `Please analyze this receipt/financial document and extract the following information in JSON format:
                  {
                    "amount": number,
                    "date": "YYYY-MM-DD",
                    "merchant": "string",
                    "category": "string (Groceries, Utilities, Transport, Dining, Entertainment, Healthcare, or Other)",
                    "description": "string",
                    "items": ["list of items if receipt"]
                  }
                  
                  Your entire response MUST be a single, valid JSON object. DO NOT include any text outside of the JSON structure.`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const expenseData = JSON.parse(responseText);
      
      // Add the new expense
      const newExpense = {
        id: Date.now(),
        ...expenseData,
        type: 'expense',
        source: 'ai-processed'
      };

      setExpenses(prev => [newExpense, ...prev]);
      
      // Update budget if category exists
      if (budgets[expenseData.category]) {
        setBudgets(prev => ({
          ...prev,
          [expenseData.category]: {
            ...prev[expenseData.category],
            spent: prev[expenseData.category].spent + expenseData.amount
          }
        }));
      }

      return newExpense;
    } catch (error) {
      console.error('Error processing file with AI:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze this financial data and provide 3-5 personalized insights and recommendations in JSON format:

              Expenses: ${JSON.stringify(expenses)}
              Budgets: ${JSON.stringify(budgets)}

              Respond with:
              {
                "insights": [
                  {
                    "title": "string",
                    "message": "string",
                    "type": "warning|success|info",
                    "actionable": "string (specific recommendation)"
                  }
                ]
              }

              Your entire response MUST be a single, valid JSON object.`
            }
          ]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const insightsData = JSON.parse(responseText);
      
      setAiInsights(insightsData.insights || []);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          setUploadedFiles(prev => [...prev, { file, status: 'processing' }]);
          const processedExpense = await processFileWithAI(file);
          setUploadedFiles(prev => 
            prev.map(f => f.file === file ? { ...f, status: 'completed', expense: processedExpense } : f)
          );
        }
      }
    }
  }, []);

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setUploadedFiles(prev => [...prev, { file, status: 'processing' }]);
        const processedExpense = await processFileWithAI(file);
        setUploadedFiles(prev => 
          prev.map(f => f.file === file ? { ...f, status: 'completed', expense: processedExpense } : f)
        );
      }
    }
  };

  const addBudget = () => {
    if (newBudget.category && newBudget.limit) {
      setBudgets(prev => ({
        ...prev,
        [newBudget.category]: { limit: parseFloat(newBudget.limit), spent: 0 }
      }));
      setNewBudget({ category: '', limit: '' });
      setShowBudgetForm(false);
    }
  };

  const formatAmount = (amount) => {
    if (hideAmounts) return '***';
    return `$${amount.toFixed(2)}`;
  };

  // Calculate summary data
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netAmount = totalIncome - totalExpenses;

  // Prepare chart data
  const monthlyData = [
    { month: 'Jun', income: 3200, expenses: 1850 },
    { month: 'Jul', income: totalIncome, expenses: totalExpenses }
  ];

  const categoryData = categories
    .map(cat => ({
      name: cat.name,
      value: expenses.filter(e => e.category === cat.name && e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
      color: cat.color
    }))
    .filter(cat => cat.value > 0);

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Finance Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setHideAmounts(!hideAmounts)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title={hideAmounts ? "Show amounts" : "Hide amounts"}
              >
                {hideAmounts ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
              <div className="text-right">
                <div className="text-sm text-gray-500">Net Balance</div>
                <div className={`font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(netAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'upload', name: 'Upload', icon: Upload },
              { id: 'expenses', name: 'Expenses', icon: CreditCard },
              { id: 'budgets', name: 'Budgets', icon: Target },
              { id: 'insights', name: 'AI Insights', icon: Brain }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpenses)}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Net Savings</p>
                    <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(Math.abs(netAmount))}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Wallet className={`h-6 w-6 ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Active Budgets</p>
                    <p className="text-2xl font-bold text-blue-600">{Object.keys(budgets).length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatAmount(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, value}) => `${name}: ${formatAmount(value)}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatAmount(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Receipts & Documents</h2>
              <p className="text-gray-600">AI will automatically extract expense data from your files</p>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Drop files here</h3>
                  <p className="text-gray-500">or click to select files</p>
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Choose Files
                </button>
                
                <p className="text-sm text-gray-500">
                  Supports PDF receipts and images (JPG, PNG)
                </p>
              </div>
            </div>

            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700 font-medium">Processing files with AI...</span>
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Files</h3>
                <div className="space-y-3">
                  {uploadedFiles.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{item.file.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.status === 'processing' && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                        {item.status === 'completed' && item.expense && (
                          <div className="text-sm text-green-600 font-medium">
                            {formatAmount(item.expense.amount)} - {item.expense.category}
                          </div>
                        )}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
              <div className="flex space-x-2">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>Last 30 days</option>
                  <option>Last 7 days</option>
                  <option>This month</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => {
                      const CategoryIcon = categories.find(cat => cat.name === expense.category)?.icon || DollarSign;
                      const categoryColor = categories.find(cat => cat.name === expense.category)?.color || '#6B7280';
                      
                      return (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryColor}20` }}>
                                <CategoryIcon className="h-4 w-4" style={{ color: categoryColor }} />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{expense.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                            >
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {expense.merchant}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {expense.type === 'income' ? '+' : '-'}{formatAmount(expense.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Budget Overview</h2>
              <button
                onClick={() => setShowBudgetForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Budget</span>
              </button>
            </div>

            {showBudgetForm && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Budget</h3>
                  <button
                    onClick={() => setShowBudgetForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={newBudget.category}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.filter(cat => cat.name !== 'Income').map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Budget Limit"
                    value={newBudget.limit}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, limit: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={addBudget}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Budget
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(budgets).map(([category, budget]) => {
                const percentage = (budget.spent / budget.limit) * 100;
                const CategoryIcon = categories.find(cat => cat.name === category)?.icon || Target;
                const categoryColor = categories.find(cat => cat.name === category)?.color || '#6B7280';
                const isOverBudget = budget.spent > budget.limit;
                
                return (
                  <div key={category} className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryColor}20` }}>
                          <CategoryIcon className="h-5 w-5" style={{ color: categoryColor }} />
                        </div>
                        <h3 className="font-semibold text-gray-900">{category}</h3>
                      </div>
                      {isOverBudget && <AlertCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Spent</span>
                        <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatAmount(budget.spent)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Budget</span>
                        <span className="font-medium text-gray-900">{formatAmount(budget.limit)}</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          {percentage.toFixed(1)}% used
                        </span>
                        <span className={`font-medium ${
                          budget.limit - budget.spent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatAmount(Math.abs(budget.limit - budget.spent))} {budget.limit - budget.spent >= 0 ? 'left' : 'over'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">AI Financial Insights</h2>
              <button
                onClick={generateAIInsights}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>Generate Insights</span>
              </button>
            </div>

            {aiInsights.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Financial Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Get personalized insights about your spending patterns, budget performance, and financial recommendations.
                </p>
                <button
                  onClick={generateAIInsights}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Analyze My Finances
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className={`p-6 rounded-xl border-l-4 ${
                    insight.type === 'warning' ? 'bg-red-50 border-red-500' :
                    insight.type === 'success' ? 'bg-green-50 border-green-500' :
                    'bg-blue-50 border-blue-500'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === 'warning' ? 'bg-red-100' :
                        insight.type === 'success' ? 'bg-green-100' :
                        'bg-blue-100'
                      }`}>
                        {insight.type === 'warning' ? (
                          <AlertCircle className={`h-5 w-5 text-red-600`} />
                        ) : insight.type === 'success' ? (
                          <TrendingUp className={`h-5 w-5 text-green-600`} />
                        ) : (
                          <Brain className={`h-5 w-5 text-blue-600`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                        <p className="text-gray-700 mb-3">{insight.message}</p>
                        {insight.actionable && (
                          <div className="bg-white p-3 rounded-lg border">
                            <p className="text-sm font-medium text-gray-900 mb-1">Recommended Action:</p>
                            <p className="text-sm text-gray-700">{insight.actionable}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Financial Health Score */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health Score</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Overall Score</span>
                    <span className="font-medium text-gray-900">
                      {netAmount >= 0 ? '85/100' : '65/100'} - {netAmount >= 0 ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${netAmount >= 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${netAmount >= 0 ? '85' : '65'}%` }}
                    ></div>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${netAmount >= 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <TrendingUp className={`h-6 w-6 ${netAmount >= 0 ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FinanceManager;