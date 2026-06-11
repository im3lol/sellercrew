'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type AuthPage } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';

// ─── Animation Variants ──────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

// ─── Left Panel Component ────────────────────────────────────────────────────

function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative overflow-hidden bg-[#0B0F1A] flex-col items-center justify-center p-10">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#035EF9]/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decorative floating elements */}
      <motion.div
        className="absolute top-16 left-16 w-3 h-3 rounded-full bg-[#035EF9]/30"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-32 right-20 w-2 h-2 rounded-full bg-purple-400/30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-32 left-24 w-4 h-4 rounded-full bg-cyan-400/20"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-[72px] h-[72px] rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center p-2 shadow-lg shadow-black/20">
            <Image
              src="/logo2.png"
              alt="SellerCrew"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
        </motion.div>

        {/* Logo text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-6"
        >
          <Image
            src="/logo-text.png"
            alt="SellerCrew"
            width={180}
            height={36}
            className="object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-2xl font-bold text-white mb-4 leading-tight"
        >
          Your AI Product
          <br />
          <span
            className="bg-gradient-to-r from-[#035EF9] via-cyan-400 to-[#035EF9] bg-clip-text"
            style={{ WebkitTextFillColor: 'transparent' }}
          >
            Listing Team
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="text-white/50 text-sm max-w-[320px] leading-relaxed mb-10"
        >
          Work with specialized AI agents that handle every step of your Amazon
          product listing journey.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col gap-3 w-full max-w-[300px]"
        >
          {[
            { icon: Sparkles, text: 'AI-Powered Listing Optimization' },
            { icon: ShieldCheck, text: 'Compliance-First Approach' },
            { icon: CheckCircle2, text: 'Multi-Agent Collaboration' },
          ].map((feature, i) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
            >
              <feature.icon className="h-4 w-4 text-[#035EF9] shrink-0" />
              <span className="text-xs text-white/70">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Auth Layout ─────────────────────────────────────────────────────────────

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left dark panel — hidden on mobile */}
      <AuthLeftPanel />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────────

function LoginPage() {
  const { setAuthPage, login } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    login({
      id: 'demo-user',
      email: email,
      name: 'Demo User',
      avatar: null,
    });
    setIsLoading(false);
  };

  return (
    <motion.div
      key="login"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col"
      >
        {/* Mobile logo */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-8 lg:hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0B0F1A] flex items-center justify-center p-1.5">
            <Image
              src="/logo2.png"
              alt="SellerCrew"
              width={28}
              height={28}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <Image
            src="/logo-text.png"
            alt="SellerCrew"
            width={120}
            height={24}
            className="object-contain"
          />
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0F1A] tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Sign in to your SellerCrew account
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
            <Label htmlFor="login-email" className="text-[13px] font-medium text-gray-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`h-11 pl-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                  errors.email ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                }`}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-[13px] font-medium text-gray-700">
                Password
              </Label>
              <button
                type="button"
                onClick={() => setAuthPage('forgot-password')}
                className="text-xs font-medium text-[#035EF9] hover:text-[#024fd4] transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`h-11 pl-10 pr-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                  errors.password ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                }`}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#035EF9] hover:bg-[#024fd4] text-white font-semibold text-[15px] rounded-lg shadow-md shadow-[#035EF9]/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="relative my-8"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">or</span>
          </div>
        </motion.div>

        {/* Social login */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-medium text-[15px] rounded-lg transition-all"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                login({
                  id: 'demo-user',
                  email: 'demo@sellercrew.ai',
                  name: 'Demo User',
                  avatar: null,
                });
              }, 800);
            }}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </motion.div>

        {/* Sign up link */}
        <motion.p
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthPage('register')}
            className="font-semibold text-[#035EF9] hover:text-[#024fd4] transition-colors"
          >
            Sign up
          </button>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ─── Register Page ───────────────────────────────────────────────────────────

function RegisterPage() {
  const { setAuthPage, login } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    login({
      id: 'demo-user',
      email: email,
      name: name.trim(),
      avatar: null,
    });
    setIsLoading(false);
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return { level: 1, label: 'Weak', color: 'bg-red-400' };
    if (strength <= 2) return { level: 2, label: 'Fair', color: 'bg-yellow-400' };
    if (strength <= 3) return { level: 3, label: 'Good', color: 'bg-blue-400' };
    return { level: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <motion.div
      key="register"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col"
      >
        {/* Mobile logo */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-8 lg:hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0B0F1A] flex items-center justify-center p-1.5">
            <Image
              src="/logo2.png"
              alt="SellerCrew"
              width={28}
              height={28}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <Image
            src="/logo-text.png"
            alt="SellerCrew"
            width={120}
            height={24}
            className="object-contain"
          />
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0F1A] tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Start your journey with SellerCrew
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
            <Label htmlFor="register-name" className="text-[13px] font-medium text-gray-700">
              Full name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="register-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`h-11 pl-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                  errors.name ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                }`}
                aria-invalid={!!errors.name}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
            <Label htmlFor="register-email" className="text-[13px] font-medium text-gray-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="register-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`h-11 pl-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                  errors.email ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                }`}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
            <Label htmlFor="register-password" className="text-[13px] font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`h-11 pl-10 pr-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                  errors.password ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                }`}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>
            )}
            {/* Password strength */}
            {password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= passwordStrength.level
                          ? passwordStrength.color
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-400 w-12 text-right">
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
            <Label htmlFor="register-confirm-password" className="text-[13px] font-medium text-gray-700">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                className={`h-11 pl-10 pr-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                  errors.confirmPassword
                    ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20'
                    : ''
                }`}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>
            )}
          </motion.div>

          {/* Terms */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
            className="text-xs text-gray-400 leading-relaxed"
          >
            By creating an account, you agree to our{' '}
            <span className="text-[#035EF9] cursor-pointer hover:underline">Terms of Service</span>{' '}
            and{' '}
            <span className="text-[#035EF9] cursor-pointer hover:underline">Privacy Policy</span>.
          </motion.p>

          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#035EF9] hover:bg-[#024fd4] text-white font-semibold text-[15px] rounded-lg shadow-md shadow-[#035EF9]/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </motion.div>
        </form>

        {/* Sign in link */}
        <motion.p
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthPage('login')}
            className="font-semibold text-[#035EF9] hover:text-[#024fd4] transition-colors"
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ─── Forgot Password Page ────────────────────────────────────────────────────

