// Finance Management Module - Shared Component
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getFinanceData, saveFinanceTransaction, deleteFinanceTransaction } from '../../services/financeService';
import type { FinanceTransaction } from '../../services/financeService';
import { PlusCircle, MinusCircle, Wallet, Trash2, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface KeuanganModuleProps {
  category: 'pengurus' | 'media';
  title: string;
}

export const KeuanganModule: React.FC<KeuanganModuleProps> = ({ category, title }) => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'masuk' | 'keluar'>('masuk');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]});

  const fetchData = async () => {
    const data = await getFinanceData(category);
    setTransactions(data);};

  useEffect(() => {
    fetchData();}, [category]);

  const totalBalance = transactions.reduce((sum, t) => {
    return t.type === 'masuk' ? sum + t.amount : sum - t.amount;}, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await saveFinanceTransaction({
      category,
      type: modalType,
      amount: Number(formData.amount),
      description: formData.description,
      date: formData.date});

    if (success) {
      setIsModalOpen(false);
      setFormData({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]});
      await fetchData();} else {
      alert('Gagal menyimpan transaksi!');}
    setIsSubmitting(false);};

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      const success = await deleteFinanceTransaction(id);
      if (success) {
        await fetchData();}}};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0}).format(amount);};

  const openModal = (type: 'masuk' | 'keluar') => {
    setModalType(type);
    setIsModalOpen(true);};

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 md:p-4 border-b border-gray-200 rounded-md shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manajemen dana dan riwayat transaksi {category}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={() => openModal('masuk')} 
            variant="outline" 
            size="sm" 
            className="flex-1 md:flex-none gap-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <PlusCircle size={16} /> Uang Masuk
          </Button>
          <Button 
            onClick={() => openModal('keluar')} 
            variant="outline" 
            size="sm" 
            className="flex-1 md:flex-none gap-2 border-red-100 text-red-600 hover:bg-red-50 active:scale-95 transition-all"
          >
            <MinusCircle size={16} /> Uang Keluar
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-gradient-to-r from-red-700 to-red-900 text-white shadow-sm rounded-md overflow-hidden relative border border-red-700/10">
        <div className="relative z-10">
          <p className="text-white/80 text-xs font-bold uppercase tracking-[0.1em] mb-1">Total Dana Tersedia</p>
          <h2 className="text-2xl font-bold leading-none">{formatCurrency(totalBalance)}</h2>
        </div>
        <div className="absolute top-0 right-0 p-5 opacity-10">
          <Wallet size={60} />
        </div>
      </div>

      {/* Transaction History */}
      <Card className="overflow-hidden p-0 border-0 shadow-sm ring-1 ring-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-red-700 rounded-full" />
            <h3 className="text-base font-bold text-gray-800">Riwayat Transaksi</h3>
          </div>
          <span className="text-sm font-bold  bg-gray-50 text-gray-500 px-3 py-1 rounded-full border border-gray-100">
            {transactions.length} Transaksi
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs  border-b border-gray-100">
                <th className="px-6 py-3 font-bold">Keterangan</th>
                <th className="px-6 py-3 font-bold">Tanggal</th>
                <th className="px-6 py-3 font-bold text-right">Jumlah</th>
                <th className="px-6 py-3 font-bold text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{t.description}</p>
                      <p className={clsx("text-xs font-bold uppercase",
                        t.type === 'masuk' ? "text-green-600" : "text-red-600"
                      )}>
                        {t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className={clsx("px-6 py-4 text-right font-bold text-base",
                      t.type === 'masuk' ? "text-green-600" : "text-red-600"
                    )}>
                      {t.type === 'masuk' ? '+' : '-'} {formatCurrency(t.amount).replace('Rp', '').trim()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    Belum ada riwayat transaksi untuk kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Input Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalType === 'masuk' ? 'Input Uang Masuk' : 'Input Uang Keluar'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700  mb-1.5">Jumlah Uang (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700  mb-1.5">Keterangan</label>
            <textarea
              required
              placeholder="Contoh: Iuran bulanan, Pembelian peralatan, dll"
              rows={3}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700  mb-1.5">Tanggal</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="submit" 
              className={clsx("flex-1 h-11 border-none",
                modalType === 'masuk' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Simpan Transaksi'}
            </Button>
            <Button type="button" variant="outline" className="px-6" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};



