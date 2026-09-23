'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Gamepad2,
  Shield,
} from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/validators/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register: authRegister } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await authRegister(data);
      toast.success(
        'Account created!',
        'Welcome to Dark Syndicate Gaming World.'
      );
      router.push('/');
    } catch (error) {
      toast.error(
        'Registration failed',
        error instanceof Error ? error.message : 'Something went wrong'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 gradient-bg">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-ds-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-ds-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 animate-pulse-glow">
            <Gamepad2 className="w-8 h-8 text-ds-accent" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-ds-text tracking-wider">
            DARK <span className="gradient-text">SYNDICATE</span>
          </h1>
          <p className="text-ds-text-muted mt-1 font-body text-lg">
            Create your gaming account
          </p>
        </div>

        {/* Register Form */}
        <div className="glass-strong rounded-2xl p-8 shadow-elevated">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('firstName')}
                label="First Name"
                type="text"
                placeholder="John"
                error={errors.firstName?.message}
                icon={<User className="w-4 h-4" />}
                autoComplete="given-name"
                id="register-first-name"
              />
              <Input
                {...register('lastName')}
                label="Last Name"
                type="text"
                placeholder="Doe"
                error={errors.lastName?.message}
                autoComplete="family-name"
                id="register-last-name"
              />
            </div>

            <Input
              {...register('email')}
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              id="register-email"
            />

            <Input
              {...register('phone')}
              label="Phone Number"
              type="tel"
              placeholder="+91 9876543210"
              error={errors.phone?.message}
              icon={<Phone className="w-4 h-4" />}
              hint="Optional — used for booking confirmations"
              autoComplete="tel"
              id="register-phone"
            />

            <Input
              {...register('password')}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              error={errors.password?.message}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              id="register-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-ds-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <Input
              {...register('confirmPassword')}
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              icon={<Shield className="w-4 h-4" />}
              autoComplete="new-password"
              id="register-confirm-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="hover:text-ds-text transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <Button
              type="submit"
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              className="mt-2"
              id="register-submit"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ds-text-muted">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-ds-accent hover:text-ds-accent-hover transition-colors font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-ds-text-dim mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-ds-accent hover:underline">
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
}
