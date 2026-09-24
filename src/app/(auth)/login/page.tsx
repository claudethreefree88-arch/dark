'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, User, KeyRound } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/validators/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!', 'You have been logged in successfully.');
      router.push(redirectTarget);
    } catch (error) {
      toast.error(
        'Login failed',
        error instanceof Error ? error.message : 'Invalid credentials'
      );
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-bg py-12">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ds-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ds-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in-up space-y-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-ds-surface/80 border border-ds-accent/40 shadow-glow mb-4 p-1"
          >
            <Image
              src="/logo.png"
              alt="DARK SYNDICATE Logo"
              width={72}
              height={72}
              className="w-full h-full object-contain"
              priority
            />
          </Link>
          <h1 className="text-3xl font-heading font-extrabold text-ds-text tracking-wider">
            DARK <span className="gradient-text">SYNDICATE</span>
          </h1>
          <p className="text-ds-text-muted mt-1 font-body text-base">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Demo Fast Logins for reviewers */}
        <div className="p-3.5 rounded-xl bg-ds-surface/60 border border-ds-border text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-ds-ice font-semibold">
            <KeyRound className="w-3.5 h-3.5 text-ds-accent" />
            <span>Quick Test Credentials:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@darksyndicate.com', 'Admin@123456')}
              className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-[11px] font-heading font-bold"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('staff@darksyndicate.com', 'Staff@123456')}
              className="p-1.5 rounded-lg bg-ds-accent/10 border border-ds-accent/30 text-ds-ice hover:bg-ds-accent/20 text-[11px] font-heading font-bold"
            >
              🎮 Staff
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('player@example.com', 'Customer@123')}
              className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-heading font-bold"
            >
              🕹️ Gamer
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="glass-strong rounded-2xl p-8 shadow-elevated">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              {...register('email')}
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              id="login-email"
            />

            <Input
              {...register('password')}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              error={errors.password?.message}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              id="login-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-ds-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-ds-accent hover:text-ds-accent-hover transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              className="mt-2"
              id="login-submit"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-ds-text-muted">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-ds-accent hover:text-ds-accent-hover transition-colors font-semibold"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-ds-text-dim">
          © {new Date().getFullYear()} Dark Syndicate Gaming World. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ds-darker flex items-center justify-center text-ds-ice">
          <div className="w-8 h-8 border-2 border-ds-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
