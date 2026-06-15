import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Minus, Check, X, Users, CreditCard, Info, Plus, Image as ImageIcon } from 'lucide-react';
import { getTransactionsFiltered, updateTransactionStatus } from '../../services/transactionService';
import { getMembersBankInfo } from '../../services/memberService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { Transaction } from '../../types/transaction';
import type { Member } from '../../types/member';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const Penarikan: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // New states for withdrawal confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingRequestId, setConfirmingRequestId] = useState<string | null>(null);
  const [tempProofUrl, setTempProofUrl] = useState<string | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const [pendingData, historyData, memberData] = await Promise.all([
      getTransactionsFiltered({ type: 'penarikan', status: 'pending' }),
      getTransactionsFiltered({ type: 'penarikan', status: 'approved', limit: 20 }),
      getMembersBankInfo()
    ]);
    setPendingRequests(pendingData);
    setHistory(historyData);
    setMembers(memberData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();

    const unsubscribe = subscribeToDataChange(() => {
      fetchData();
    });

    const pollInterval = setInterval(() => fetchData(), 15000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProofUrl(reader.result as string);
        toast.success('Bukti transfer terpilih');
      };
      reader.readAsDataURL(file);
    }
  };

  const openConfirmModal = (id: string) => {
    setConfirmingRequestId(id);
    setTempProofUrl(null);
    setIsConfirmModalOpen(true);
  };

  const openRejectModal = (id: string, name: string) => {
    setRejectConfirm({ isOpen: true, id, name });
  };

  const confirmReject = async () => {
    const { id } = rejectConfirm;
    setRejectConfirm(prev => ({ ...prev, isOpen: false }));
    handleProcessRequest(id, 'rejected');
  };

  const handleProcessRequest = async (id: string, status: 'approved' | 'rejected', proof?: string) => {
    if (status === 'approved' && !proof) {
      toast.error('Harap unggah bukti transfer terlebih dahulu');
      return;
    }
    
    setIsSubmitting(true);
    const promise = updateTransactionStatus(id, status, proof);

    toast.promise(promise, {
      loading: status === 'approved' ? 'Menyetujui penarikan...' : 'Menolak penarikan...',
      success: (res) => {
        if (res) {
          setIsConfirmModalOpen(false);
          return `Penarikan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`;
        }
        throw new Error('Gagal memproses');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const confirmingRequest = pendingRequests.find(r => r.id === confirmingRequestId);

  return (
    <div className="space-y-4">
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Verifikasi Penarikan</h2>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Setujui permintaan pencairan saldo tabungan anggota</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {pendingRequests.length > 0 ? pendingRequests.map(req => (
            <Card key={req.id} className="overflow-hidden flex flex-col rounded-xl">
              <div className="p-4 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <Minus size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{req.member?.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">
                        {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Jumlah Penarikan</p>
                  <p className="text-lg md:text-xl font-black text-red-700">{formatCurrency(req.amount)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Rekening</p>
                    <CreditCard size={12} className="text-gray-300 md:size-[14px]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] md:text-xs font-bold text-gray-800">{req.member?.name}</p>
                    <button 
                      onClick={() => setSelectedMemberId(req.member_id)}
                      className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      <Users size={12} /> Klik untuk detail rekening
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2">
                  <Info className="text-blue-500 shrink-0 md:w-4 md:h-4 w-3 h-3" />
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                    Pastikan Anda telah mentransfer dana ke rekening anggota sebelum menyetujui request ini.
                  </p>
                </div>
              </div>

              <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                <Button 
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 gap-2"
                  onClick={() => openConfirmModal(req.id)}
                  isLoading={isSubmitting}
                >
                  <Check size={14} /> Setujui & Cairkan
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:flex-1 border-red-200 text-red-700 hover:bg-red-50 gap-2"
                  onClick={() => openRejectModal(req.id, req.member?.name || 'Anggota')}
                  isLoading={isSubmitting}
                >
                  <X size={14} /> Tolak
                </Button>
              </div>
            </Card>
          )) : (
            <div className="col-span-full py-8 md:py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Check size={20} className="md:w-8 md:h-8" />
              </div>
              <h3 className="text-gray-900 font-bold text-xs md:text-base">Semua Selesai!</h3>
              <p className="text-gray-400 text-[10px] md:text-sm">Tidak ada permintaan penarikan yang perlu diproses.</p>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      {/* History Table / Card List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Verifikasi Penarikan</h3>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase border-b border-gray-100 font-black tracking-widest">
                <th className="px-4 py-2.5">Anggota</th>
                <th className="px-4 py-2.5">Tanggal</th>
                <th className="px-4 py-2.5">Nominal</th>
                <th className="px-4 py-2.5">Bukti</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {history.length > 0 ? history.slice(0, 20).map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-gray-800">{tx.member?.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{tx.date}</td>
                  <td className="px-4 py-2.5 font-bold text-red-700">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2.5">
                    {tx.proof_url ? (
                      <button 
                        onClick={() => {
                          setConfirmingRequestId(tx.id);
                          setTempProofUrl(tx.proof_url || null);
                          setIsConfirmModalOpen(true);
                        }}
                        className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <ImageIcon size={12} />
                        <span className="text-[10px] font-bold">Lihat</span>
                      </button>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={clsx(
                      "px-2 py-0.5 rounded-sm text-[10px] font-black uppercase border",
                      tx.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs italic">Belum ada riwayat verifikasi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100">
          {history.length > 0 ? history.slice(0, 20).map((tx) => (
            <div key={tx.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">{tx.member?.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{tx.date}</p>
                </div>
                <span className={clsx(
                  "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border",
                  tx.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                )}>
                  {tx.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Nominal</p>
                  <p className="text-sm font-black text-red-700">{formatCurrency(tx.amount)}</p>
                </div>
                {tx.proof_url && (
                  <button 
                    onClick={() => {
                      setConfirmingRequestId(tx.id);
                      setTempProofUrl(tx.proof_url || null);
                      setIsConfirmModalOpen(true);
                    }}
                    className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1.5"
                  >
                    <ImageIcon size={12} />
                    <span className="text-[10px] font-bold">Lihat</span>
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="px-4 py-8 text-center text-gray-400 text-xs italic">Belum ada riwayat verifikasi</div>
          )}
        </div>
      </div>

      {/* Confirmation Modal with Upload */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Konfirmasi Pencairan Dana"
        maxWidth="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-blue-700">
              <p className="text-[10px] font-black uppercase tracking-widest">Detail Penarikan</p>
              <Info size={14} />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-black text-blue-900">{confirmingRequest?.member?.name}</p>
                <p className="text-[10px] text-blue-600 uppercase font-bold">{confirmingRequest?.member_id}</p>
              </div>
              <p className="text-lg font-black text-blue-900">{confirmingRequest ? formatCurrency(confirmingRequest.amount) : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Unggah Bukti Transfer</span>
              <div className={clsx(
                "relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden min-h-[200px]",
                tempProofUrl ? "border-green-500 bg-green-50/30" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
              )}>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                
                {tempProofUrl ? (
                  <>
                    <img src={tempProofUrl} alt="Preview Bukti" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                    <div className="relative z-10 w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm">
                      <Check size={32} />
                    </div>
                    <p className="relative z-10 text-[10px] font-black text-green-700 uppercase">Gambar Berhasil Dipilih</p>
                    <p className="relative z-10 text-[9px] text-green-600 italic">Klik atau tarik file lain untuk mengganti</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center shadow-inner">
                      <Plus size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-500 uppercase">Pilih Foto Bukti Transfer</p>
                      <p className="text-[9px] text-gray-400 mt-1 italic">Format JPG, PNG (Maks. 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              isLoading={isSubmitting}
              disabled={!tempProofUrl}
              onClick={() => confirmingRequestId && handleProcessRequest(confirmingRequestId, 'approved', tempProofUrl || undefined)}
            >
              Konfirmasi & Selesaikan
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Member Profile/Bank Details Modal */}
      <Modal
        isOpen={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Detail Rekening Anggota"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black">
              {selectedMember?.name.charAt(0)}
            </div>
            <h3 className="text-lg font-black text-gray-900">{selectedMember?.name}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest">{selectedMember?.divisi}</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bank</p>
              <p className="text-sm font-black text-gray-900">{selectedMember?.bankName || '-'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nomor Rekening</p>
              <p className="text-lg font-black text-red-700 tracking-wider">{selectedMember?.bankAccountNumber || '-'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Atas Nama</p>
              <p className="text-sm font-black text-gray-900">{selectedMember?.bankOwnerName || '-'}</p>
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={() => setSelectedMemberId(null)}
          >
            Tutup
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ ...rejectConfirm, isOpen: false })}
        onConfirm={confirmReject}
        title="Tolak Penarikan"
        message={`Apakah Anda yakin ingin menolak permintaan penarikan dari "${rejectConfirm.name}"?`}
      />
    </div>
  );
};
