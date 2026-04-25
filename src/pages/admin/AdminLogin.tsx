import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/logo.png';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
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
    if (token && savedRole === 'admin') {
      navigate('/admin/dashboard');}
    generateCaptcha();}, [navigate]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));}
    setCaptchaCode(code);};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaAnswer.toUpperCase() !== captchaCode) {
      setError('CAPTCHA salah. Silakan coba lagi.');
      generateCaptcha();
      setCaptchaAnswer('');
      return;}

    if (!username || !password) {
      setError('Username dan Password harus diisi.');
      return;}

    // Simulate login success (In a real app, this would be an API call)
    const savedUsername = localStorage.getItem('admin_username') || '111';
    const savedPassword = localStorage.getItem('admin_password') || '111';
    
    if (username === savedUsername && password === savedPassword) {
      login(`admin-token-${Date.now()}`, 'admin');
      navigate('/admin/dashboard');} else {
      setError('Username atau Password salah.');
      generateCaptcha();
      setCaptchaAnswer('');}};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <img src={logo} alt="SIMANTAB Logo" className="w-16 h-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">SIMANTAB</h1>
          <p className="text-sm text-gray-500 mt-2">Sistem Manajemen Informasi Anggota MB Chondro</p>
          <h2 className="text-sm font-semibold text-gray-700 mt-4 ">Login Admin</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-red-700 focus:border-red-700 outline-none"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          <Link to="/member/login" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            Kembali ke Login Anggota
          </Link>
        </div>
      </Card>
    </div>
  );
};


