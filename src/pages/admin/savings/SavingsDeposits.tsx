import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { getTransactions, updateTransactionStatus } from '../../../services/transactionService';
import type { Transaction } from '../../../types/transaction';

export const SavingsDeposits: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getTransactions();
    setTransactions(data.filter(t => t.type === 'setoran' && t.status === 'pending'));};

  useEffect(() => {
    loadData();}, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    if (window.confirm(`Yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} setoran ini?`)) {
      setIsProcessing(id);
      const success = await updateTransactionStatus(id, status);
      if (success) {
        await loadData();} else {
        alert('Gagal memproses setoran.');}
      setIsProcessing(null);}};

  const viewProof = (url?: string) => {
    if (url) window.open(url, '_blank');
    else alert('Bukti transfer tidak tersedia.');};

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800">Antrean Setoran (Approval)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b">
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Anggota</th>
              <th className="px-4 py-2 font-medium">Jumlah</th>
              <th className="px-4 py-2 font-medium">Bukti Transfer</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{t.date}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{t.member?.name || 'Unknown'}</td>
                <td className="px-4 py-3 font-semibold text-green-600">
                  Rp {(t.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => viewProof(t.proof_url)}>
                    Lihat Bukti
                  </Button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(t.id, 'approved')}
                      disabled={isProcessing === t.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isProcessing === t.id ? '...' : 'Setujui'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleAction(t.id, 'rejected')}
                      disabled={isProcessing === t.id}
                    >
                      Tolak
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-500">Tidak ada antrean setoran</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


