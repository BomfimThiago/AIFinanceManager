"""
Financial Report Service for comprehensive analytics.

This module provides comprehensive financial analysis and reporting.
"""

import logging
from collections import defaultdict
from datetime import date, datetime

from src.budgets.goals_service import GoalsService
from src.budgets.service import BudgetService
from src.expenses.schemas import Expense
from src.expenses.service import ExpenseService
from src.insights.financial_report_schemas import (
    ActionPlan,
    BudgetPerformance,
    CategoryAnalysis,
    ComprehensiveFinancialReport,
    ExecutiveSummary,
    FinancialHealthGrade,
    FinancialHealthMetrics,
    GoalAlignment,
    GoalProgress,
    MerchantAnalysis,
    MonthlyTrendData,
    Recommendation,
    RecommendationPriority,
    TransactionPatterns,
    TrendDirection,
)

logger = logging.getLogger(__name__)


class FinancialReportService:
    """Service for generating comprehensive financial reports."""

    def __init__(
        self,
        expense_service: ExpenseService,
        budget_service: BudgetService,
        goals_service: GoalsService,
    ):
        self.expense_service = expense_service
        self.budget_service = budget_service
        self.goals_service = goals_service

    async def generate_comprehensive_report(
        self, start_date: str | None = None, end_date: str | None = None
    ) -> ComprehensiveFinancialReport:
        """Generate a comprehensive financial report for specified date range."""
        logger.info(
            f"Generating comprehensive financial report (dates: {start_date} to {end_date})"
        )

        # Get filtered data based on date range
        expenses = await self.expense_service.get_all()
        budgets = await self.budget_service.get_all()
        goals = await self.goals_service.get_all_goals()

        # Filter expenses by date range if provided
        if start_date or end_date:
            expenses = self._filter_expenses_by_date(expenses, start_date, end_date)

        logger.info(
            f"Retrieved {len(expenses)} expenses, {len(budgets)} budgets, {len(goals)} goals"
        )

        # Generate report sections
        executive_summary = self._generate_executive_summary(expenses)
        monthly_trends = self._generate_monthly_trends(expenses)
        category_analysis = self._generate_category_analysis(expenses, budgets)
        merchant_analysis = self._generate_merchant_analysis(expenses)
        transaction_patterns = self._generate_transaction_patterns(expenses)
        budget_performance = self._generate_budget_performance(expenses, budgets)
        financial_health = self._generate_financial_health_metrics(expenses)
        goal_alignment = self._generate_goal_alignment(goals, expenses)
        ai_insights = self._generate_ai_insights(expenses, budgets, goals)
        recommendations = self._generate_recommendations(
            expenses, budgets, goals, financial_health
        )
        action_plan = self._generate_action_plan(recommendations)

        return ComprehensiveFinancialReport(
            executive_summary=executive_summary,
            monthly_trends=monthly_trends,
            category_analysis=category_analysis,
            merchant_analysis=merchant_analysis,
            transaction_patterns=transaction_patterns,
            budget_performance=budget_performance,
            financial_health=financial_health,
            goal_alignment=goal_alignment,
            ai_insights=ai_insights,
            recommendations=recommendations,
            action_plan=action_plan,
        )

    def _generate_executive_summary(self, expenses: list[Expense]) -> ExecutiveSummary:
        """Generate executive summary."""
        if not expenses:
            return ExecutiveSummary(
                period_start=date.today().replace(day=1),
                period_end=date.today(),
                total_income=0.0,
                total_expenses=0.0,
                net_savings=0.0,
                net_savings_percentage=0.0,
                average_daily_spending=0.0,
                total_transactions=0,
                financial_health_score=0,
                quick_insights=[
                    "No financial data available yet. Start by adding expenses!"
                ],
            )

        # Calculate date range
        expense_dates = [datetime.fromisoformat(e.date).date() for e in expenses]
        period_start = min(expense_dates)
        period_end = max(expense_dates)

        # Calculate totals
        total_income = sum(e.amount for e in expenses if e.type == "income")
        total_expenses = sum(e.amount for e in expenses if e.type == "expense")
        net_savings = total_income - total_expenses
        net_savings_percentage = (
            (net_savings / total_income * 100) if total_income > 0 else 0
        )

        # Calculate daily average
        days_count = (period_end - period_start).days + 1
        average_daily_spending = total_expenses / days_count if days_count > 0 else 0

        # Generate quick insights
        quick_insights = []
        if net_savings > 0:
            quick_insights.append(
                f"You saved {abs(net_savings_percentage):.1f}% of your income this period"
            )
        else:
            quick_insights.append(
                f"You spent {abs(net_savings_percentage):.1f}% more than your income"
            )

        if average_daily_spending > 0:
            quick_insights.append(
                f"Average daily spending: ${average_daily_spending:.2f}"
            )

        # Calculate financial health score (simplified)
        health_score = min(100, max(0, int(50 + net_savings_percentage)))

        return ExecutiveSummary(
            period_start=period_start,
            period_end=period_end,
            total_income=total_income,
            total_expenses=total_expenses,
            net_savings=net_savings,
            net_savings_percentage=net_savings_percentage,
            average_daily_spending=average_daily_spending,
            total_transactions=len(expenses),
            financial_health_score=health_score,
            quick_insights=quick_insights,
        )

    def _generate_monthly_trends(
        self, expenses: list[Expense]
    ) -> list[MonthlyTrendData]:
        """Generate monthly trend data."""
        monthly_data = defaultdict(lambda: {"income": 0, "expenses": 0, "count": 0})

        for expense in expenses:
            expense_date = datetime.fromisoformat(expense.date)
            month_key = f"{expense_date.year}-{expense_date.month:02d}"

            if expense.type == "income":
                monthly_data[month_key]["income"] += expense.amount
            else:
                monthly_data[month_key]["expenses"] += expense.amount
            monthly_data[month_key]["count"] += 1

        trends = []
        for month_str, data in sorted(monthly_data.items()):
            year, month = map(int, month_str.split("-"))
            trends.append(
                MonthlyTrendData(
                    month=month_str,
                    year=year,
                    income=data["income"],
                    expenses=data["expenses"],
                    net_savings=data["income"] - data["expenses"],
                    transaction_count=data["count"],
                )
            )

        return trends

    def _generate_category_analysis(
        self, expenses: list[Expense], budgets: dict
    ) -> list[CategoryAnalysis]:
        """Generate category analysis."""
        category_data = defaultdict(lambda: {"amount": 0, "count": 0})
        total_expenses = 0

        for expense in expenses:
            if expense.type == "expense":
                category_data[expense.category]["amount"] += expense.amount
                category_data[expense.category]["count"] += 1
                total_expenses += expense.amount

        analysis = []
        for category, data in category_data.items():
            budget_info = budgets.get(category)
            budget_limit = budget_info.limit if budget_info else None
            budget_percentage = (
                (data["amount"] / budget_limit * 100)
                if budget_limit and budget_limit > 0
                else None
            )

            analysis.append(
                CategoryAnalysis(
                    category=category,
                    amount=data["amount"],
                    percentage=(data["amount"] / total_expenses * 100)
                    if total_expenses > 0
                    else 0,
                    transaction_count=data["count"],
                    trend=TrendDirection.STABLE,  # Simplified for now
                    budget_limit=budget_limit,
                    budget_percentage=budget_percentage,
                    average_transaction=data["amount"] / data["count"]
                    if data["count"] > 0
                    else 0,
                )
            )

        return sorted(analysis, key=lambda x: x.amount, reverse=True)

    def _generate_merchant_analysis(
        self, expenses: list[Expense]
    ) -> list[MerchantAnalysis]:
        """Generate merchant analysis."""
        merchant_data = defaultdict(
            lambda: {"amount": 0, "count": 0, "last_date": None}
        )
        total_expenses = sum(e.amount for e in expenses if e.type == "expense")

        for expense in expenses:
            if expense.type == "expense" and expense.merchant:
                merchant_data[expense.merchant]["amount"] += expense.amount
                merchant_data[expense.merchant]["count"] += 1
                expense_date = datetime.fromisoformat(expense.date).date()
                if (
                    merchant_data[expense.merchant]["last_date"] is None
                    or expense_date > merchant_data[expense.merchant]["last_date"]
                ):
                    merchant_data[expense.merchant]["last_date"] = expense_date

        analysis = []
        for merchant, data in merchant_data.items():
            analysis.append(
                MerchantAnalysis(
                    merchant=merchant,
                    total_amount=data["amount"],
                    transaction_count=data["count"],
                    percentage_of_total=(data["amount"] / total_expenses * 100)
                    if total_expenses > 0
                    else 0,
                    average_transaction=data["amount"] / data["count"]
                    if data["count"] > 0
                    else 0,
                    last_transaction_date=data["last_date"] or date.today(),
                )
            )

        return sorted(analysis, key=lambda x: x.total_amount, reverse=True)[:10]

    def _generate_transaction_patterns(
        self, expenses: list[Expense]
    ) -> TransactionPatterns:
        """Generate transaction patterns."""
        if not expenses:
            return TransactionPatterns(
                average_transaction_size=0,
                largest_transaction=0,
                smallest_transaction=0,
                most_common_day="Monday",
                transactions_by_day={},
                recurring_expenses=[],
            )

        amounts = [e.amount for e in expenses if e.type == "expense"]
        days_count = defaultdict(int)

        for expense in expenses:
            day = datetime.fromisoformat(expense.date).strftime("%A")
            days_count[day] += 1

        most_common_day = (
            max(days_count.items(), key=lambda x: x[1])[0] if days_count else "Monday"
        )

        # Find recurring expenses (simplified - merchants with 3+ transactions)
        merchant_counts = defaultdict(int)
        for expense in expenses:
            if expense.merchant:
                merchant_counts[expense.merchant] += 1

        [merchant for merchant, count in merchant_counts.items() if count >= 3][:5]

        return TransactionPatterns(
            average_transaction_size=sum(amounts) / len(amounts) if amounts else 0,
            largest_transaction=max(amounts) if amounts else 0,
            smallest_transaction=min(amounts) if amounts else 0,
            most_common_day=most_common_day,
            transactions_by_day=dict(days_count),
            recurring_expenses=[],  # Simplified for now
        )

    def _generate_budget_performance(
        self, expenses: list[Expense], budgets: dict
    ) -> BudgetPerformance:
        """Generate budget performance analysis."""
        if not budgets:
            return BudgetPerformance(
                overall_adherence_score=0,
                categories_over_budget=[],
                categories_under_budget=[],
                projected_month_end_status={},
                total_budget=0,
                total_spent=0,
            )

        category_spending = defaultdict(float)
        for expense in expenses:
            if expense.type == "expense":
                category_spending[expense.category] += expense.amount

        over_budget = []
        under_budget = []
        total_budget = 0
        total_spent = 0

        for category, budget_info in budgets.items():
            if budget_info.limit > 0:
                spent = category_spending.get(category, 0)
                total_budget += budget_info.limit
                total_spent += spent

                if spent > budget_info.limit:
                    over_budget.append(category)
                else:
                    under_budget.append(category)

        adherence_score = (
            ((total_budget - max(0, total_spent - total_budget)) / total_budget * 100)
            if total_budget > 0
            else 100
        )

        return BudgetPerformance(
            overall_adherence_score=adherence_score,
            categories_over_budget=over_budget,
            categories_under_budget=under_budget,
            projected_month_end_status={},  # Simplified for now
            total_budget=total_budget,
            total_spent=total_spent,
        )

    def _generate_financial_health_metrics(
        self, expenses: list[Expense]
    ) -> FinancialHealthMetrics:
        """Generate financial health metrics."""
        total_income = sum(e.amount for e in expenses if e.type == "income")
        total_expenses = sum(e.amount for e in expenses if e.type == "expense")

        savings_rate = (
            ((total_income - total_expenses) / total_income * 100)
            if total_income > 0
            else 0
        )

        # Simplified health grade calculation
        if savings_rate >= 20:
            grade = FinancialHealthGrade.EXCELLENT
        elif savings_rate >= 10:
            grade = FinancialHealthGrade.GOOD
        elif savings_rate >= 0:
            grade = FinancialHealthGrade.FAIR
        else:
            grade = FinancialHealthGrade.POOR

        monthly_expenses = total_expenses / 12 if total_expenses > 0 else 0
        emergency_fund_months = (
            (total_income - total_expenses) / monthly_expenses
            if monthly_expenses > 0
            else 0
        )

        return FinancialHealthMetrics(
            savings_rate=savings_rate,
            expense_ratio_fixed=70,  # Simplified
            expense_ratio_variable=30,  # Simplified
            emergency_fund_months=max(0, emergency_fund_months),
            debt_to_income_ratio=None,
            overall_grade=grade,
        )

    def _generate_goal_alignment(
        self, goals: list, expenses: list[Expense]
    ) -> GoalAlignment:
        """Generate goal alignment analysis."""
        if not goals:
            return GoalAlignment(
                active_goals=[],
                total_monthly_required=0,
                current_monthly_savings=0,
                savings_gap=0,
                recommendations=[],
            )

        total_income = sum(e.amount for e in expenses if e.type == "income")
        total_expenses = sum(e.amount for e in expenses if e.type == "expense")
        monthly_savings = (total_income - total_expenses) / 12 if expenses else 0

        active_goals = []
        total_required = 0

        for goal in goals:
            if hasattr(goal, "target_amount") and hasattr(goal, "current_amount"):
                remaining = goal.target_amount - goal.current_amount
                # Simplified calculation - assume 12 months to achieve
                monthly_required = remaining / 12 if remaining > 0 else 0
                total_required += monthly_required

                active_goals.append(
                    GoalProgress(
                        goal_id=goal.id,
                        title=goal.title,
                        target_amount=goal.target_amount,
                        current_amount=goal.current_amount,
                        progress_percentage=(
                            goal.current_amount / goal.target_amount * 100
                        )
                        if goal.target_amount > 0
                        else 0,
                        required_monthly_savings=monthly_required,
                        is_on_track=monthly_savings >= monthly_required,
                    )
                )

        return GoalAlignment(
            active_goals=active_goals,
            total_monthly_required=total_required,
            current_monthly_savings=monthly_savings,
            savings_gap=total_required - monthly_savings,
            recommendations=[],
        )

    def _generate_ai_insights(
        self, expenses: list[Expense], budgets: dict, goals: list
    ) -> list[str]:
        """Generate non-AI insights based on financial data analysis."""
        insights = []

        if not expenses:
            insights.append("Start tracking your expenses to get personalized insights")
            return insights

        total_income = sum(e.amount for e in expenses if e.type == "income")
        total_expenses = sum(e.amount for e in expenses if e.type == "expense")

        # Basic financial health insights
        if total_expenses > total_income:
            overspend_pct = (
                ((total_expenses - total_income) / total_income * 100)
                if total_income > 0
                else 0
            )
            insights.append(
                f"You're spending {overspend_pct:.1f}% more than you earn - consider reducing expenses"
            )

        if not budgets:
            insights.append("Set up budgets to better control your spending")

        savings_rate = (
            ((total_income - total_expenses) / total_income * 100)
            if total_income > 0
            else 0
        )
        if savings_rate < 10:
            insights.append(
                "Try to save at least 10% of your income for financial security"
            )
        elif savings_rate >= 20:
            insights.append("Excellent! You're saving 20%+ of your income")

        # Category-based insights
        if expenses:
            category_spending = {}
            for expense in expenses:
                if expense.type == "expense":
                    category_spending[expense.category] = (
                        category_spending.get(expense.category, 0) + expense.amount
                    )

            if category_spending:
                top_category = max(category_spending.items(), key=lambda x: x[1])
                total_spending = sum(category_spending.values())
                pct = (
                    (top_category[1] / total_spending * 100)
                    if total_spending > 0
                    else 0
                )

                if pct > 40:
                    insights.append(
                        f"{top_category[0]} represents {pct:.1f}% of your spending - consider if this aligns with your priorities"
                    )

        # Goal-related insights
        if goals:
            active_goals = [
                g for g in goals if hasattr(g, "status") and g.status == "active"
            ]
            if active_goals:
                insights.append(
                    f"You have {len(active_goals)} active goals - keep tracking your progress!"
                )
        else:
            insights.append(
                "Consider setting financial goals to stay motivated and focused"
            )

        return insights

    def _generate_recommendations(
        self,
        expenses: list[Expense],
        budgets: dict,
        goals: list,
        financial_health: FinancialHealthMetrics,
    ) -> list[Recommendation]:
        """Generate personalized recommendations."""
        recommendations = []

        if financial_health.savings_rate < 10:
            recommendations.append(
                Recommendation(
                    title="Increase Your Savings Rate",
                    description="Your current savings rate is below the recommended 10% minimum",
                    impact="Improve financial security and goal achievement",
                    priority=RecommendationPriority.HIGH,
                    potential_savings=None,
                    difficulty="Medium",
                    timeframe="3 months",
                )
            )

        if not budgets:
            recommendations.append(
                Recommendation(
                    title="Create Category Budgets",
                    description="Set spending limits for each expense category",
                    impact="Better spending control and awareness",
                    priority=RecommendationPriority.HIGH,
                    potential_savings=None,
                    difficulty="Easy",
                    timeframe="1 week",
                )
            )

        return recommendations

    def _generate_action_plan(
        self, recommendations: list[Recommendation]
    ) -> ActionPlan:
        """Generate action plan."""
        high_priority = [
            r for r in recommendations if r.priority == RecommendationPriority.HIGH
        ]

        potential_savings = sum(
            r.potential_savings for r in recommendations if r.potential_savings
        )

        next_steps = [
            "Review your largest expense categories",
            "Set up budgets for top spending categories",
            "Identify recurring subscriptions to cancel",
            "Set a monthly savings goal",
        ]

        return ActionPlan(
            top_priorities=high_priority[:3],
            monthly_savings_potential=potential_savings,
            next_steps=next_steps,
        )

    def _filter_expenses_by_date(
        self,
        expenses: list[Expense],
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[Expense]:
        """Filter expenses by date range."""
        if not start_date and not end_date:
            return expenses

        filtered_expenses = []

        for expense in expenses:
            expense_date = datetime.fromisoformat(expense.date).date()

            # Check start date
            if start_date:
                start_date_obj = datetime.fromisoformat(start_date).date()
                if expense_date < start_date_obj:
                    continue

            # Check end date
            if end_date:
                end_date_obj = datetime.fromisoformat(end_date).date()
                if expense_date > end_date_obj:
                    continue

            filtered_expenses.append(expense)

        return filtered_expenses
