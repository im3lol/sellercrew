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
  ArrowRight,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { agents } from '@/lib/agents';

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

const authInputClass =
  'h-12 rounded-xl border-slate-200 bg-white pl-11 text-[15px] shadow-sm shadow-slate-200/30 placeholder:text-slate-400 focus-visible:border-[#7E44E6] focus-visible:ring-4 focus-visible:ring-[#7E44E6]/10';

const authPrimaryClass =
  'h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#035EF9] via-[#7E44E6] to-[#F84D8E] text-[15px] font-semibold text-white shadow-lg shadow-[#7E44E6]/20 transition-all hover:brightness-105 active:scale-[0.99]';

function MobileBrand() {
  const setView = useAppStore((state) => state.setView);

  return (
    <motion.button
      type="button"
      onClick={() => setView('landing')}
      variants={fadeInUp}
      transition={{ duration: 0.4 }}
      className="mb-9 flex items-center gap-2.5 lg:hidden"
    >
      <Image src="/logo2.png" alt="" width={42} height={42} className="rounded-xl" />
      <span className="text-xl font-extrabold tracking-[-0.055em] text-[#0B0F1A]">
        sellercrew
      </span>
    </motion.button>
  );
}

// ─── Left Panel Component ────────────────────────────────────────────────────

function AuthLeftPanel() {
  const setView = useAppStore((state) => state.setView);

  return (
    <aside className="relative hidden h-full w-[46%] max-w-[680px] overflow-hidden bg-[#080C16] p-10 lg:flex xl:p-14">
      <div className="sellercrew-grid absolute inset-0 opacity-25" />
      <motion.div
        animate={{ x: [0, 35, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-32 top-10 size-96 rounded-full bg-[#035EF9]/20 blur-[110px]"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-24 bottom-10 size-[430px] rounded-full bg-[#F84D8E]/15 blur-[120px]"
      />

      <div className="relative z-10 flex w-full flex-col">
        <button
          type="button"
          onClick={() => setView('landing')}
          className="flex w-fit items-center gap-2.5"
        >
          <Image src="/logo2.png" alt="" width={42} height={42} className="rounded-xl" />
          <span className="text-xl font-extrabold tracking-[-0.055em] text-white">
            sellercrew
          </span>
        </button>

        <div className="my-auto py-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold uppercase tracking-[0.22em] text-white/40"
          >
            Your AI product listing team
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-5 max-w-lg text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-white xl:text-5xl"
          >
            Sign in and put the
            <span className="sellercrew-gradient-text block pb-1">whole crew to work.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-5 max-w-md text-sm leading-7 text-white/48"
          >
            Research, strategy, copy, SEO, compliance, creative direction, and QA
            stay connected in one Amazon listing workflow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-9"
          >
            <div className="flex items-center gap-2 text-xs text-white/40">
              <motion.span
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="size-2 rounded-full bg-[#36B46F]"
              />
              11 specialist agents ready
            </div>

            <div className="mt-5 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                transition={{
                  opacity: { delay: 0.3 },
                  scale: { delay: 0.3 },
                  y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="flex flex-col items-center"
              >
                <div
                  className="size-14 overflow-hidden rounded-2xl shadow-lg shadow-black/20"
                  style={{ backgroundColor: agents[0].color }}
                >
                  <Image
                    src={agents[0].avatar}
                    alt={agents[0].name}
                    width={56}
                    height={56}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-white/75">{agents[0].name}</p>
                <p className="mt-0.5 text-[9px] text-white/30">{agents[0].role}</p>
              </motion.div>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-x-3 gap-y-5">
              {agents.slice(1).map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, index % 2 ? 3 : -3, 0] }}
                  transition={{
                    opacity: { delay: 0.3 + index * 0.04 },
                    scale: { delay: 0.3 + index * 0.04 },
                    y: { duration: 4 + index * 0.2, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="min-w-0 text-center"
                >
                  <div
                    className="mx-auto size-11 overflow-hidden rounded-xl shadow-md shadow-black/15"
                    style={{ backgroundColor: agent.color }}
                  >
                    <Image src={agent.avatar} alt={agent.name} width={44} height={44} />
                  </div>
                  <p className="mt-1.5 truncate text-[10px] font-medium text-white/50">
                    {agent.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/30">
          <Sparkles className="size-3.5 text-[#7E44E6]" />
          Structured for Amazon listing teams
        </div>
      </div>
    </aside>
  );
}

// ─── Auth Layout ─────────────────────────────────────────────────────────────

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#F7F8FC]">
      {/* Left dark panel — hidden on mobile */}
      <AuthLeftPanel />

      {/* Right form panel */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto my-auto w-full max-w-[460px] shrink-0 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(11,15,26,0.35)] sm:p-8">
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
  const { setAuthPage, applyAccount } = useAppStore();
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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.user) {
        setErrors({ password: data?.error || 'Sign in failed. Please try again.' });
        return;
      }
      applyAccount({ user: data.user, workspace: data.workspace ?? null });
    } catch {
      setErrors({ password: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
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
        <MobileBrand />

        {/* Header */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0B0F1A] sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to continue your Amazon listing workflow.
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
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
                className={`${authInputClass} ${
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
                className={`${authInputClass} pr-11 ${
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
              className={authPrimaryClass}
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
          className="relative my-6"
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
            className="h-12 w-full rounded-xl border-slate-200 bg-white text-[15px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() =>
              toast.info('Google sign-in is not configured yet. Please use your email and password.')
            }
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
          className="mt-6 text-center text-sm text-gray-500"
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
  const { setAuthPage, applyAccount } = useAppStore();
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
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.user) {
        setErrors({ email: data?.error || 'Could not create the account.' });
        return;
      }
      applyAccount({ user: data.user, workspace: data.workspace ?? null });
    } catch {
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
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
        <MobileBrand />

        {/* Header */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0B0F1A] sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create your workspace and bring the whole crew into your listing process.
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
                className={`${authInputClass} ${
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
                className={`${authInputClass} ${
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
                className={`${authInputClass} pr-11 ${
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
                className={`${authInputClass} pr-11 ${
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
              className={authPrimaryClass}
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
          className="mt-6 text-center text-sm text-gray-500"
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
              className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#035EF9]/12 via-[#7E44E6]/12 to-[#F84D8E]/12"
            >
              <Mail className="size-6 text-[#7E44E6]" />
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
                    className={`${authInputClass} ${
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
                  className={authPrimaryClass}
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
  const { setAuthPage } = useAppStore();
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    // Email verification is not enforced server-side yet. Accounts are active
    // immediately after sign-up, so send the user to sign in.
    toast.success('Your account is ready. Please sign in to continue.');
    setAuthPage('login');
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
          className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#035EF9]/12 via-[#7E44E6]/12 to-[#F84D8E]/12"
        >
          <ShieldCheck className="size-6 text-[#7E44E6]" />
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
            className={`${authPrimaryClass} disabled:opacity-60`}
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
