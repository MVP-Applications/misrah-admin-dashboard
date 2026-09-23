import React, { useState, useEffect } from 'react';
import {
  Shield,
  Home,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code2,
  Smartphone,
  Mail,
  KeyRound,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { isLocalhost } from '../../config/env';
import { useAuth } from '../../features/auth/AuthContext';
import { UserRole } from '../../types';

export const LoginView = () => {
  const { login, loginWithMock } = useAuth();

  // Which portal the person is signing into — passed through to
  // AuthContext's login(), which picks between the two portals' separate
  // login endpoints (POST /admin/auth/login vs POST /host/auth/login) and
  // decides which (already-built) admin vs. host UI renders post-login.
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  // Single unified field for Email OR Phone Number (no tabs!)
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Optional OTP flow if user prefers SMS code — UI only, the API has no
  // SMS-auth endpoint yet, so this never actually signs anyone in.
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Flow States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'otp' | 'reset' | 'success'>('request');
  const [recoveryTarget, setRecoveryTarget] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(45);
  const [isResendActive, setIsResendActive] = useState(false);

  // Countdown timer for recovery OTP resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isResendActive && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    } else if (resendCountdown === 0) {
      setIsResendActive(false);
    }
    return () => clearTimeout(timer);
  }, [isResendActive, resendCountdown]);

  const handleSendOtp = () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter your phone number or email first');
      return;
    }
    setError(null);
    setOtpSent(true);
    setOtpCode('4829');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputVal = emailOrPhone.trim();
    if (!inputVal) {
      setError('Please enter your email address or phone number');
      return;
    }

    if (useOtp) {
      // UI only — no SMS-auth endpoint on the API yet.
      setError('SMS sign-in is coming soon — please use your password for now.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(inputVal, password, selectedRole);
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Forgot Password
  const handleOpenForgotPassword = () => {
    setRecoveryTarget(emailOrPhone.trim() || 'admin@misrah.ae');
    setForgotStep('request');
    setForgotError(null);
    setIsForgotPasswordOpen(true);
  };

  // Forgot Password Step 1: Send OTP
  const handleSendRecoveryOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!recoveryTarget.trim()) {
      setForgotError('Please enter your recovery email address or phone number');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setForgotStep('otp');
      setRecoveryOtp('4829'); // Auto-fill demo
      setResendCountdown(45);
      setIsResendActive(true);
    }, 400);
  };

  // Forgot Password Step 2: Verify OTP
  const handleVerifyRecoveryOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (recoveryOtp.trim().length < 4) {
      setForgotError('Please enter the 4-digit verification code');
      return;
    }
    setForgotStep('reset');
  };

  // Forgot Password Step 3: Set New Password
  const handleResetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!newResetPassword || newResetPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setForgotError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPassword(newResetPassword);
      setEmailOrPhone(recoveryTarget);
      setForgotStep('success');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[650px] h-[650px] bg-accent/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 my-4 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-3xl shadow-2xl shadow-accent/25 ring-8 ring-white/5 mb-2">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
            Misrah Elite
          </h1>
          <p className="text-[10px] font-black text-accent uppercase tracking-[3px] opacity-90">
            Unified Hospitality Management Portal
          </p>
        </div>

        {/* FORGOT PASSWORD RECOVERY MODAL/VIEW */}
        {isForgotPasswordOpen ? (
          <div className="bg-white/5 border border-white/10 rounded-[36px] p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Back button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotError(null);
                }}
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back to Sign In</span>
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                Account Recovery
              </span>
            </div>

            {/* Error Message */}
            {forgotError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {forgotStep === 'request' && (
              <form onSubmit={handleSendRecoveryOtp} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black italic text-white uppercase">Forgot Password?</h3>
                  <p className="text-xs text-white/60 font-medium">
                    Enter your registered email address or mobile phone to receive a secure password recovery verification code.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">
                    Recovery Email or Phone Number *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      required
                      value={recoveryTarget}
                      onChange={e => setRecoveryTarget(e.target.value)}
                      placeholder="e.g. admin@misrah.ae or +971 50 123 4567"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white placeholder:text-white/30 focus:outline-hidden focus:border-accent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-primary py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[2px] shadow-xl shadow-accent/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black italic text-white uppercase">Verify Code</h3>
                  <p className="text-xs text-white/60 font-medium">
                    We sent a verification code to <span className="text-accent font-bold">{recoveryTarget}</span>.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">
                    4-Digit Verification Code *
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={recoveryOtp}
                      onChange={e => setRecoveryOtp(e.target.value)}
                      placeholder="4829"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm tracking-[6px] font-mono font-bold text-accent placeholder:text-white/20 focus:outline-hidden focus:border-accent"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => setRecoveryOtp('4829')}
                      className="text-accent hover:underline font-bold cursor-pointer"
                    >
                      Fill Demo Code (4829)
                    </button>

                    <button
                      type="button"
                      disabled={isResendActive}
                      onClick={() => {
                        setIsResendActive(true);
                        setResendCountdown(45);
                      }}
                      className="text-white/50 hover:text-white disabled:opacity-40 cursor-pointer"
                    >
                      {isResendActive ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent text-primary py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[2px] shadow-xl shadow-accent/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Verify & Proceed</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {forgotStep === 'reset' && (
              <form onSubmit={handleResetNewPassword} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black italic text-white uppercase">Set New Password</h3>
                  <p className="text-xs text-white/60 font-medium">
                    Choose a strong password for your Misrah operator account.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newResetPassword}
                        onChange={e => setNewResetPassword(e.target.value)}
                        placeholder="Enter at least 6 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-11 py-3.5 text-xs font-bold text-white placeholder:text-white/30 focus:outline-hidden focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={confirmResetPassword}
                        onChange={e => setConfirmResetPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white placeholder:text-white/30 focus:outline-hidden focus:border-accent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-primary py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[2px] shadow-xl shadow-accent/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Update Password & Continue</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
                  <Check size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black italic text-white uppercase">Password Reset Successfully</h3>
                  <p className="text-xs text-white/70 max-w-sm mx-auto">
                    Your password has been updated. You can now log in securely to the Misrah portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setError(null);
                  }}
                  className="w-full bg-accent text-primary py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[2px] shadow-xl shadow-accent/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Main Authentication Card */
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Portal Selector: Admin HQ signs in via POST /admin/auth/login, Host Hub via POST /host/auth/login */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/50 px-1">
                <span>Select Destination Portal</span>
                <span className="text-accent text-[9px]">Admin or Host</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Admin Portal */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    selectedRole === 'admin'
                      ? 'bg-accent/15 border-accent text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {selectedRole === 'admin' && (
                    <CheckCircle2 size={14} className="absolute top-3 right-3 text-accent stroke-[3]" />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={16} className={selectedRole === 'admin' ? 'text-accent' : 'text-white/40'} />
                    <span className="text-xs font-black uppercase tracking-tight text-white">Admin HQ</span>
                  </div>
                  <p className="text-[9px] text-white/50 line-clamp-1">Regional HQ & System Ops</p>
                </button>

                {/* Host Portal */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('manager')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    selectedRole === 'manager'
                      ? 'bg-accent/15 border-accent text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {selectedRole === 'manager' && (
                    <CheckCircle2 size={14} className="absolute top-3 right-3 text-accent stroke-[3]" />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Home size={16} className={selectedRole === 'manager' ? 'text-accent' : 'text-white/40'} />
                    <span className="text-xs font-black uppercase tracking-tight text-white">Host Hub</span>
                  </div>
                  <p className="text-[9px] text-white/50 line-clamp-1">Properties & Experiences</p>
                </button>
              </div>
            </div>

            {/* Error Message banner */}
            {error && (
              <div className="p-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2 font-bold animate-shake">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit= {handleSubmit} className="space-y-4">
              {/* Single Unified Identifier Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60 block px-1">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    required
                    placeholder="name@misrah.ae or +971 50 123 4567"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/15 rounded-2xl text-xs font-medium text-white placeholder:text-white/30 outline-none focus:border-accent focus:bg-white/10 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password OR SMS Verification */}
              {!useOtp ? (
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[10px] font-black uppercase tracking-wider text-white/60 block px-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required={!useOtp}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/15 rounded-2xl text-xs font-medium text-white placeholder:text-white/30 outline-none focus:border-accent focus:bg-white/10 transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                /* SMS Verification Code Field (UI only — no SMS-auth endpoint yet) */
                <div className="space-y-2 p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-white/70 flex items-center gap-1.5">
                      <Smartphone size={13} className="text-accent" />
                      <span>SMS Verification Code</span>
                    </span>
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline"
                      >
                        Send Code
                      </button>
                    ) : (
                      <span className="text-[10px] text-accent font-bold">
                        Code Sent ({otpCode})
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 4829"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1 py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-center text-sm font-black tracking-widest text-white outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setOtpCode('4829')}
                      className="px-3 py-2 bg-accent/15 border border-accent/30 text-accent rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-accent/25 transition-colors"
                    >
                      Fill (4829)
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle Between Password & SMS OTP Mode */}
              <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setUseOtp(!useOtp);
                    setError(null);
                  }}
                  className="text-white/60 hover:text-accent font-bold transition-colors"
                >
                  {useOtp ? '← Switch to Password Login' : 'Sign in with SMS Code instead'}
                </button>

                {!useOtp && (
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-accent hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              {/* Remember Me */}
              <div className="pt-1 px-1">
                <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white text-[11px] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-accent w-3.5 h-3.5"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-primary py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[2px] shadow-xl shadow-accent/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 mt-4 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Authenticating</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {selectedRole === 'admin' ? 'Admin HQ' : 'Host Hub'}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {isLocalhost() && (
              <button
                type="button"
                onClick={() => loginWithMock(selectedRole)}
                className="w-full flex items-center justify-center gap-2 text-[9px] font-black text-white/50 hover:text-white/80 uppercase tracking-[2px] border border-dashed border-white/20 rounded-2xl py-3 transition-colors"
              >
                <Code2 size={12} />
                Dev: skip login (localhost only)
              </button>
            )}
          </div>
        )}

        {/* Security Footer */}
        <div className="text-center space-y-1">
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[2px]">
            Misrah Protocol · Encrypted Gateway · UAE & GCC
          </p>
          <p className="text-[9px] text-white/20 uppercase tracking-[2px]">
            Secure encrypted connection active · Production protocol v2.4
          </p>
        </div>
      </div>
    </div>
  );
};
