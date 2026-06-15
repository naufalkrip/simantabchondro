import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, ShieldCheck, CreditCard, Key, LogOut, Copy, Edit3,
  Eye, EyeOff, Check, X, Building2, UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { getSetting, updateSetting, changeAdminPassword, invalidateAdminSessions } from '../../services/settingsService';

const BANK_OPTIONS = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Dana', 'OVO', 'Gopay', 'ShopeePay'];

const PASSWORD_RULES = {
  minLength: (v: string) => v.length >= 8,
  hasUpper: (v: string) => /[A-Z]/.test(v),
  hasDigit: (v: string) => /[0-9]/.test(v),
} as const;

type RuleKey = keyof typeof PASSWORD_RULES;

const RULE_LABELS: Record<RuleKey, string> = {
  minLength: 'Minimal 8 karakter',
  hasUpper: 'Huruf besar (A-Z)',
  hasDigit: 'Angka (0-9)',
};

function getStrength(score: number) {
  if (score <= 1) return { label: 'Lemah', color: 'bg-red-500', width: '33%' };
  if (score === 2) return { label: 'Sedang', color: 'bg-yellow-500', width: '66%' };
  return { label: 'Kuat', color: 'bg-green-500', width: '100%' };
}

export const Pengaturan: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminUsername = sessionStorage.getItem('admin_username') || 'admin';

  // Bank info query
  const { data: bankInfo, isLoading: isLoadingBank } = useQuery({
    queryKey: ['settings', 'bank_info'],
    queryFn: () => getSetting('bank_info').then(res => res || {
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'ADMIN SIMANTAB'
    })
  });

  // Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditBankOpen, setIsEditBankOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Bank form state
  const [formBank, setFormBank] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  // Password validation
  const passwordValidation = useMemo(() => {
    const checks: Record<RuleKey, boolean> = {
      minLength: PASSWORD_RULES.minLength(passwordForm.newPassword),
      hasUpper: PASSWORD_RULES.hasUpper(passwordForm.newPassword),
      hasDigit: PASSWORD_RULES.hasDigit(passwordForm.newPassword),
    };
    const score = Object.values(checks).filter(Boolean).length;
    const confirmMatch = passwordForm.confirmPassword === passwordForm.newPassword;
    const allValid = score === 3 && confirmMatch && passwordForm.newPassword.length > 0;
    return { checks, score, confirmMatch, allValid };
  }, [passwordForm]);

  const strength = useMemo(() => getStrength(passwordValidation.score), [passwordValidation.score]);

  // Mutations
  const changePasswordMutation = useMutation({
    mutationFn: () => changeAdminPassword(passwordForm.oldPassword, passwordForm.newPassword),
    onSuccess: (res) => {
      if (res.success) {
        setIsPasswordModalOpen(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    },
    onError: () => toast.error('Terjadi kesalahan sistem'),
  });

  const updateBankMutation = useMutation({
    mutationFn: (newBank: typeof formBank) => updateSetting('bank_info', newBank),
    onSuccess: (success) => {
      if (success) {
        setIsEditBankOpen(false);
        queryClient.invalidateQueries({ queryKey: ['settings', 'bank_info'] });
        toast.success('Informasi rekening admin berhasil diperbarui');
      } else {
        toast.error('Gagal memperbarui rekening admin');
      }
    },
  });

  // Handlers
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValidation.allValid) return;
    changePasswordMutation.mutate();
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBank.accountHolder || !formBank.accountNumber || !formBank.bankName) {
      toast.error('Semua field rekening harus diisi');
      return;
    }
    if (!/^\d{8,}$/.test(formBank.accountNumber.replace(/\s/g, ''))) {
      toast.error('Nomor rekening minimal 8 digit angka');
      return;
    }
    updateBankMutation.mutate(formBank);
  };

  const handleLogoutSessions = async () => {
    setIsLogoutConfirmOpen(false);
    const res = await invalidateAdminSessions();
    if (res.success) {
      sessionStorage.clear();
      toast.success('Semua session berhasil dinonaktifkan');
      navigate('/admin/login');
    } else {
      toast.error(res.message);
    }
  };

  const handleCopyNumber = () => {
    const num = bankInfo?.accountNumber || '';
    navigator.clipboard.writeText(num).then(() => {
      toast.success('Nomor rekening tersalin');
    }).catch(() => {
      toast.error('Gagal menyalin nomor rekening');
    });
  };

  const openEditBank = () => {
    if (bankInfo) {
      setFormBank({
        bankName: bankInfo.bankName || '',
        accountNumber: bankInfo.accountNumber || '',
        accountHolder: bankInfo.accountHolder || '',
      });
    }
    setIsEditBankOpen(true);
  };

  const formatAccountNumber = (num: string) => {
    return num.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const resetPasswordForm = () => {
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
          <span>Dashboard</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Pengaturan Sistem</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg shrink-0">
            <Settings size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pengaturan Sistem</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola akun admin, keamanan login, dan rekening transaksi organisasi.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5">

        {/* Card 1: Akun & Keamanan Admin */}
        <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg shrink-0">
                <ShieldCheck size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Akun &amp; Keamanan Admin</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kelola autentikasi dan keamanan akun administrator.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Username</p>
                <p className="text-sm font-semibold text-gray-900">{adminUsername}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Role</p>
                <p className="text-sm font-semibold text-gray-900">Administrator</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Status Akun</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-700">Aktif</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Auth Provider</p>
                <p className="text-sm font-semibold text-gray-900">Custom RPC</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={() => { resetPasswordForm(); setIsPasswordModalOpen(true); }}
              >
                <Key size={14} />
                Ubah Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => setIsLogoutConfirmOpen(true)}
              >
                <LogOut size={14} />
                Logout Semua Session
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Rekening Transaksi Admin */}
        <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                <CreditCard size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Rekening Transaksi Admin</h2>
                <p className="text-xs text-gray-500 mt-0.5">Rekening tujuan transfer setoran anggota.</p>
              </div>
            </div>

            {isLoadingBank ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Memuat data rekening...
              </div>
            ) : bankInfo ? (
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                      <Building2 size={12} />
                      {bankInfo.bankName || '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Nomor Rekening</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                        {formatAccountNumber(bankInfo.accountNumber || '')}
                      </span>
                      <button
                        onClick={handleCopyNumber}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Salin nomor rekening"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Atas Nama</p>
                    <p className="text-sm font-semibold text-gray-900">{bankInfo.accountHolder || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Data rekening tidak tersedia</p>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openEditBank}
              >
                <Edit3 size={14} />
                Edit Rekening
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal: Ubah Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); resetPasswordForm(); }}
        title="Ubah Password Admin"
        maxWidth="md"
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Password Lama</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="Masukkan password saat ini"
                required
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="Minimal 8 karakter"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordForm.newPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-[11px] font-medium text-gray-400">{strength.label}</p>
                <div className="space-y-1">
                  {(Object.keys(PASSWORD_RULES) as RuleKey[]).map((rule) => {
                    const passed = passwordValidation.checks[rule];
                    return (
                      <div key={rule} className="flex items-center gap-1.5">
                        {passed ? (
                          <Check size={12} className="text-green-500 shrink-0" />
                        ) : (
                          <X size={12} className="text-gray-300 shrink-0" />
                        )}
                        <span className={`text-[11px] ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                          {RULE_LABELS[rule]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="Ulangi password baru"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordForm.confirmPassword && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {passwordValidation.confirmMatch ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span className="text-[11px] text-green-600">Password cocok</span>
                  </>
                ) : (
                  <>
                    <X size={12} className="text-gray-300" />
                    <span className="text-[11px] text-gray-400">Password tidak cocok</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setIsPasswordModalOpen(false); resetPasswordForm(); }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!passwordValidation.allValid}
              isLoading={changePasswordMutation.isPending}
            >
              Simpan Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Rekening */}
      <Modal
        isOpen={isEditBankOpen}
        onClose={() => setIsEditBankOpen(false)}
        title="Edit Rekening Admin"
        maxWidth="md"
      >
        <form onSubmit={handleSaveBank} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Bank</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Building2 size={16} />
              </div>
              <select
                value={formBank.bankName}
                onChange={(e) => setFormBank({ ...formBank, bankName: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none"
                required
              >
                <option value="">-- Pilih Bank --</option>
                {BANK_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nomor Rekening</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <CreditCard size={16} />
              </div>
              <input
                type="text"
                value={formBank.accountNumber}
                onChange={(e) => setFormBank({ ...formBank, accountNumber: e.target.value.replace(/\D/g, '') })}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono tracking-wider"
                placeholder="Minimal 8 digit angka"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Atas Nama (A/N)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserCircle size={16} />
              </div>
              <input
                type="text"
                value={formBank.accountHolder}
                onChange={(e) => setFormBank({ ...formBank, accountHolder: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="Nama pemilik rekening"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditBankOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" isLoading={updateBankMutation.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog: Logout All Sessions */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogoutSessions}
        title="Logout Semua Session"
        message="Anda akan keluar dari semua perangkat. Semua session admin akan dinonaktifkan dan Anda harus login ulang. Lanjutkan?"
      />
    </motion.div>
  );
};
