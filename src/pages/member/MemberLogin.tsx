import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/logo.png';

export const MemberLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaAnswer.toUpperCase() !== captchaCode) {
      setError('CAPTCHA salah. Silakan coba lagi.');
      generateCaptcha();
      setCaptchaAnswer('');
      return;
    }

    if (!phone || !password) {
      setError('Nomor Telepon dan Password harus diisi.');
      return;
    }

    // New Login Logic
    const { getMembers } = await import('../../services/memberService');
    const members = await getMembers();
    
    // Find member by phone number
    const member = members.find(m => m.phone === phone);

    if (!member) {
      setError('Nomor telepon tidak terdaftar.');
      return;
    }

    // Check password (default 111 as requested)
    if (password !== '111' && password !== member.password) {
      setError('Password salah.');
      return;
    }

    // Store member info for the portal
    localStorage.setItem('member_id', member.id);
    localStorage.setItem('member_name', member.name);
    
    login(`member-token-${member.id}`, 'member');
    navigate('/member/dashboard');
  };

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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full" size="lg">
            Masuk
          </Button>
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
