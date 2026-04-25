import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { getTransactions, updateTransactionStatus } from '../../../services/transactionService';
import type { Transaction } from '../../../types/transaction';

export const SavingsWithdrawals: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<Record<string, string>>({});

  const loadData = async () => {
    const data = await getTransactions();
    setTransactions(data.filter(t => t.type === 'penarikan' && t.status === 'pending'));};

  useEffect(() => {
    loadData();}, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'approved' && !proofUrl[id]) {
      alert('Anda harus mengisi/mengupload link bukti transfer ke anggota terlebih dahulu.');
      return;}

    if (window.confirm(`Yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} penarikan ini?`)) {
      setIsProcessing(id);
      const success = await updateTransactionStatus(id, status, proofUrl[id]);
      if (success) {
        setProofUrl(prev => {
          const newState = {...prev};
          delete newState[id];
          return newState;});
        await loadData();} else {
        alert('Gagal memproses penarikan.');}
      setIsProcessing(null);}};

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800">Antrean Penarikan (Approval)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b">
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Anggota</th>
              <th className="px-4 py-2 font-medium">Jumlah</th>
              <th className="px-4 py-2 font-medium">Bukti Transfer (Admin)</th>
              <th className="px-4 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{t.date}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{t.member?.name || 'Unknown'}</td>
                <td className="px-4 py-3 font-semibold text-red-600">
                  Rp {(t.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="text" 
                    placeholder="Masukkan URL/Link bukti transfer"
                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-red-500 focus:border-red-500 text-xs"
                    value={proofUrl[t.id] || ''}
                    onChange={(e) => setProofUrl({...proofUrl, [t.id]: e.target.value})}
                  />
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
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-500">Tidak ada antrean penarikan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


