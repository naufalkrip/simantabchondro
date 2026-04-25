import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getMembers, updateMember } from '../../services/memberService';
import type { Member } from '../../types/member';
import { 
  User, 
  Lock, 
  CreditCard, 
  Save,
  UserCircle
} from 'lucide-react';

export const Pengaturan: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const memberId = localStorage.getItem('member_id');

  useEffect(() => {
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
      setIsLoading(false);
    };

    fetchData();
  }, [memberId]);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      alert('Password konfirmasi tidak cocok!');
      return;
    }

    setIsSaving(true);
    const success = await updateMember(member.id, {
      username: accountForm.username,
      ...(accountForm.password ? { password: accountForm.password } : {})
    });

    if (success) {
      alert('Pengaturan akun berhasil diperbarui!');
    } else {
      alert('Gagal memperbarui akun.');
    }
    setIsSaving(false);
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSaving(true);
    const success = await updateMember(member.id, {
      bankName: bankForm.bankName,
      bankAccountNumber: bankForm.bankAccount,
      bankOwnerName: bankForm.bankAccountName
    });

    if (success) {
      alert('Informasi rekening berhasil diperbarui!');
    } else {
      alert('Gagal memperbarui rekening.');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px] text-gray-400">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Pengaturan Profil</h2>
        <p className="text-xs text-gray-500 mt-1">Kelola informasi akun dan rekening Anda secara terpisah.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings Table/Card */}
        <Card className="overflow-hidden border-t-4 border-t-red-700">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <UserCircle size={16} className="text-red-700" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Informasi Akun</h3>
          </div>
          <form onSubmit={handleUpdateAccount} className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-gray-700"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Password Baru (Kosongkan jika tidak diubah)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  value={accountForm.confirmPassword}
                  onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full font-bold text-xs gap-2 py-2.5 mt-2"
              disabled={isSaving}
            >
              <Save size={14} /> {isSaving ? 'Menyimpan...' : 'Update Akun'}
            </Button>
          </form>
        </Card>

        {/* Bank Account Settings Table/Card */}
        <Card className="overflow-hidden border-t-4 border-t-blue-600">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <CreditCard size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Informasi Rekening</h3>
          </div>
          <form onSubmit={handleUpdateBank} className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Nama Bank</label>
              <input
                type="text"
                placeholder="Contoh: BCA, Mandiri, BRI"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Nomor Rekening</label>
              <input
                type="text"
                placeholder="0000000000"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                value={bankForm.bankAccount}
                onChange={(e) => setBankForm({ ...bankForm, bankAccount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Atas Nama</label>
              <input
                type="text"
                placeholder="Nama sesuai buku tabungan"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                value={bankForm.bankAccountName}
                onChange={(e) => setBankForm({ ...bankForm, bankAccountName: e.target.value })}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs gap-2 py-2.5 mt-2"
              disabled={isSaving}
            >
              <Save size={14} /> {isSaving ? 'Menyimpan...' : 'Update Rekening'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
