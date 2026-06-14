import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  getFinanceData,
  saveFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction
} from '../../services/financeService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { FinanceTransaction } from '../../services/financeService';
import { PlusCircle, MinusCircle, Pencil, Trash2, History, Calendar, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface RowInput {
  id: string;
  description: string;
  type: 'masuk' | 'keluar';
  amount: string;
}

export const TransaksiLain: React.FC = () => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<RowInput[]>([createRow()]);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<'masuk' | 'keluar'>('masuk');
  const [editAmount, setEditAmount] = useState('');
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false, id: '', description: ''
  });

  let rowCounter = 0;
  function createRow(): RowInput {
    return { id: `row_${++rowCounter}_${Date.now()}`, description: '', type: 'masuk', amount: '' };
  }

  const fetchData = async () => {
    setIsLoading(true);
    const data = await getFinanceData('pengurus');
    setTransactions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    const unsub = subscribeToDataChange(() => fetchData());
    return () => unsub();
  }, []);

  const addRow = () => {
    setRows(prev => [...prev, { id: `row_${Date.now()}_${Math.random()}`, description: '', type: 'masuk', amount: '' }]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof RowInput, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRows = rows.filter(r => r.description.trim() && r.amount && Number(r.amount) > 0);
    if (validRows.length === 0) {
      toast.error('Minimal satu baris dengan nama dan nominal valid');
      return;
    }

    setIsSaving(true);
    const promises = validRows.map(r =>
      saveFinanceTransaction({
        date,
        description: r.description.trim(),
        type: r.type,
        amount: Number(r.amount),
        category: 'pengurus',
      })
    );

    try {
      const results = await Promise.all(promises);
      const allSuccess = results.every(Boolean);
      if (allSuccess) {
        toast.success(`${validRows.length} transaksi berhasil disimpan`);
        setDate(new Date().toISOString().split('T')[0]);
        setRows([createRow()]);
        fetchData();
      } else {
        toast.error('Beberapa transaksi gagal disimpan');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  };

  const resetEditForm = () => {
    setEditingId(null);
    setEditDate('');
    setEditDescription('');
    setEditType('masuk');
    setEditAmount('');
    setIsEditModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDescription.trim()) {
      toast.error('Nama transaksi harus diisi');
      return;
    }
    if (!editAmount || Number(editAmount) <= 0) {
      toast.error('Nominal harus diisi dengan benar');
      return;
    }

    setIsEditSaving(true);
    const data = {
      date: editDate,
      description: editDescription.trim(),
      type: editType,
      amount: Number(editAmount),
      category: 'pengurus' as const,
    };

    const promise = updateFinanceTransaction(editingId!, data);

    toast.promise(promise, {
      loading: 'Memperbarui transaksi...',
      success: (res) => {
        if (res) {
          resetEditForm();
          fetchData();
          return 'Transaksi berhasil diperbarui';
        }
        throw new Error('Gagal menyimpan');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsEditSaving(false);
  };

  const openEditModal = (tx: FinanceTransaction) => {
    setEditingId(tx.id);
    setEditDate(tx.date);
    setEditDescription(tx.description);
    setEditType(tx.type);
    setEditAmount(tx.amount.toString());
    setIsEditModalOpen(true);
  };

  const handleDelete = (tx: FinanceTransaction) => {
    setDeleteConfirm({ isOpen: true, id: tx.id, description: tx.description });
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

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const totalMasuk = rows.reduce((sum, r) => sum + (r.type === 'masuk' && r.amount ? Number(r.amount) || 0 : 0), 0);
  const totalKeluar = rows.reduce((sum, r) => sum + (r.type === 'keluar' && r.amount ? Number(r.amount) || 0 : 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Transaksi Lainnya</h2>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Catat pemasukan dan pengeluaran kegiatan</p>
      </div>

      {/* Batch Input Form */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Input Transaksi</h3>
        </div>
        <form onSubmit={handleSubmitAll} className="p-4 space-y-4">
          {/* Date */}
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                required
                className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={row.id} className="flex items-start gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 md:hidden">Nama Transaksi</label>
                    <input
                      type="text"
                      placeholder="Nama transaksi"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-white"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 md:hidden">Jenis</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'type', 'masuk')}
                        className={`flex-1 px-2 py-2.5 rounded-lg text-xs font-bold border-2 transition-all ${
                          row.type === 'masuk'
                            ? 'bg-green-50 text-green-700 border-green-400'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'type', 'keluar')}
                        className={`flex-1 px-2 py-2.5 rounded-lg text-xs font-bold border-2 transition-all ${
                          row.type === 'keluar'
                            ? 'bg-red-50 text-red-700 border-red-400'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 md:hidden">Nominal (Rp)</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-white"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="p-2.5 mt-0 md:mt-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                  disabled={rows.length === 1}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4 text-sm">
              <span className="font-bold text-green-600">+ Rp {totalMasuk.toLocaleString('id-ID')}</span>
              <span className="font-bold text-red-600">- Rp {totalKeluar.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-12 text-sm font-bold px-4" onClick={addRow}>
                <Plus size={16} className="mr-1" />
                Tambah Baris
              </Button>
              <Button type="submit" isLoading={isSaving} variant="primary" className="h-12 text-sm font-bold px-6">
                <PlusCircle size={16} className="mr-1" />
                Simpan Semua
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* History Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-gray-400" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Riwayat Transaksi</h3>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            {transactions.length} transaksi
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Memuat...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Belum ada transaksi.</div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {[...transactions].reverse().map((t) => (
              <div key={t.id} className="px-4 py-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(t.date)}</p>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <p className={`text-base font-black ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'masuk' ? '+' : '-'}{formatCurrency(t.amount).replace('Rp', '').trim()}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${t.type === 'masuk' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={resetEditForm}
        title="Edit Transaksi"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tanggal</label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nama Transaksi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Hasil Jualan, Biaya Sewa"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nominal (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Jenis</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditType('masuk')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  editType === 'masuk'
                    ? 'bg-green-50 text-green-700 border-green-400 shadow-sm'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                <PlusCircle size={18} />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setEditType('keluar')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  editType === 'keluar'
                    ? 'bg-red-50 text-red-700 border-red-400 shadow-sm'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                <MinusCircle size={18} />
                Keluar
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12 text-sm font-bold" onClick={resetEditForm}>
              Batal
            </Button>
            <Button type="submit" isLoading={isEditSaving} variant="primary" className="flex-1 h-12 text-sm font-bold">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.description}"?`}
      />
    </div>
  );
};
