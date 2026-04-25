import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, X, ExternalLink, Info } from 'lucide-react';
import { getTransactions, updateTransactionStatus } from '../../services/transactionService';
import type { Transaction } from '../../types/transaction';

export const Setoran: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

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
  }, []);

  const handleProcessRequest = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} permintaan setoran ini?`)) return;
    
    setIsSubmitting(true);
    const success = await updateTransactionStatus(id, status);
    if (success) {
      alert(`Setoran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      await fetchData();
    } else {
      alert('Gagal memproses permintaan.');
    }
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
    <div className="space-y-6">
      <div className="bg-white p-4 border-b border-gray-200 rounded-md shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Verifikasi Setoran</h2>
        <p className="text-xs text-gray-500 mt-0.5">Setujui atau tolak bukti transfer dari anggota</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.length > 0 ? pendingRequests.map(req => (
            <Card key={req.id} className="overflow-hidden flex flex-col">
              <div className="p-4 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <Plus size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{req.member?.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">
                        {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nominal Setoran</p>
                  <p className="text-xl font-black text-green-700">{formatCurrency(req.amount)}</p>
                </div>

                {req.proof_url ? (
                  <div className="relative group">
                    <img 
                      src={req.proof_url} 
                      alt="Bukti Transfer" 
                      className="w-full h-40 object-cover rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => setSelectedProofUrl(req.proof_url || null)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      <div className="bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                        <ExternalLink size={12} /> Lihat Detail Bukti
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <Info size={24} className="mb-2" />
                    <p className="text-[10px] font-bold uppercase">Tidak ada bukti foto</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-xs gap-2"
                  onClick={() => handleProcessRequest(req.id, 'approved')}
                  disabled={isSubmitting}
                >
                  <Check size={14} /> Terima
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs gap-2"
                  onClick={() => handleProcessRequest(req.id, 'rejected')}
                  disabled={isSubmitting}
                >
                  <X size={14} /> Tolak
                </Button>
              </div>
            </Card>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Check size={32} />
              </div>
              <h3 className="text-gray-900 font-bold">Semua Beres!</h3>
              <p className="text-gray-400 text-sm">Tidak ada antrean verifikasi setoran saat ini.</p>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Verifikasi Setoran</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase border-b border-gray-100 font-black tracking-widest">
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Bukti</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {history.length > 0 ? history.slice(0, 20).map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-800">{tx.member?.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{tx.date}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-3">
                    {tx.proof_url ? (
                      <button 
                        onClick={() => setSelectedProofUrl(tx.proof_url || null)}
                        className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={10} /> Lihat
                      </button>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
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
    </div>
  );
};
