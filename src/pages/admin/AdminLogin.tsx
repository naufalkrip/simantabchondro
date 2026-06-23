import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { LoginLayout } from '../../components/login/LoginLayout';
import { FloatingInput } from '../../components/login/FloatingInput';
import { RefreshCw, Eye, EyeOff, KeyRound, User, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { resetAdminPassword } from '../../services/authService';

type PageMode = 'login' | 'forgot';

export const AdminLogin: React.FC = () => {
  const [mode, setMode] = useState<PageMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotOldPassword, setForgotOldPassword] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));}
    setCaptchaCode(code);};

  useEffect(() => {
    const savedRole = sessionStorage.getItem('role');
    const token = sessionStorage.getItem('token');
    if (token && savedRole === 'admin') {
      navigate('/admin/dashboard');}
    generateCaptcha();}, [navigate]);

  const switchToForgot = () => {
    setMode('forgot');
    setForgotUsername(username);
    generateCaptcha();
    setCaptchaAnswer('');
  };

  const switchToLogin = () => {
    setMode('login');
    setForgotUsername('');
    setForgotOldPassword('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    generateCaptcha();
    setCaptchaAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaAnswer.toUpperCase() !== captchaCode) {
      toast.error('CAPTCHA salah. Silakan coba lagi.');
      generateCaptcha();
      setCaptchaAnswer('');
      return;}

    if (!username || !password) {
      toast.error('Username dan Password harus diisi.');
      return;}

    setIsLoading(true);

    try {
      console.log('Supabase URL check:', import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING');
      console.log('Attempting login for:', username);

      const { data, error } = await supabase.rpc('login_admin', {
        input_username: username,
        input_password: password
      });

      console.log('RPC Response Data:', data);
      console.log('RPC Response Error:', error);

      if (error) {
        console.error('Supabase RPC Error:', error);
        toast.error(`Database Error: ${error.message || 'Gagal terhubung ke server'}`);
        return;
      }

      if (data && data.length > 0) {
        const admin = data[0];
        toast.success(`Login berhasil! Selamat datang ${admin.username}.`);
        sessionStorage.setItem('admin_username', admin.username);
        login(`admin-token-${admin.id}`, 'admin');
        navigate('/admin/dashboard');
      } else {
        toast.error('Username atau Password salah.');
        generateCaptcha();
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Frontend Login Error:', err);
      toast.error('Terjadi kesalahan pada sistem login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaAnswer.toUpperCase() !== captchaCode) {
      toast.error('CAPTCHA salah. Silakan coba lagi.');
      generateCaptcha();
      setCaptchaAnswer('');
      return;
    }

    if (!forgotUsername || !forgotOldPassword || !forgotNewPassword || !forgotConfirmPassword) {
      toast.error('Semua field harus diisi.');
      return;
    }

    if (forgotNewPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetAdminPassword(forgotUsername, forgotOldPassword, forgotNewPassword);
      if (result.success) {
        toast.success(result.message);
        switchToLogin();
      } else {
        toast.error(result.message);
        generateCaptcha();
        setCaptchaAnswer('');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <LoginLayout
        formTitle="Lupa Password Admin"
        onBack={switchToLogin}
        backLabel="Kembali ke Login"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <FloatingInput
            icon={User}
            label="Username"
            type="text"
            required
            value={forgotUsername}
            onChange={(e) => setForgotUsername(e.target.value)}
            placeholder="Masukkan username"
          />

          <FloatingInput
            icon={Lock}
            label="Password Lama"
            type={showOldPassword ? "text" : "password"}
            required
            value={forgotOldPassword}
            onChange={(e) => setForgotOldPassword(e.target.value)}
            placeholder="Masukkan password saat ini"
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="text-gray-400 hover:text-primary transition-colors duration-300 p-1"
              >
                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <FloatingInput
            icon={Lock}
            label="Password Baru"
            type={showNewPassword ? "text" : "password"}
            required
            value={forgotNewPassword}
            onChange={(e) => setForgotNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-gray-400 hover:text-primary transition-colors duration-300 p-1"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <FloatingInput
            icon={Lock}
            label="Konfirmasi Password Baru"
            type={showConfirmPassword ? "text" : "password"}
            required
            value={forgotConfirmPassword}
            onChange={(e) => setForgotConfirmPassword(e.target.value)}
            placeholder="Ulangi password baru"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-primary transition-colors duration-300 p-1"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Kode Keamanan</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <FloatingInput
                  icon={Shield}
                  label="Kode"
                  type="text"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  maxLength={5}
                  placeholder="Kode"
                  className="uppercase tracking-wider"
                />
              </div>
              <div className="flex items-center gap-3 px-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl shadow-sm shrink-0">
                <span className="font-mono tracking-[0.3em] font-bold text-gray-700 select-none text-base">{captchaCode}</span>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-gray-400 hover:text-primary transition-all duration-300 p-1 hover:rotate-180"
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-base font-semibold rounded-xl from-primary to-primary-dark shadow-red-glow hover:shadow-[0_8px_24px_rgba(214,0,28,0.35)] hover:-translate-y-0.5 transition-all duration-300" size="lg" isLoading={isLoading}>
            <KeyRound size={18} className="mr-2" />
            Ganti Password
          </Button>
        </form>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout formTitle="Login Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingInput
          icon={User}
          label="Username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          autoComplete="username"
        />

        <FloatingInput
          icon={Lock}
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan password"
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-primary transition-colors duration-300 p-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Kode Keamanan</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FloatingInput
                icon={Shield}
                label="Kode"
                type="text"
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                maxLength={5}
                placeholder="Kode"
                className="uppercase tracking-wider"
              />
            </div>
            <div className="flex items-center gap-3 px-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl shadow-sm shrink-0">
              <span className="font-mono tracking-[0.3em] font-bold text-gray-700 select-none text-base">{captchaCode}</span>
              <button
                type="button"
                onClick={generateCaptcha}
                className="text-gray-400 hover:text-primary transition-all duration-300 p-1 hover:rotate-180"
                title="Refresh CAPTCHA"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-base font-semibold rounded-xl from-primary to-primary-dark shadow-red-glow hover:shadow-[0_8px_24px_rgba(214,0,28,0.35)] hover:-translate-y-0.5 transition-all duration-300" size="lg" isLoading={isLoading}>
          Masuk
        </Button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={switchToForgot}
            className="text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300"
          >
            Lupa Password?
          </button>
        </div>
      </form>

      <div className="mt-7 pt-6 border-t border-gray-100 text-center">
        <Link to="/member/login" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300">
          Kembali ke Login Anggota
        </Link>
      </div>
    </LoginLayout>
  );
};
