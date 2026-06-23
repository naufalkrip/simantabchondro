import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, ShieldCheck, CreditCard, Building2,
  UserCircle, Edit3, KeyRound, Lock, Copy, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { getMembers, updateMember } from '../../services/memberService';
import type { Member } from '../../types/member';

export const Pengaturan: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState(false);
  const [isEditBankOpen, setIsEditBankOpen] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  });

  const memberId = sessionStorage.getItem('member_id');
  const storedName = sessionStorage.getItem('member_name') || 'Anggota';

  const fetchData = async () => {
    if (!memberId) return;
    const membersData = await getMembers();
    const myProfile = membersData.find(m => m.id === memberId) || null;
    if (myProfile) {
      setMember(myProfile);
      setBankForm({
        bankName: myProfile.bankName || '',
        bankAccount: myProfile.bankAccountNumber || '',
        bankAccountName: myProfile.bankOwnerName || '',
      });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const formatAccountNumber = (num: string) => {
    return num.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCopyNumber = () => {
    const num = member?.bankAccountNumber || '';
    navigator.clipboard.writeText(num).then(() => {
      toast.success('Nomor rekening tersalin');
    }).catch(() => {
      toast.error('Gagal menyalin nomor rekening');
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (passwordForm.password && passwordForm.password !== passwordForm.confirmPassword) {
      toast.error('Password konfirmasi tidak cocok!');
      return;
    }

    setIsSaving(true);
    const promise = updateMember(member.id, {
      ...(passwordForm.password ? { password: passwordForm.password } : {}),
    });

    toast.promise(promise, {
      loading: 'Memperbarui kata sandi...',
      success: (res) => {
        if (res) {
          setIsEditPasswordOpen(false);
          setPasswordForm({ password: '', confirmPassword: '' });
          return 'Kata sandi berhasil diperbarui';
        }
        throw new Error('Gagal memperbarui');
      },
      error: 'Terjadi kesalahan sistem',
    });

    setIsSaving(false);
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSaving(true);
    const promise = updateMember(member.id, {
      bankName: bankForm.bankName,
      bankAccountNumber: bankForm.bankAccount,
      bankOwnerName: bankForm.bankAccountName,
    });

    toast.promise(promise, {
      loading: 'Memperbarui rekening...',
      success: (res) => {
        if (res) {
          setIsEditBankOpen(false);
          fetchData();
          return 'Informasi rekening berhasil diperbarui';
        }
        throw new Error('Gagal memperbarui');
      },
      error: 'Terjadi kesalahan sistem',
    });

    setIsSaving(false);
  };

  const resetPasswordForm = () => {
    setPasswordForm({ password: '', confirmPassword: '' });
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mb-3">
          <span>Dashboard</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Pengaturan Profil</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shrink-0">
            <Settings size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pengaturan Profil</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola informasi akun dan rekening tabungan Anda.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5">
        {/* Card: Informasi Akun */}
        <motion.div variants={staggerItem} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shrink-0">
                <ShieldCheck size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Informasi Akun</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Data profil dan keamanan akun anggota.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => { resetPasswordForm(); setIsEditPasswordOpen(true); }}
              >
                <KeyRound size={14} />
                Ubah Password
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Nama Anggota</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{member?.name || storedName}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">No. HP</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 font-mono">{member?.phone || '-'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Role</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">Anggota</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status Akun</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card: Rekening Tabungan */}
        <motion.div variants={staggerItem} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rekening Tabungan</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rekening pribadi untuk transaksi tabungan anggota.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsEditBankOpen(true)}
              >
                <Edit3 size={14} />
                Edit
              </Button>
            </div>

            {member?.bankName || member?.bankAccountNumber ? (
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold">
                      <Building2 size={12} />
                      {member?.bankName || '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Nomor Rekening</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-200 tracking-wider">
                        {formatAccountNumber(member?.bankAccountNumber || '')}
                      </span>
                      <button
                        onClick={handleCopyNumber}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Salin nomor rekening"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Atas Nama</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{member?.bankOwnerName || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <CreditCard size={20} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada data rekening</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Silakan tambahkan rekening tabungan Anda.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal: Ubah Password */}
      <Modal
        isOpen={isEditPasswordOpen}
        onClose={() => { setIsEditPasswordOpen(false); resetPasswordForm(); }}
        title="Ubah Kata Sandi"
        maxWidth="md"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nama Anggota</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={member?.name || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">No. HP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCircle size={16} />
                </div>
                <input
                  type="text"
                  value={member?.phone || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Password Baru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all"
                />
              </div>
              {passwordForm.confirmPassword && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {passwordForm.confirmPassword === passwordForm.password ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Password cocok</span>
                    </>
                  ) : (
                    <>
                      <X size={12} className="text-slate-300 dark:text-slate-600" />
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Password tidak cocok</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1">* Kosongkan password jika tidak ingin mengubah.</p>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setIsEditPasswordOpen(false); resetPasswordForm(); }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSaving}
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
        title="Edit Rekening Anggota"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateBank} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nama Pemilik Rekening</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserCircle size={16} />
              </div>
              <input
                type="text"
                value={bankForm.bankAccountName}
                onChange={(e) => setBankForm({ ...bankForm, bankAccountName: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nomor Rekening</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <CreditCard size={16} />
              </div>
              <input
                type="text"
                value={bankForm.bankAccount}
                onChange={(e) => setBankForm({ ...bankForm, bankAccount: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all font-mono tracking-wider"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Jenis Bank</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditBankOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSaving}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
