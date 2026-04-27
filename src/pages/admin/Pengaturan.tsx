import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  User, 
  CreditCard,
  Building2, 
  UserCircle, 
  Edit3, 
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const Pengaturan: React.FC = () => {
  // Data State
  const [adminUsername, setAdminUsername] = useState('111');
  const [adminPassword, setAdminPassword] = useState('111');
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''});

  // Modal State
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isEditBankOpen, setIsEditBankOpen] = useState(false);

  // Form State (Temporary)
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formBank, setFormBank] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''});

  useEffect(() => {
    // Load data from localStorage on mount
    const savedUsername = localStorage.getItem('admin_username') || '111';
    const savedPassword = localStorage.getItem('admin_password') || '111';
    const savedBankStr = localStorage.getItem('admin_bank_info');
    const savedBank = savedBankStr ? JSON.parse(savedBankStr) : {
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'ADMIN SIMANTAB'};

    setAdminUsername(savedUsername);
    setAdminPassword(savedPassword);
    setBankInfo(savedBank);
    
    // Initialize forms
    setFormUsername(savedUsername);
    setFormPassword(savedPassword);
    setFormBank(savedBank);}, []);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('admin_username', formUsername);
    localStorage.setItem('admin_password', formPassword);
    setAdminUsername(formUsername);
    setAdminPassword(formPassword);
    
    setIsEditAccountOpen(false);
    toast.success('Informasi akun admin berhasil diperbarui');
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('admin_bank_info', JSON.stringify(formBank));
    setBankInfo(formBank);
    
    setIsEditBankOpen(false);
    toast.success('Informasi rekening admin berhasil diperbarui');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-3 md:p-4 border-b border-gray-200 rounded-md shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">Pengaturan Sistem</h2>
          <p className="text-xs text-gray-500 mt-0.5">Kelola kredensial login dan informasi rekening administrasi</p>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-4">
        {/* Account Info Table Section - Flat Style */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-4 py-3 border-b flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-100 text-red-600 rounded-md">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-800 ">Akun Admin</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1.5 text-xs font-bold  border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-100 rounded-md"
              onClick={() => {
                setFormUsername(adminUsername);
                setFormPassword(adminPassword);
                setIsEditAccountOpen(true);}}
            >
              <Edit3 size={12} />
              Edit
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400  w-1/3 bg-gray-50/30">Username</td>
                  <td className="px-3 py-2 text-gray-800 font-mono text-sm">{adminUsername}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400  bg-gray-50/30">Kata Sandi</td>
                  <td className="px-3 py-2 text-gray-800 font-mono text-sm tracking-[0.3em]">••••••••</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Info Table Section - Flat Style */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-4 py-3 border-b flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                <CreditCard size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-800 ">Rekening Admin</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1.5 text-xs font-bold  border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-100 rounded-md"
              onClick={() => {
                setFormBank(bankInfo);
                setIsEditBankOpen(true);}}
            >
              <Edit3 size={12} />
              Edit
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400  w-1/3 bg-gray-50/30">Nama Pemilik</td>
                  <td className="px-3 py-2 text-gray-800 uppercase tracking-wide text-[13px] font-semibold">{bankInfo.accountHolder || '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400  bg-gray-50/30">Nomor Rekening</td>
                  <td className="px-3 py-2 text-gray-800 font-mono tracking-widest text-[13px]">{bankInfo.accountNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-gray-400  bg-gray-50/30">Jenis Bank</td>
                  <td className="px-3 py-2 text-gray-900 font-bold text-sm">{bankInfo.bankName || '-'}</td>
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
        title="Edit Akun Admin"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Username Baru</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </div>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Kata Sandi Baru</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound size={16} />
              </div>
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditAccountOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Rekening */}
      <Modal 
        isOpen={isEditBankOpen} 
        onClose={() => setIsEditBankOpen(false)} 
        title="Edit Rekening Admin"
        maxWidth="md"
      >
        <form onSubmit={handleSaveBank} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nama Pemilik Rekening</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserCircle size={16} />
              </div>
              <input
                type="text"
                value={formBank.accountHolder}
                onChange={(e) => setFormBank({...formBank, accountHolder: e.target.value})}
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
                value={formBank.accountNumber}
                onChange={(e) => setFormBank({...formBank, accountNumber: e.target.value})}
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
                value={formBank.bankName}
                onChange={(e) => setFormBank({...formBank, bankName: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditBankOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


