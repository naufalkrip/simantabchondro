import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { LoginLayout } from '../../components/login/LoginLayout';
import { FloatingInput } from '../../components/login/FloatingInput';
import { RefreshCw, Eye, EyeOff, KeyRound, Phone, Lock, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { resetMemberPassword } from '../../services/authService';

type PageMode = 'login' | 'forgot';

export const MemberLogin: React.FC = () => {
  const [mode, setMode] = useState<PageMode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [forgotName, setForgotName] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = sessionStorage.getItem('role');
    const token = sessionStorage.getItem('token');
    if (token && savedRole === 'member') {
      navigate('/member/dashboard');
    }
    generateCaptcha();
  }, [navigate]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
  };

  const switchToForgot = () => {
    setMode('forgot');
    setForgotPhone(phone);
    generateCaptcha();
    setCaptchaAnswer('');
  };

  const switchToLogin = () => {
    setMode('login');
    setForgotName('');
    setForgotPhone('');
    setForgotNewPassword('');
    setShowForgotPassword(false);
    generateCaptcha();
    setCaptchaAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaAnswer.toUpperCase() !== captchaCode) {
      toast.error('CAPTCHA salah. Silakan coba lagi.');
      generateCaptcha();
      setCaptchaAnswer('');
      return;
    }

    if (!phone || !password) {
      toast.error('Nomor Telepon dan Password harus diisi.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting member login for:', phone);

      const { data, error } = await supabase.rpc('login_member', {
        input_phone: phone,
        input_password: password
      });

      console.log('Login RPC response data:', data);
      console.log('Login RPC error:', error);

      if (error) {
        console.error('Supabase RPC Error:', error);
        toast.error(`Database Error: ${error.message || 'Gagal terhubung ke server'}`);
        return;
      }

      if (data && data.length > 0) {
        const member = data[0];
        sessionStorage.setItem('member_id', member.id);
        sessionStorage.setItem('member_name', member.name);

        toast.success(`Selamat datang kembali, ${member.name}!`);
        login(`member-token-${member.id}`, 'member');
        navigate('/member/dashboard');
      } else {
        toast.error('Nomor telepon atau Password salah.');
        generateCaptcha();
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Frontend Member Login Error:', err);
      toast.error('Gagal melakukan login. Periksa koneksi internet Anda.');
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

    if (!forgotName || !forgotPhone || !forgotNewPassword) {
      toast.error('Semua field harus diisi.');
      return;
    }

    if (forgotNewPassword.length < 3) {
      toast.error('Password baru minimal 3 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetMemberPassword(forgotName, forgotPhone, forgotNewPassword);
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
        formTitle="Lupa Password"
        onBack={switchToLogin}
        backLabel="Kembali ke Login"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <FloatingInput
            icon={User}
            label="Nama Anggota"
            type="text"
            required
            value={forgotName}
            onChange={(e) => setForgotName(e.target.value)}
            placeholder="Masukkan nama lengkap"
          />

          <FloatingInput
            icon={Phone}
            label="Nomor Telepon"
            type="tel"
            required
            value={forgotPhone}
            onChange={(e) => setForgotPhone(e.target.value)}
            placeholder="Contoh: 08123456789"
          />

          <FloatingInput
            icon={Lock}
            label="Password Baru"
            type={showForgotPassword ? "text" : "password"}
            required
            value={forgotNewPassword}
            onChange={(e) => setForgotNewPassword(e.target.value)}
            placeholder="Minimal 3 karakter"
            rightElement={
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="text-gray-400 hover:text-primary transition-colors duration-300 p-1"
              >
                {showForgotPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
    <LoginLayout formTitle="Login Anggota">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingInput
          icon={Phone}
          label="Nomor Telepon"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Contoh: 08123456789"
          autoComplete="tel"
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
        <Link to="/admin/login" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300">
          Login sebagai Admin
        </Link>
      </div>
    </LoginLayout>
  );
};
