/**
 * Error message mapping utility for user-friendly error handling
 */

export interface ApiError {
  success: boolean;
  error: string;
  error_code: string;
  details: Record<string, any>;
}

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

/**
 * Maps backend error codes to user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    title: 'Login Failed',
    message:
      'The email or password you entered is incorrect. Please check your credentials and try again.',
    action:
      "Try entering your email and password again, or reset your password if you've forgotten it.",
  },

  USER_NOT_FOUND: {
    title: 'Account Not Found',
    message: 'No account was found with this email address.',
    action: 'Please check your email address or create a new account.',
  },

  USER_ALREADY_EXISTS: {
    title: 'Account Already Exists',
    message: 'An account with this email address already exists.',
    action: 'Try logging in instead, or use a different email address.',
  },

  INACTIVE_USER: {
    title: 'Account Inactive',
    message: 'Your account has been deactivated. Please contact support for assistance.',
    action: 'Contact our support team to reactivate your account.',
  },

  UNVERIFIED_USER: {
    title: 'Email Not Verified',
    message: 'Please verify your email address before logging in.',
    action: 'Check your email inbox for a verification link.',
  },

  INVALID_TOKEN: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'Click here to log in again.',
  },

  PASSWORD_VALIDATION_FAILED: {
    title: 'Invalid Password',
    message: "Your password doesn't meet the security requirements.",
    action: 'Password must be at least 6 characters long and contain letters and numbers.',
  },

  INSUFFICIENT_PERMISSIONS: {
    title: 'Access Denied',
    message: "You don't have permission to perform this action.",
    action: 'Contact your administrator if you believe this is an error.',
  },

  // General Errors
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    message: 'Please check the information you entered and try again.',
    action: 'Make sure all required fields are filled out correctly.',
  },

  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    action: 'Please check the URL or try refreshing the page.',
  },

  DUPLICATE_ERROR: {
    title: 'Already Exists',
    message: 'This item already exists in the system.',
    action: 'Try using a different name or updating the existing item.',
  },

  PERMISSION_DENIED: {
    title: 'Permission Denied',
    message: "You don't have permission to access this resource.",
    action: 'Please contact your administrator for access.',
  },

  EXTERNAL_SERVICE_ERROR: {
    title: 'Service Unavailable',
    message: 'An external service is currently unavailable. Please try again later.',
    action: 'Try again in a few minutes. If the problem persists, contact support.',
  },

  DATABASE_ERROR: {
    title: 'Database Error',
    message: 'A database error occurred. Please try again.',
    action: 'If the problem continues, please contact support.',
  },

  RATE_LIMIT_EXCEEDED: {
    title: 'Too Many Requests',
    message: "You've made too many requests. Please wait before trying again.",
    action: 'Please wait a moment before making another request.',
  },

  INTERNAL_SERVER_ERROR: {
    title: 'Server Error',
    message: 'An unexpected error occurred on our servers.',
    action: 'Please try again. If the problem persists, contact our support team.',
  },

  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Check your internet connection and try again.',
  },

  // Module-specific Errors

  // Expenses
  EXPENSE_NOT_FOUND: {
    title: 'Expense Not Found',
    message: "The expense you're looking for could not be found.",
    action: 'Please refresh the page or check if the expense still exists.',
  },

  EXPENSE_CREATION_FAILED: {
    title: 'Failed to Create Expense',
    message: 'Unable to create the expense. Please check your input.',
    action: 'Verify all required fields are filled and try again.',
  },

  EXPENSE_UPDATE_FAILED: {
    title: 'Failed to Update Expense',
    message: 'Unable to update the expense. Please try again.',
    action: 'Refresh the page and try updating the expense again.',
  },

  EXPENSE_DELETE_FAILED: {
    title: 'Failed to Delete Expense',
    message: 'Unable to delete the expense. Please try again.',
    action: 'Refresh the page and try deleting the expense again.',
  },

  // Categories
  CATEGORY_NOT_FOUND: {
    title: 'Category Not Found',
    message: "The category you're looking for could not be found.",
    action: 'Please refresh the page or check if the category still exists.',
  },

  CATEGORY_ALREADY_EXISTS: {
    title: 'Category Already Exists',
    message: 'A category with this name already exists.',
    action: 'Try using a different name or update the existing category.',
  },

  CATEGORY_CREATION_FAILED: {
    title: 'Failed to Create Category',
    message: 'Unable to create the category. Please check your input.',
    action: 'Verify the category name and icon are valid and try again.',
  },

  CATEGORY_UPDATE_FAILED: {
    title: 'Failed to Update Category',
    message: 'Unable to update the category. Please try again.',
    action: 'Refresh the page and try updating the category again.',
  },

  CATEGORY_DELETE_FAILED: {
    title: 'Failed to Delete Category',
    message: 'Unable to delete the category. It may be in use by existing expenses.',
    action: 'Remove expenses using this category first, then try deleting it.',
  },

  CATEGORY_IN_USE: {
    title: 'Category In Use',
    message: "This category cannot be deleted because it's being used by existing expenses.",
    action: 'Update or delete expenses using this category first.',
  },

  // Budgets
  BUDGET_NOT_FOUND: {
    title: 'Budget Not Found',
    message: "The budget you're looking for could not be found.",
    action: 'Please refresh the page or check if the budget still exists.',
  },

  BUDGET_CREATION_FAILED: {
    title: 'Failed to Create Budget',
    message: 'Unable to create the budget. Please check your input.',
    action: 'Verify the budget amount is valid and try again.',
  },

  BUDGET_UPDATE_FAILED: {
    title: 'Failed to Update Budget',
    message: 'Unable to update the budget. Please try again.',
    action: 'Refresh the page and try updating the budget again.',
  },

  BUDGET_DELETE_FAILED: {
    title: 'Failed to Delete Budget',
    message: 'Unable to delete the budget. Please try again.',
    action: 'Refresh the page and try deleting the budget again.',
  },

  INVALID_BUDGET_AMOUNT: {
    title: 'Invalid Budget Amount',
    message: 'The budget amount must be a positive number.',
    action: 'Enter a valid budget amount greater than zero.',
  },

  // Insights
  INSIGHTS_GENERATION_FAILED: {
    title: 'Failed to Generate Insights',
    message: 'Unable to generate AI insights at this time.',
    action: 'Please try again in a few moments. If the problem persists, contact support.',
  },

  INSUFFICIENT_DATA: {
    title: 'Insufficient Data',
    message: 'Not enough financial data to generate meaningful insights.',
    action: 'Add more expenses and transactions to get personalized insights.',
  },

  AI_SERVICE_UNAVAILABLE: {
    title: 'AI Service Unavailable',
    message: 'The AI service is temporarily unavailable.',
    action: 'Please try again later. Our AI insights will be back shortly.',
  },

  // File Upload
  FILE_UPLOAD_FAILED: {
    title: 'File Upload Failed',
    message: 'Unable to upload the file. Please try again.',
    action: 'Check your internet connection and try uploading again.',
  },

  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: "The file you're trying to upload is too large.",
    action: 'Please upload a file smaller than 10MB.',
  },

  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'This file type is not supported.',
    action: 'Please upload a PDF, JPG, or PNG file.',
  },

  FILE_PROCESSING_FAILED: {
    title: 'File Processing Failed',
    message: 'Unable to process the uploaded file.',
    action: 'Make sure the file is a valid receipt and try again.',
  },

  // Integrations
  INTEGRATION_CONNECTION_FAILED: {
    title: 'Connection Failed',
    message: 'Unable to connect to your bank or financial institution.',
    action: 'Check your credentials and try connecting again.',
  },

  INTEGRATION_SYNC_FAILED: {
    title: 'Sync Failed',
    message: 'Unable to sync your financial data.',
    action: 'Please try syncing again or reconnect your account.',
  },

  INTEGRATION_NOT_FOUND: {
    title: 'Integration Not Found',
    message: 'The financial integration could not be found.',
    action: 'Please reconnect your account or contact support.',
  },

  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again. If the problem persists, contact support.',
  },
};

/**
 * Convert field path to user-friendly display name
 */
