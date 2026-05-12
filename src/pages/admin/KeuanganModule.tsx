// Finance Management Module - Shared Component
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getFinanceData, saveFinanceTransaction, deleteFinanceTransaction, updateFinanceTransaction } from '../../services/financeService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { FinanceTransaction } from '../../services/financeService';
import { PlusCircle, MinusCircle, Wallet, Trash2, Pencil, Activity } from 'lucide-react';
import clsx from 'clsx';

import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false,
    id: '',
    description: ''
  });

  const fetchData = async () => {
    const data = await getFinanceData(category);
    setTransactions(data);};

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToDataChange(() => {
      fetchData();
    });

    return () => unsubscribe();
  }, [category]);

  const totalBalance = transactions.reduce((sum, t) => {
    return t.type === 'masuk' ? sum + t.amount : sum - t.amount;}, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const promise = editingId 
      ? updateFinanceTransaction(editingId, { ...formData, amount: Number(formData.amount), category, type: modalType })
      : saveFinanceTransaction({
          category,
          type: modalType,
          amount: Number(formData.amount),
          description: formData.description,
          date: formData.date
        });

    toast.promise(promise, {
      loading: 'Menyimpan transaksi...',
      success: (res) => {
        if (res) {
          setIsModalOpen(false);
          setEditingId(null);
          setFormData({
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0]});
          fetchData();
          return editingId ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil disimpan';
        }
        throw new Error('Gagal menyimpan');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsSubmitting(false);};

  const handleEdit = (transaction: FinanceTransaction) => {
    setEditingId(transaction.id);
    setModalType(transaction.type);
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setDeleteConfirm({ isOpen: true, id: tx.id, description: tx.description });
    }
  };

  const confirmDelete = async () => {
    const { id, description } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    
    const promise = deleteFinanceTransaction(id);

    toast.promise(promise, {
      loading: 'Menghapus transaksi...',
      success: () => {
        fetchData();
        return `Transaksi "${description}" berhasil dihapus`;
      },
      error: 'Gagal menghapus transaksi'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0}).format(amount);};

  const openModal = (type: 'masuk' | 'keluar') => {
    setEditingId(null);
    setModalType(type);
    setFormData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);};

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 leading-tight">{title}</h2>
          <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Manajemen dana dan riwayat transaksi {category === 'pengurus' ? 'Chondro' : category}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 text-gray-500">
            <Wallet size={16} />
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Total Dana Tersedia</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{formatCurrency(totalBalance)}</h2>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-gray-900">
          <Wallet size={100} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 mb-2 mt-2">
        <Button 
          className="w-full md:w-auto font-bold text-xs gap-1 md:gap-2 px-2 md:px-6 py-2.5 shadow-md active:scale-95 transition-all"
          onClick={() => openModal('masuk')}
        >
          <PlusCircle size={16} /> Uang Masuk
        </Button>
        <Button 
          className="w-full md:w-auto font-bold text-xs gap-1 md:gap-2 px-2 md:px-6 py-2.5 shadow-md active:scale-95 transition-all"
          onClick={() => openModal('keluar')}
        >
          <MinusCircle size={16} /> Uang Keluar
        </Button>
      </div>

      {/* Transaction History */}
      <Card className="border-0 shadow-sm ring-1 ring-gray-100 p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Riwayat Transaksi</h3>
          </div>
          <span className="text-xs font-bold bg-gray-50 text-gray-500 px-3 py-1 rounded-full border border-gray-100 hidden sm:block">
            {transactions.length} Transaksi
          </span>
        </div>

        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
          {transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={clsx("text-[10px] font-black uppercase tracking-wider", t.type === 'masuk' ? "text-green-600" : "text-red-600")}>
                      {t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <span className={clsx("text-base font-black", t.type === 'masuk' ? "text-green-600" : "text-red-600")}>
                    {t.type === 'masuk' ? '+' : '-'}{formatCurrency(t.amount).replace('Rp', '').trim()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">Belum ada transaksi.</div>
          )}
        </div>
      </Card>

      {/* Input Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? `Edit ${modalType === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}` : (modalType === 'masuk' ? 'Input Uang Masuk' : 'Input Uang Keluar')}
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
              isLoading={isSubmitting}
            >
              Simpan Transaksi
            </Button>
            <Button type="button" variant="outline" className="px-6" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Transaksi Keuangan"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.description}"? Saldo akan disesuaikan kembali.`}
      />
    </div>
  );
};



