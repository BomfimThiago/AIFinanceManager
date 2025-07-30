import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { SignupCredentials } from '../../types';
import { getUserFriendlyError, formatValidationErrors } from '../../utils/errorMessages';

interface SignupProps {
  onToggleMode: () => void;
}

const Signup: React.FC<SignupProps> = ({ onToggleMode }) => {
  const { signup, isLoading } = useAuth();
  const { showSuccess, showError } = useNotificationContext();
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<SignupCredentials>({
    email: '',
    username: '',
    full_name: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!credentials.email || !credentials.username || !credentials.full_name || !credentials.password) {
      setError(t('auth.pleaseFieldsAll'));
      return;
    }

    if (credentials.password !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }

    if (credentials.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (credentials.username.length < 3) {
      setError(t('auth.usernameMinLength'));
      return;
    }

    // Validate username format (letters, numbers, hyphens, underscores only)
    const usernamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!usernamePattern.test(credentials.username)) {
      setError(t('auth.usernameInvalidFormat'));
      return;
    }

    try {
      await signup(credentials);
      showSuccess(t('auth.accountCreatedTitle'), t('auth.accountCreatedMessage'));
      // Navigation will be handled by the app component
    } catch (error) {
      console.error('Signup error:', error);
      const friendlyError = getUserFriendlyError(error);
      
      // Format validation errors if present
      const validationDetails = formatValidationErrors(friendlyError);
      const errorMessage = validationDetails || friendlyError.message;
      
      setError(errorMessage);
      showError(friendlyError.title, errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signUpTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.signUpSubtitle')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                {t('auth.fullNameLabel')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  value={credentials.full_name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('auth.fullNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t('auth.usernameLabel')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('auth.usernamePlaceholder')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('auth.usernameHelp')}
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.emailLabel')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.passwordLabel')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('auth.createPasswordPlaceholder')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('auth.passwordLengthHelp')}
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPasswordLabel')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('auth.confirmPasswordHelp')}
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('auth.creatingAccount')}
                </div>
              ) : (
                t('auth.createAccount')
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.alreadyHaveAccount')}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('auth.signInLink')}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;