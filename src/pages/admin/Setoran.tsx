import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, X, Image as ImageIcon, Info } from 'lucide-react';
import { getTransactions, updateTransactionStatus } from '../../services/transactionService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { Transaction } from '../../types/transaction';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const Setoran: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const transactions = await getTransactions();
    const typeTransactions = transactions.filter(t => t.type === 'setoran');
    setPendingRequests(typeTransactions.filter(t => t.status === 'pending'));
    setHistory(typeTransactions.filter(t => t.status !== 'pending').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToDataChange(() => {
      fetchData();
    });

    return () => unsubscribe();
  }, []);

  const handleProcessRequest = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectConfirm.isOpen) {
      const req = pendingRequests.find(r => r.id === id);
      setRejectConfirm({ isOpen: true, id, name: req?.member?.name || 'Anggota' });
      return;
    }

    setIsSubmitting(true);
    const promise = updateTransactionStatus(id, status);
    
    toast.promise(promise, {
      loading: status === 'approved' ? 'Menyetujui setoran...' : 'Menolak setoran...',
      success: (res) => {
        if (res) {
          fetchData();
          return `Setoran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`;
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

  return (
    <div className="space-y-4">
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Verifikasi Setoran</h2>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Setujui atau tolak bukti transfer dari anggota</p>
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
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <Plus size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{req.member?.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">
                        {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nominal Setoran</p>
                  <p className="text-lg md:text-xl font-black text-green-700">{formatCurrency(req.amount)}</p>
                </div>

                {req.proof_url ? (
                  <div className="relative group">
                    <img 
                      src={req.proof_url} 
                      alt="Bukti Transfer" 
                      className="w-full h-32 md:h-40 object-cover rounded-xl border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => setSelectedProofUrl(req.proof_url || null)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      <div className="bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                        <ImageIcon size={12} /> Lihat
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 md:h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <Info size={20} className="mb-2 md:w-6 md:h-6" />
                    <p className="text-[10px] font-bold uppercase">Tidak ada bukti foto</p>
                  </div>
                )}
              </div>

              <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                <Button 
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 font-bold text-[11px] md:text-xs gap-2 h-10"
                  onClick={() => handleProcessRequest(req.id, 'approved')}
                  isLoading={isSubmitting}
                >
                  <Check size={14} /> Terima
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:flex-1 border-red-200 text-red-700 hover:bg-red-50 font-bold text-[11px] md:text-xs gap-2 h-10"
                  onClick={() => handleProcessRequest(req.id, 'rejected')}
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
              <h3 className="text-gray-900 font-bold text-xs md:text-base">Semua Beres!</h3>
              <p className="text-gray-400 text-[10px] md:text-sm">Tidak ada antrean verifikasi setoran saat ini.</p>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      {/* History Table / Card List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Verifikasi Setoran</h3>
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
                  <td className="px-4 py-2.5 font-bold text-green-700">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2.5">
                    {tx.proof_url ? (
                      <button 
                        onClick={() => setSelectedProofUrl(tx.proof_url || null)}
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
                  <p className="text-sm font-black text-green-700">{formatCurrency(tx.amount)}</p>
                </div>
                {tx.proof_url && (
                  <button 
                    onClick={() => setSelectedProofUrl(tx.proof_url || null)}
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

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!selectedProofUrl}
        onClose={() => setSelectedProofUrl(null)}
        title="Detail Bukti Transfer"
        maxWidth="lg"
      >
        {selectedProofUrl && (
          <div className="p-2">
            <img 
              src={selectedProofUrl} 
              alt="Bukti Transfer Detail" 
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg shadow-xl"
            />
            <Button 
              className="w-full mt-6 font-bold text-xs py-3"
              onClick={() => setSelectedProofUrl(null)}
            >
              Tutup Preview
            </Button>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ ...rejectConfirm, isOpen: false })}
        onConfirm={() => handleProcessRequest(rejectConfirm.id, 'rejected')}
        title="Tolak Setoran"
        message={`Apakah Anda yakin ingin menolak bukti setoran dari "${rejectConfirm.name}"?`}
      />
    </div>
  );
};
