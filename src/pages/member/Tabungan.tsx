import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { getTransactions, addTransaction, deleteTransaction } from '../../services/transactionService';
import { getMembers, computeMemberBalances } from '../../services/memberService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { Transaction } from '../../types/transaction';
import type { Member } from '../../types/member';
import { 
  ArrowUpCircle, 
  ArrowDownCircle,
  PlusCircle,
  ArrowDownRight,
  CreditCard,
  Camera,
  Send,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const Tabungan: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [member, setMember] = useState<Member | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isDepositInfoOpen, setIsDepositInfoOpen] = useState(false);
  const [isDepositFormOpen, setIsDepositFormOpen] = useState(false);
  const [isWithdrawFormOpen, setIsWithdrawFormOpen] = useState(false);

  // Form States
  const [depositAmount, setDepositAmount] = useState('');
  const [depositProof, setDepositProof] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ isOpen: boolean; id: string; amount: number }>({
    isOpen: false,
    id: '',
    amount: 0
  });
  
  const memberId = sessionStorage.getItem('member_id');

  const fetchData = async () => {
    if (!memberId) return;
    const [transData, membersData] = await Promise.all([
      getTransactions(),
      getMembers()
    ]);
    const membersWithBalance = computeMemberBalances(membersData, transData);
    const myTransactions = transData.filter(t => t.member_id === memberId);
    const myProfile = membersWithBalance.find(m => m.id === memberId) || null;
    setTransactions(myTransactions);
    setMember(myProfile);

  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToDataChange(() => {
      fetchData();
    });

    return () => unsubscribe();
  }, [memberId]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !depositAmount || !depositProof) return;

    setIsSubmitting(true);
    const promise = addTransaction({
      member_id: memberId,
      type: 'setoran',
      amount: Number(depositAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      proof_url: depositProof,
    });

    toast.promise(promise, {
      loading: 'Mengirim request setoran...',
      success: (res) => {
        if (res) {
          setIsDepositFormOpen(false);
          setDepositAmount('');
          setDepositProof(null);
          fetchData();
          return 'Request setoran berhasil dikirim. Menunggu verifikasi admin.';
        }
        throw new Error('Gagal mengirim');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsSubmitting(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !withdrawAmount) return;

    if (Number(withdrawAmount) > (member?.totalBalance || 0)) {
      toast.error('Saldo tidak mencukupi!');
      return;
    }

    setIsSubmitting(true);
    const promise = addTransaction({
      member_id: memberId,
      type: 'penarikan',
      amount: Number(withdrawAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      proof_url: '',
    });

    toast.promise(promise, {
      loading: 'Mengirim request penarikan...',
      success: (res) => {
        if (res) {
          setIsWithdrawFormOpen(false);
          setWithdrawAmount('');
          fetchData();
          return 'Request penarikan berhasil dikirim. Menunggu verifikasi admin.';
        }
        throw new Error('Gagal mengirim');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsSubmitting(false);
  };

  const handleCancelWithdrawal = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setCancelConfirm({ isOpen: true, id: tx.id, amount: tx.amount });
    }
  };

  const confirmCancelWithdrawal = async () => {
    const { id, amount } = cancelConfirm;
    setCancelConfirm(prev => ({ ...prev, isOpen: false }));
    
    const promise = deleteTransaction(id);

    toast.promise(promise, {
      loading: 'Membatalkan request...',
      success: () => {
        fetchData();
        return `Request penarikan ${formatCurrency(amount)} berhasil dibatalkan`;
      },
      error: 'Gagal membatalkan request'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rekap Tabungan</h2>
          <p className="text-xs text-gray-500 mt-1">Pantau perkembangan saldo tabungan Anda</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Saldo</p>
          <h3 className="text-2xl font-black text-red-700 leading-none">{formatCurrency(member?.totalBalance || 0)}</h3>
        </div>
      </div>

      {/* Action Buttons Outside the Box */}
      <div className="grid grid-cols-1 md:flex md:flex-wrap gap-3">
        <Button 
          className="w-full md:w-auto font-bold text-xs gap-2 px-6 py-2.5 shadow-md active:scale-95 transition-all"
          onClick={() => setIsDepositInfoOpen(true)}
        >
          <PlusCircle size={16} /> Tambah Setoran
        </Button>
        <Button 
          variant="secondary"
          className="w-full md:w-auto bg-white border-gray-200 font-bold text-xs gap-2 px-6 py-2.5 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          onClick={() => setIsWithdrawFormOpen(true)}
        >
          <ArrowDownRight size={16} /> Request Penarikan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-green-50/30 border-green-100">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <ArrowUpCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Total Uang Masuk</p>
            <h4 className="text-lg font-black text-gray-900">
              {formatCurrency(transactions.filter(t => t.type === 'setoran').reduce((acc, t) => acc + t.amount, 0))}
            </h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-red-50/30 border-red-100">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <ArrowDownCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Total Penarikan</p>
            <h4 className="text-lg font-black text-gray-900">
              {formatCurrency(transactions.filter(t => t.type === 'penarikan').reduce((acc, t) => acc + t.amount, 0))}
            </h4>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deposit History Table */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Riwayat Setoran</h3>
            <ArrowUpCircle size={14} className="text-green-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Nominal</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Bukti</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.filter(t => t.type === 'setoran').length > 0 ? 
                  transactions.filter(t => t.type === 'setoran').map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-800">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      {tx.note && <p className="text-[9px] text-gray-400 italic mt-0.5">{tx.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-black text-gray-900">
                        {formatCurrency(tx.amount).replace('Rp', '').trim()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx.proof_url ? (
                        <button 
                          onClick={() => setSelectedProofUrl(tx.proof_url || null)}
                          className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1.5"
                          title="Lihat Bukti"
                        >
                          <ImageIcon size={12} />
                          <span className="text-[10px] font-bold">Lihat</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx(
                        "text-[9px] font-black uppercase px-2 py-1 rounded-sm",
                        tx.status === 'approved' ? "bg-green-100 text-green-700" : 
                        tx.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      )}>
                        {tx.status === 'approved' ? 'Berhasil' : tx.status === 'pending' ? 'Proses' : 'Ditolak'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-xs italic">
                      Belum ada riwayat setoran
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Withdrawal Request History Table */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Riwayat Penarikan</h3>
            <ArrowDownCircle size={14} className="text-red-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Nominal</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Bukti</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.filter(t => t.type === 'penarikan').length > 0 ? 
                  transactions.filter(t => t.type === 'penarikan').map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-800">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      {tx.note && <p className="text-[9px] text-gray-400 italic mt-0.5">{tx.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-black text-red-700">
                        -{formatCurrency(tx.amount).replace('Rp', '').trim()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx.proof_url ? (
                        <button 
                          onClick={() => setSelectedProofUrl(tx.proof_url || null)}
                          className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1.5"
                          title="Lihat Bukti"
                        >
                          <ImageIcon size={12} />
                          <span className="text-[10px] font-bold">Lihat</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx.status === 'pending' ? (
                        <button 
                          onClick={() => handleCancelWithdrawal(tx.id)}
                          className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Batal
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx(
                        "text-[9px] font-black uppercase px-2 py-1 rounded-sm",
                        tx.status === 'approved' ? "bg-green-100 text-green-700" : 
                        tx.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      )}>
                        {tx.status === 'approved' ? 'Selesai' : tx.status === 'pending' ? 'Proses' : 'Gagal'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-xs italic">
                      Belum ada riwayat penarikan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* --- MODALS --- */}

      {/* 1a. Deposit Info Modal */}
      <Modal 
        isOpen={isDepositInfoOpen} 
        onClose={() => setIsDepositInfoOpen(false)}
        title="Info Rekening Setoran"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
            <Info className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-800 leading-relaxed">
              Silakan lakukan transfer ke rekening admin di bawah ini. Setelah transfer, klik tombol <b>"Lanjut Tambah Setoran"</b> untuk mengirim bukti transfer.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Bank</p>
              <p className="text-sm font-black text-gray-900">BANK BCA</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nomor Rekening</p>
              <p className="text-lg font-black text-red-700 tracking-wider">1234 5678 90</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Atas Nama</p>
              <p className="text-sm font-black text-gray-900">ADMIN MB CHONDRO (SIMANTAB)</p>
            </div>
          </div>

          <Button 
            className="w-full font-bold gap-2 py-3"
            onClick={() => {
              setIsDepositInfoOpen(false);
              setIsDepositFormOpen(true);
            }}
          >
            Lanjut Tambah Setoran <ArrowUpCircle size={18} />
          </Button>
        </div>
      </Modal>

      {/* 1b. Deposit Submit Modal */}
      <Modal
        isOpen={isDepositFormOpen}
        onClose={() => setIsDepositFormOpen(false)}
        title="Konfirmasi Setoran"
      >
        <form onSubmit={handleDepositSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Jumlah Transfer (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">Rp</span>
              <input
                type="number"
                required
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg font-black text-lg focus:ring-2 focus:ring-red-500/20 outline-none"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Upload Bukti Transfer</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                required
                className="hidden"
                id="deposit-proof"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="deposit-proof"
                className={clsx(
                  "w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all",
                  depositProof ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-red-500 hover:bg-red-50"
                )}
              >
                {depositProof ? (
                  <img src={depositProof} alt="Bukti Transfer" className="w-full h-full object-contain p-2 rounded-xl" />
                ) : (
                  <>
                    <Camera className="text-gray-300 group-hover:text-red-500 mb-2" size={32} />
                    <p className="text-xs font-bold text-gray-400 group-hover:text-red-600">Klik untuk ambil foto / upload</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full font-bold gap-2 py-3"
            isLoading={isSubmitting}
          >
            <Send size={18} /> Kirim Bukti Setoran
          </Button>
        </form>
      </Modal>

      {/* 2. Withdrawal Request Modal */}
      <Modal
        isOpen={isWithdrawFormOpen}
        onClose={() => setIsWithdrawFormOpen(false)}
        title="Request Penarikan Saldo"
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-5">
          {/* Important Notice */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
            <Info className="text-yellow-600 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-xs font-black text-yellow-800 uppercase tracking-tight">Penting untuk diperhatikan!</p>
              <p className="text-[11px] text-yellow-700 leading-relaxed">
                Permintaan penarikan akan <b>diverifikasi oleh admin</b> terlebih dahulu. Pastikan data rekening Anda di bawah ini sudah <b>benar & valid</b>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Saldo Tersedia</p>
              <p className="text-lg font-black text-gray-900">{formatCurrency(member?.totalBalance || 0)}</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Status Akun</p>
              <p className="text-lg font-black text-red-700 uppercase">Aktif</p>
            </div>
          </div>

          {/* Member Bank Info Display */}
          <div className="p-4 bg-white border-2 border-gray-100 rounded-xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tujuan Pengiriman (Data Anda)</h4>
              <CreditCard size={14} className="text-gray-300" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500">Bank</span>
                <span className="text-xs font-black text-gray-800">{member?.bankName || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500">No. Rekening</span>
                <span className="text-sm font-black text-red-700 tracking-wider">{member?.bankAccountNumber || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500">Atas Nama</span>
                <span className="text-xs font-black text-gray-800">{member?.bankOwnerName || '-'}</span>
              </div>
            </div>
            <p className="text-[9px] text-red-500 italic font-medium pt-1 text-center">
              *Jika data rekening salah, silakan ubah di menu <b>Pengaturan</b>
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Jumlah yang Ingin Ditarik (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">Rp</span>
              <input
                type="number"
                required
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border-2 border-red-100 rounded-lg font-black text-xl text-red-700 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full font-bold gap-2 py-4 shadow-lg shadow-red-700/20 active:scale-95 transition-all"
            isLoading={isSubmitting}
          >
            <Send size={18} /> Konfirmasi & Kirim Request
          </Button>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={cancelConfirm.isOpen}
        onClose={() => setCancelConfirm({ ...cancelConfirm, isOpen: false })}
        onConfirm={confirmCancelWithdrawal}
        title="Batalkan Request"
        message={`Apakah Anda yakin ingin membatalkan permintaan penarikan dana sebesar ${formatCurrency(cancelConfirm.amount)}?`}
        confirmText="Ya, Batalkan"
        variant="warning"
      />

      {/* 3. Image Preview Modal */}
      <Modal
        isOpen={!!selectedProofUrl}
        onClose={() => setSelectedProofUrl(null)}
        title="Bukti Transfer"
        maxWidth="lg"
      >
        {selectedProofUrl && (
          <div className="space-y-4">
            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
              <img 
                src={selectedProofUrl} 
                alt="Bukti Transfer Detail" 
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-sm mx-auto"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1 font-bold text-xs py-3"
                onClick={() => setSelectedProofUrl(null)}
              >
                Tutup Preview
              </Button>
              <a 
                href={selectedProofUrl} 
                download={`Bukti_Transfer_${new Date().getTime()}.png`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full font-bold text-xs py-3 border-gray-200">
                  Unduh Gambar
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
