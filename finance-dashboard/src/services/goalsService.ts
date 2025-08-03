/**
 * Goals Service - Business logic for goals management
 * Separates domain logic from UI components
 */
import { getUserFriendlyError } from '../utils/errorMessages';

export interface GoalOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class GoalsService {
  constructor(
    private createGoalMutation: any,
    private updateGoalMutation: any,
    private deleteGoalMutation: any,
    private showNotification: (type: 'success' | 'error', title: string, message: string) => void
  ) {}

  async createGoal(goalData: any): Promise<GoalOperationResult> {
    try {
      await this.createGoalMutation.mutateAsync(goalData);
      this.showNotification('success', 'Goal Created', 'Goal created successfully');
      return { success: true, message: 'Goal created successfully' };
    } catch (error: any) {
      console.error('Create goal error:', error);
      const friendlyError = getUserFriendlyError(error);
      this.showNotification('error', friendlyError.title, friendlyError.message);
      return { success: false, error: friendlyError.message };
    }
  }

  async updateGoal(goalId: number, goalData: any): Promise<GoalOperationResult> {
    try {
      await this.updateGoalMutation.mutateAsync({ id: goalId, goal: goalData });
      this.showNotification('success', 'Goal Updated', 'Goal updated successfully');
      return { success: true, message: 'Goal updated successfully' };
    } catch (error: any) {
      console.error('Update goal error:', error);
      const friendlyError = getUserFriendlyError(error);
      this.showNotification('error', friendlyError.title, friendlyError.message);
      return { success: false, error: friendlyError.message };
    }
  }

  async deleteGoal(goalId: number): Promise<GoalOperationResult> {
    try {
      await this.deleteGoalMutation.mutateAsync(goalId);
      this.showNotification('success', 'Goal Deleted', 'Goal deleted successfully');
      return { success: true, message: 'Goal deleted successfully' };
    } catch (error: any) {
      console.error('Delete goal error:', error);
      const friendlyError = getUserFriendlyError(error);
      this.showNotification('error', friendlyError.title, friendlyError.message);
      return { success: false, error: friendlyError.message };
    }
  }
}