function getFieldDisplayName(fieldPath: string[]): string {
  const fieldMap: Record<string, string> = {
    username: 'Username',
    email: 'Email',
    password: 'Password',
    full_name: 'Full Name',
    terms_accepted: 'Terms Acceptance',
    'body.username': 'Username',
    'body.email': 'Email',
    'body.password': 'Password',
    'body.full_name': 'Full Name',
  };

  const fieldKey = fieldPath.join('.');
  return fieldMap[fieldKey] || fieldPath[fieldPath.length - 1] || 'Field';
}

/**
 * Extract error information from API response
 */
export function extractErrorInfo(error: any): ApiError | null {
  // Handle our custom error response format
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;

    // Handle FastAPI validation errors (array format)
    if (Array.isArray(detail)) {
      const firstError = detail[0];
      const fieldPath = firstError?.loc || ['field'];
      const fieldName = getFieldDisplayName(fieldPath);
      const message = firstError?.msg || 'Validation failed';

      // Clean up the message - remove "Value error, " prefix
      const cleanMessage = message.replace(/^Value error,\s*/, '');

      return {
        success: false,
        error: `${fieldName}: ${cleanMessage}`,
        error_code: 'VALIDATION_ERROR',
        details: { validation_errors: detail },
      };
    }

    // Handle new structured error format
    if (typeof detail === 'object' && detail.error_code) {
      return {
        success: detail.success || false,
        error: detail.error || 'An error occurred',
        error_code: detail.error_code,
        details: detail.details || {},
      };
    }

    // Handle old string format
    if (typeof detail === 'string') {
      return {
        success: false,
        error: detail,
        error_code: 'UNKNOWN_ERROR',
        details: {},
      };
    }
  }

  // Handle direct data format (when detail is at root level)
  if (error?.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data;
    if (data.error_code) {
      return {
        success: data.success || false,
        error: data.error || 'An error occurred',
        error_code: data.error_code,
        details: data.details || {},
      };
    }
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return {
      success: false,
      error: 'Network connection failed',
      error_code: 'NETWORK_ERROR',
      details: {},
    };
  }

  // Handle generic errors
  if (error?.message) {
    return {
      success: false,
      error: error.message,
      error_code: 'UNKNOWN_ERROR',
      details: {},
    };
  }

  return null;
}

/**
 * Get user-friendly error message for display
 */
export function getUserFriendlyError(error: any): ErrorMessage {
  const errorInfo = extractErrorInfo(error);

  if (!errorInfo) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Return mapped error message or default
  return (
    ERROR_MESSAGES[errorInfo.error_code] || {
      title: 'Error',
      message: errorInfo.error,
      action: 'Please try again or contact support if the problem persists.',
    }
  );
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(details: Record<string, any>): string {
  if (!details || typeof details !== 'object') {
    return '';
  }

  // Handle FastAPI validation errors
  if (Array.isArray(details)) {
    return details
      .map((err: any) => {
        const field = err.loc?.join('.') || 'field';
        return `${field}: ${err.msg}`;
      })
      .join(', ');
  }

  // Handle custom validation errors
  if (details.field && details.message) {
    return `${details.field}: ${details.message}`;
  }

  return '';
}
