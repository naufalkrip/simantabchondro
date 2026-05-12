import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { getFinanceData, saveFinanceTransaction, deleteFinanceTransaction, updateFinanceTransaction } from '../../services/financeService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { FinanceTransaction } from '../../services/financeService';
import { PlusCircle, MinusCircle, Wallet, Trash2, Pencil, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { staggerContainer, staggerItem } from '../../lib/animations';

export const MediaFinanceSection: React.FC = () => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'masuk' | 'keluar'>('masuk');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false, id: '', description: ''
  });

  const fetchData = async () => {
    const data = await getFinanceData('media');
    setTransactions(data);
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeToDataChange(() => { fetchData(); });
    return () => unsubscribe();
  }, []);

  const { totalBalance, incomeThisMonth, expenseThisMonth } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let bal = 0;
    let inc = 0;
    let exp = 0;

    transactions.forEach(t => {
      const isCurrentMonth = new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear;
      if (t.type === 'masuk') {
        bal += t.amount;
        if (isCurrentMonth) inc += t.amount;
      } else {
        bal -= t.amount;
        if (isCurrentMonth) exp += t.amount;
      }
    });

    return { totalBalance: bal, incomeThisMonth: inc, expenseThisMonth: exp };
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const promise = editingId 
      ? updateFinanceTransaction(editingId, { ...formData, amount: Number(formData.amount), category: 'media', type: modalType })
      : saveFinanceTransaction({
          category: 'media',
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
          setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
          fetchData();
          return 'Transaksi berhasil disimpan';
        }
        throw new Error('Gagal menyimpan');
      },
      error: 'Terjadi kesalahan sistem'
    });
    setIsSubmitting(false);
  };

  const openModal = (type: 'masuk' | 'keluar', tx?: FinanceTransaction) => {
    if (tx) {
      setEditingId(tx.id);
      setModalType(tx.type);
      setFormData({ amount: tx.amount.toString(), description: tx.description, date: tx.date });
    } else {
      setEditingId(null);
      setModalType(type);
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    const promise = deleteFinanceTransaction(id);
    toast.promise(promise, {
      loading: 'Menghapus transaksi...',
      success: () => { fetchData(); return `Transaksi dihapus`; },
      error: 'Gagal menghapus'
    });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={staggerItem} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
              <Wallet size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Total Dana</h3>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 text-blue-600">
            <Wallet size={100} />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-100 transition-colors">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-green-600">
              <ArrowUpRight size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Pemasukan (Bulan Ini)</h3>
            </div>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(incomeThisMonth)}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 text-green-600">
            <ArrowUpRight size={100} />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-red-100 transition-colors">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <ArrowDownRight size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Pengeluaran (Bulan Ini)</h3>
            </div>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(expenseThisMonth)}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 text-red-600">
            <ArrowDownRight size={100} />
          </div>
        </motion.div>
      </motion.div>

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

      {/* Transactions List */}
      <Card className="border-0 shadow-sm ring-1 ring-gray-100 p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Riwayat Transaksi</h3>
          </div>
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
                    <button onClick={() => openModal(t.type, t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: t.id, description: t.description })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">Belum ada transaksi.</div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? `Edit Transaksi` : `Input Uang ${modalType === 'masuk' ? 'Masuk' : 'Keluar'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Jumlah Uang (Rp)</label>
            <input type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Keterangan</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Tanggal</label>
            <input type="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Transaksi"
        message={`Hapus transaksi "${deleteConfirm.description}"?`}
      />
    </div>
  );
};
