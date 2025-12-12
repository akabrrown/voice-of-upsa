import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { signUpWithEmail } from '@/lib/supabase-client';
import { getSupabaseClient } from '@/lib/supabaseClient';

const SignUpPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push('/');
      }
    };

    if (mounted) {
      checkSession();
    }
  }, [router, mounted]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) strength += 1;
    else feedback.push('at least 8 characters');

    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    else feedback.push('uppercase and lowercase letters');

    if (/\d/.test(password)) strength += 1;
    else feedback.push('numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    else feedback.push('special characters');

    const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    const strengthColor = strengthColors[strength] || 'bg-red-500';
    setPasswordStrength(strength);
    setPasswordStrengthText(strengthTexts[strength] || 'Very Weak');
    
    return { strength, strengthColor, feedback };
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!fullName || fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters long';
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const { feedback } = calculatePasswordStrength(password);
      if (password.length < 8) {
        newErrors.password = `Password must have ${feedback.join(', ')}`;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await signUpWithEmail(email, password, {
        full_name: fullName,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success('Account created successfully! Please check your email to verify your account.');
        router.push('/auth/sign-in');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center text-navy hover:text-golden transition-colors mb-6">
                <FiArrowLeft className="mr-2" />
                Back to Home
              </Link>
              
              <div className="flex justify-center mb-6">
                <Image
                  src="/logo.jpg"
                  alt="Voice of UPSA Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full"
                  loading="eager"
                  priority
                  unoptimized
                />
              </div>
              
              <h1 className="text-3xl font-bold text-navy mb-2">Create Your Account</h1>
              <p className="text-gray-600">Join our community today</p>
            </div>

            <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        calculatePasswordStrength(e.target.value);
                      }}
                      className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength <= 2 ? 'text-red-500' : 
                          passwordStrength === 3 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {passwordStrengthText}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength <= 2 ? 'bg-red-500' : 
                            passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-navy hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/auth/sign-in"
                    className="w-full flex justify-center py-3 px-4 border border-navy rounded-lg shadow-sm text-sm font-medium text-navy bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden transition-colors duration-200"
                  >
                    Sign In to Existing Account
                  </Link>
                </div>
              </div>

                          </div>
          </motion.div>
        </div>
      </div>
    );
};

export default SignUpPage;
