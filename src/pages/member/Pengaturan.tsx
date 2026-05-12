import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getMembers, updateMember } from '../../services/memberService';
import type { Member } from '../../types/member';
import { 
  User, 
  CreditCard, 
  Building2, 
  UserCircle, 
  Edit3, 
  KeyRound,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

export const Pengaturan: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isEditBankOpen, setIsEditBankOpen] = useState(false);

  // Form State
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankAccount: '',
    bankAccountName: ''
  });

  const memberId = sessionStorage.getItem('member_id');

  const fetchData = async () => {
    if (!memberId) return;
    const membersData = await getMembers();
    const myProfile = membersData.find(m => m.id === memberId) || null;
    
    if (myProfile) {
      setMember(myProfile);
      setAccountForm({
        username: myProfile.username || '',
        password: '',
        confirmPassword: ''
      });
      setBankForm({
        bankName: myProfile.bankName || '',
        bankAccount: myProfile.bankAccountNumber || '',
        bankAccountName: myProfile.bankOwnerName || ''
      });
    }

  };

  useEffect(() => {
    fetchData();
  }, [memberId]);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      toast.error('Password konfirmasi tidak cocok!');
      return;
    }

    setIsSaving(true);
    const promise = updateMember(member.id, {
      ...(accountForm.password ? { password: accountForm.password } : {})
    });

    toast.promise(promise, {
      loading: 'Memperbarui kata sandi...',
      success: (res) => {
        if (res) {
          setIsEditAccountOpen(false);
          setAccountForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
          fetchData();
          return 'Kata sandi berhasil diperbarui';
        }
        throw new Error('Gagal memperbarui');
      },
      error: 'Terjadi kesalahan sistem'
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
      bankOwnerName: bankForm.bankAccountName
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
      error: 'Terjadi kesalahan sistem'
    });

    setIsSaving(false);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200 rounded-md shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">Pengaturan Profil</h2>
          <p className="text-xs text-gray-500 mt-0.5">Kelola informasi akun dan rekening Anda secara terpisah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Account Info Table Section - Flat Style */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-4 py-2.5 border-b flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-100 text-red-600 rounded-md">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-800 ">Informasi Akun</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1.5 text-xs font-bold border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-100 rounded-md"
              onClick={() => setIsEditAccountOpen(true)}
            >
              <Edit3 size={12} />
              Edit Password
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400 w-1/3 bg-gray-50/30">Nama Anggota</td>
                  <td className="px-3 py-2 text-gray-800 font-bold text-sm">{member?.name}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400 bg-gray-50/30">No. HP Terdaftar</td>
                  <td className="px-3 py-2 text-gray-800 font-mono text-sm">{member?.phone}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400 bg-gray-50/30">Kata Sandi</td>
                  <td className="px-3 py-2 text-gray-800 font-mono text-sm tracking-[0.3em]">••••••••</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Info Table Section - Flat Style */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-4 py-2.5 border-b flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                <CreditCard size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-800 ">Rekening Tabungan</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1.5 text-xs font-bold border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-100 rounded-md"
              onClick={() => setIsEditBankOpen(true)}
            >
              <Edit3 size={12} />
              Edit
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400 w-1/3 bg-gray-50/30">Nama Pemilik</td>
                  <td className="px-3 py-2 text-gray-800 uppercase tracking-wide text-[13px] font-semibold">{member?.bankOwnerName || '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400 bg-gray-50/30">Nomor Rekening</td>
                  <td className="px-3 py-2 text-gray-800 font-mono tracking-widest text-[13px]">{member?.bankAccountNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400 bg-gray-50/30">Jenis Bank</td>
                  <td className="px-3 py-2 text-gray-900 font-bold text-sm">{member?.bankName || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit Akun */}
      <Modal 
        isOpen={isEditAccountOpen} 
        onClose={() => setIsEditAccountOpen(false)} 
        title="Ubah Kata Sandi"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateAccount} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nama Anggota</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={member?.name || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">No. HP Terdaftar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
                  <UserCircle size={16} />
                </div>
                <input
                  type="text"
                  value={member?.phone || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Password Baru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={accountForm.confirmPassword}
                  onChange={(e) => setAccountForm({...accountForm, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic mt-1">* Kosongkan password jika tidak ingin mengubah.</p>
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditAccountOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" isLoading={isSaving}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Rekening */}
      <Modal 
        isOpen={isEditBankOpen} 
        onClose={() => setIsEditBankOpen(false)} 
        title="Edit Rekening Anggota"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateBank} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nama Pemilik Rekening</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserCircle size={16} />
              </div>
              <input
                type="text"
                value={bankForm.bankAccountName}
                onChange={(e) => setBankForm({...bankForm, bankAccountName: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nomor Rekening</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <CreditCard size={16} />
              </div>
              <input
                type="text"
                value={bankForm.bankAccount}
                onChange={(e) => setBankForm({...bankForm, bankAccount: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Jenis Bank</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditBankOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" isLoading={isSaving}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