function ForgotPasswordPage() {
  const { setAuthPage } = useAppStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validate = useCallback(() => {
    const newErrors: { email?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSent(true);
    setIsLoading(false);
  };

  return (
    <motion.div
      key="forgot-password"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col"
      >
        {/* Back link */}
        <motion.button
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          onClick={() => setAuthPage('login')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8 w-fit group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </motion.button>

        {!isSent ? (
          <>
            {/* Icon */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="w-12 h-12 rounded-xl bg-[#035EF9]/10 flex items-center justify-center mb-5"
            >
              <Mail className="h-6 w-6 text-[#035EF9]" />
            </motion.div>

            {/* Header */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0F1A] tracking-tight">
                Forgot password?
              </h1>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                No worries! Enter your email address and we&apos;ll send you a
                link to reset your password.
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
                <Label htmlFor="forgot-email" className="text-[13px] font-medium text-gray-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={`h-11 pl-10 bg-gray-50/80 border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-[#035EF9] focus-visible:ring-[#035EF9]/20 ${
                      errors.email ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                    }`}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
                )}
              </motion.div>

              <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#035EF9] hover:bg-[#024fd4] text-white font-semibold text-[15px] rounded-lg shadow-md shadow-[#035EF9]/20 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </motion.div>
            </form>
          </>
        ) : (
          /* Success state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center py-4"
          >
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#0B0F1A] mb-2">
              Check your email
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
            <Button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail('');
              }}
              variant="outline"
              className="mt-8 border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            >
              Didn&apos;t receive the email? Try again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Verify Email Page ───────────────────────────────────────────────────────

function VerifyEmailPage() {
  const { setAuthPage, login } = useAppStore();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  // Cooldown timer for resend
  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setError('');
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mock verification — accept any 6-digit code
    login({
      id: 'demo-user',
      email: 'demo@sellercrew.ai',
      name: 'Demo User',
      avatar: null,
    });
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsResending(false);
    startCooldown();
  };

  return (
    <motion.div
      key="verify-email"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col"
      >
        {/* Back link */}
        <motion.button
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          onClick={() => setAuthPage('login')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8 w-fit group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </motion.button>

        {/* Icon */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="w-12 h-12 rounded-xl bg-[#035EF9]/10 flex items-center justify-center mb-5"
        >
          <ShieldCheck className="h-6 w-6 text-[#035EF9]" />
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0F1A] tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            We&apos;ve sent a 6-digit verification code to your email address.
            Please enter it below.
          </p>
        </motion.div>

        {/* OTP Input */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="mt-8 flex flex-col items-center"
        >
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError('');
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot
                index={0}
                className="h-12 w-12 text-lg font-semibold border-gray-200 bg-gray-50/80 data-[active=true]:border-[#035EF9] data-[active=true]:ring-[#035EF9]/20"
              />
              <InputOTPSlot
                index={1}
                className="h-12 w-12 text-lg font-semibold border-gray-200 bg-gray-50/80 data-[active=true]:border-[#035EF9] data-[active=true]:ring-[#035EF9]/20"
              />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot
                index={2}
                className="h-12 w-12 text-lg font-semibold border-gray-200 bg-gray-50/80 data-[active=true]:border-[#035EF9] data-[active=true]:ring-[#035EF9]/20"
              />
              <InputOTPSlot
                index={3}
                className="h-12 w-12 text-lg font-semibold border-gray-200 bg-gray-50/80 data-[active=true]:border-[#035EF9] data-[active=true]:ring-[#035EF9]/20"
              />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot
                index={4}
                className="h-12 w-12 text-lg font-semibold border-gray-200 bg-gray-50/80 data-[active=true]:border-[#035EF9] data-[active=true]:ring-[#035EF9]/20"
              />
              <InputOTPSlot
                index={5}
                className="h-12 w-12 text-lg font-semibold border-gray-200 bg-gray-50/80 data-[active=true]:border-[#035EF9] data-[active=true]:ring-[#035EF9]/20"
              />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="text-xs text-red-500 mt-3">{error}</p>
          )}
        </motion.div>

        {/* Verify button */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="mt-6"
        >
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isLoading || otp.length < 6}
            className="w-full h-11 bg-[#035EF9] hover:bg-[#024fd4] text-white font-semibold text-[15px] rounded-lg shadow-md shadow-[#035EF9]/20 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify email'
            )}
          </Button>
        </motion.div>

        {/* Resend code */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="mt-6 flex items-center justify-center gap-1"
        >
          <span className="text-sm text-gray-500">Didn&apos;t receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="text-sm font-semibold text-[#035EF9] hover:text-[#024fd4] transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main AuthPages Export ───────────────────────────────────────────────────

export function AuthPages() {
  const authPage = useAppStore((s) => s.authPage);

  const renderPage = () => {
    switch (authPage) {
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'verify-email':
        return <VerifyEmailPage />;
      default:
        return <LoginPage />;
    }
  };

  return <AuthLayout>{renderPage()}</AuthLayout>;
}

export { AuthLayout, LoginPage, RegisterPage, ForgotPasswordPage, VerifyEmailPage };
