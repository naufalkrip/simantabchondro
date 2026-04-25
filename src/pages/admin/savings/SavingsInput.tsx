import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { getMembers } from '../../../services/memberService';
import { getTransactions, addTransaction } from '../../../services/transactionService';
import type { Member } from '../../../types/member';
import type { Transaction } from '../../../types/transaction';

export const SavingsInput: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    type: 'setoran' as 'setoran' | 'penarikan',
    amount: ''});

  const loadData = async () => {
    const [membersData, transData] = await Promise.all([
      getMembers(),
      getTransactions()
    ]);
    setMembers(membersData);
    setTransactions(transData);};

  useEffect(() => {
    loadData();}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) return;
    
    setIsSubmitting(true);
    const amount = parseInt(formData.amount);
    if (isNaN(amount)) {
      alert('Jumlah tabungan tidak valid.');
      setIsSubmitting(false);
      return;}

    const success = await addTransaction({
      member_id: formData.member_id,
      type: formData.type,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      status: 'approved' // Direct input by admin is auto-approved
    });

    if (success) {
      setFormData({ ...formData, amount: '' });
      await loadData();
      alert('Transaksi berhasil disimpan!');
    } else {
      alert('Gagal menyimpan transaksi.');
    }
    setIsSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = Array.isArray(transactions) ? transactions.filter(t => t.date === today && t.status === 'approved') : [];
  const uangMasuk = todayTransactions.filter(t => t.type === 'setoran').reduce((acc, t) => acc + (t.amount || 0), 0);
  const uangKeluar = todayTransactions.filter(t => t.type === 'penarikan').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalNet = uangMasuk - uangKeluar;

  return (
    <div className="space-y-4">
      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border border-green-100">
          <h3 className="text-sm font-medium text-green-800">Uang Masuk Hari Ini</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">Rp {uangMasuk.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="bg-red-50 border border-red-100">
          <h3 className="text-sm font-medium text-red-800">Uang Keluar Hari Ini</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">Rp {uangKeluar.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Total Keseluruhan (Net)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">Rp {totalNet.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Input Transaksi Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Transaksi</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="setoran">Setoran (Masuk)</option>
                  <option value="penarikan">Penarikan (Keluar)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Anggota</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  required
                  value={formData.member_id}
                  onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                >
                  <option value="">-- Cari / Pilih Anggota --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.divisi})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Simpan Transaksi'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-800">Riwayat 5 Hari Terakhir</h3>
              {/* Optional: Add filter dropdown here in future */}
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs border-b">
                    <th className="px-4 py-2 font-medium">Tanggal</th>
                    <th className="px-4 py-2 font-medium">Anggota</th>
                    <th className="px-4 py-2 font-medium">Jenis</th>
                    <th className="px-4 py-2 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.slice(0, 10).map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{t.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{t.member?.name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === 'setoran' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.type === 'setoran' ? 'Setoran' : 'Penarikan'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${t.type === 'setoran' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'setoran' ? '+' : '-'} Rp {(t.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-500">Belum ada transaksi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};


