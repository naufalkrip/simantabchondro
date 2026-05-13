import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RefreshCw, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import logo from '../../assets/logo.png';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <img src={logo} alt="SIMANTAB Logo" className="w-16 h-auto object-contain mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">SIMANTAB</h1>
            <p className="text-sm text-gray-500 mt-2">Sistem Manajemen Informasi Anggota MB Chondro</p>
            <h2 className="text-sm font-semibold text-gray-700 mt-4 uppercase tracking-wider">Lupa Password</h2>
          </div>

          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Anggota</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none"
                placeholder="Masukkan nama lengkap"
                value={forgotName}
                onChange={(e) => setForgotName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none"
                placeholder="Contoh: 08123456789"
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <div className="relative">
                <input
                  type={showForgotPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none pr-10"
                  placeholder="Minimal 3 karakter"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-700"
                >
                  {showForgotPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Keamanan</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  className="min-w-0 flex-1 px-3 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none uppercase text-sm"
                  placeholder="Kode"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  maxLength={5}
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border shrink-0">
                  <span className="font-mono tracking-widest font-bold text-gray-800 select-none text-sm">{captchaCode}</span>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-gray-500 hover:text-gray-800 transition-colors p-1"
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              <KeyRound size={18} className="mr-2" />
              Ganti Password
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={switchToLogin}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <img src={logo} alt="SIMANTAB Logo" className="w-16 h-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">SIMANTAB</h1>
          <p className="text-sm text-gray-500 mt-2">Sistem Manajemen Informasi Anggota MB Chondro</p>
          <h2 className="text-sm font-semibold text-gray-700 mt-4 uppercase tracking-wider">Login Anggota</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon
            </label>
            <input
              type="tel"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none"
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none pr-10"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Keamanan
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                className="min-w-0 flex-1 px-3 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none uppercase text-sm"
                placeholder="Kode"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                maxLength={5}
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border shrink-0">
                <span className="font-mono tracking-widest font-bold text-gray-800 select-none text-sm">{captchaCode}</span>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-gray-500 hover:text-gray-800 transition-colors p-1"
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Masuk
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={switchToForgot}
              className="text-sm text-red-700 hover:text-red-800 font-medium"
            >
              Lupa Password?
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link to="/admin/login" className="text-sm text-red-700 hover:text-red-800 font-medium">
            Login sebagai Admin
          </Link>
        </div>
      </Card>
    </div>
  );
};
