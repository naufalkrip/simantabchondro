import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  getFinanceReports,
  getTransactionsByReport,
  createFinanceReport,
  saveTransactionToReport,
  updateFinanceTransaction,
  deleteFinanceTransaction,
  deleteFinanceReport,
} from '../../services/financeService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { FinanceTransaction, FinanceReportWithTotals } from '../../services/financeService';
import { PlusCircle, MinusCircle, Pencil, Trash2, History, Calendar, Plus, Download, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import jsPDF from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';
import logoUrl from '../../assets/logo.png';

interface RowInput {
  id: string;
  description: string;
  type: 'masuk' | 'keluar';
  amount: string;
}

export const TransaksiLain: React.FC = () => {
  const [reports, setReports] = useState<FinanceReportWithTotals[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- View state ---
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<FinanceReportWithTotals | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);

  // --- Create report modal ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportDate, setNewReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReportDesc, setNewReportDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // --- Batch input ---
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<RowInput[]>([createRow()]);
  const [isSaving, setIsSaving] = useState(false);

  // --- Edit ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<'masuk' | 'keluar'>('masuk');
  const [editAmount, setEditAmount] = useState('');
  const [isEditSaving, setIsEditSaving] = useState(false);

  // --- Delete confirm ---
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'transaction' | 'report';
    id: string;
    label: string;
  }>({ isOpen: false, type: 'transaction', id: '', label: '' });

  function createRow(): RowInput {
    return { id: `row_${Date.now()}_${Math.random()}`, description: '', type: 'masuk', amount: '' };
  }

  // --- Fetch reports ---
  const fetchReports = async () => {
    setIsLoading(true);
    const data = await getFinanceReports();
    setReports(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
    const unsub = subscribeToDataChange(() => {
      if (activeReportId) {
        loadReport(activeReportId);
      } else {
        fetchReports();
      }
    });
    return () => unsub();
  }, []);

  // --- Load report detail ---
  const loadReport = async (id: string) => {
    const allReports = await getFinanceReports();
    const report = allReports.find(r => r.id === id);
    if (report) {
      setActiveReport(report);
      setActiveReportId(id);
      const txs = await getTransactionsByReport(id);
      setTransactions(txs);
    }
  };

  const goBack = () => {
    setActiveReportId(null);
    setActiveReport(null);
    setTransactions([]);
    fetchReports();
  };

  // --- Create report ---
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim()) {
      toast.error('Judul laporan harus diisi');
      return;
    }
    setIsCreating(true);
    try {
      const id = await createFinanceReport({
        title: newReportTitle.trim(),
        date: newReportDate,
        description: newReportDesc.trim(),
      });
      toast.success('Laporan berhasil dibuat');
      setIsCreateModalOpen(false);
      setNewReportTitle('');
      setNewReportDesc('');
      setNewReportDate(new Date().toISOString().split('T')[0]);
      await fetchReports();
      loadReport(id);
    } catch (error: any) {
      toast.error('Gagal membuat laporan: ' + (error?.message || 'Terjadi kesalahan'));
      console.error('Create Report Error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // --- Batch input ---
  const addRow = () => {
    setRows(prev => [...prev, createRow()]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof RowInput, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportId) return;

    const validRows = rows.filter(r => r.description.trim() && r.amount && Number(r.amount) > 0);
    if (validRows.length === 0) {
      toast.error('Minimal satu baris dengan nama dan nominal valid');
      return;
    }

    setIsSaving(true);
    const promises = validRows.map(r =>
      saveTransactionToReport({
        date: inputDate,
        description: r.description.trim(),
        type: r.type,
        amount: Number(r.amount),
        category: 'pengurus',
        report_id: activeReportId,
      })
    );

    try {
      const results = await Promise.all(promises);
      const allSuccess = results.every(Boolean);
      if (allSuccess) {
        toast.success(`${validRows.length} transaksi berhasil disimpan`);
        setInputDate(new Date().toISOString().split('T')[0]);
        setRows([createRow()]);
        loadReport(activeReportId);
      } else {
        toast.error('Beberapa transaksi gagal disimpan');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Edit transaction ---
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
          if (activeReportId) loadReport(activeReportId);
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

  // --- Delete ---
  const handleDeleteTransaction = (tx: FinanceTransaction) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'transaction',
      id: tx.id,
      label: tx.description,
    });
  };

  const handleDeleteReport = (report: FinanceReportWithTotals) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'report',
      id: report.id,
      label: report.title,
    });
  };

  const confirmDelete = async () => {
    const { type, id, label } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));

    if (type === 'transaction') {
      const promise = deleteFinanceTransaction(id);
      toast.promise(promise, {
        loading: 'Menghapus transaksi...',
        success: () => {
          if (activeReportId) loadReport(activeReportId);
          return `Transaksi "${label}" berhasil dihapus`;
        },
        error: 'Gagal menghapus transaksi'
      });
    } else {
      const promise = deleteFinanceReport(id);
      toast.promise(promise, {
        loading: 'Menghapus laporan...',
        success: () => {
          goBack();
          return `Laporan "${label}" berhasil dihapus`;
        },
        error: 'Gagal menghapus laporan'
      });
    }
  };

  // --- Download PDF ---
  const downloadReportPDF = async (report: FinanceReportWithTotals, txs: FinanceTransaction[]) => {
    const doc = new jsPDF({ unit: 'px', format: 'a4' });
    const pageSize = doc.internal.pageSize;
    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    const margin = 28;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const logoHeight = 28;
    const logoWidth = logoHeight * (img.naturalWidth / img.naturalHeight);
    doc.addImage(img, 'PNG', margin, 24, logoWidth, logoHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(139, 0, 0);
    doc.text('SIMANTAB', margin + logoWidth + 10, 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistem Manajemen Informasi Anggota MB Chondro', margin + logoWidth + 10, 48);

    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const dateText = `Tanggal dibuat: ${today}`;
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 36);

    const lineY = 24 + logoHeight + 12;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text('LAPORAN KEGIATAN', margin, lineY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(report.title, margin, lineY + 32);

    let y = lineY + 42;

    if (report.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(report.description, margin, y);
      y += 14;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.text(`Tanggal Laporan: ${formatDate(report.date)}`, margin, y);
    y += 12;
    doc.text(`Total Transaksi: ${txs.length}`, margin, y);
    y += 18;

    if (txs.length > 0) {
      const columns = ['No', 'Deskripsi', 'Tanggal', 'Jenis', 'Nominal'];
      const data = txs.map((t, i) => [
        String(i + 1),
        t.description,
        formatDate(t.date),
        t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        `Rp ${t.amount.toLocaleString('id-ID')}`,
      ]);

      const totalMasuk = txs.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0);
      const totalKeluar = txs.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0);

      data.push(['', '', '', 'TOTAL PEMASUKAN', `Rp ${totalMasuk.toLocaleString('id-ID')}`]);
      data.push(['', '', '', 'TOTAL PENGELUARAN', `Rp ${totalKeluar.toLocaleString('id-ID')}`]);
      data.push(['', '', '', 'SALDO', `Rp ${(totalMasuk - totalKeluar).toLocaleString('id-ID')}`]);

      autoTable(doc, {
        startY: y,
        head: [columns],
        body: data,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 4,
          lineColor: [240, 240, 240],
          lineWidth: 0.5,
          textColor: [60, 60, 60],
        },
        headStyles: {
          fillColor: [139, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252],
        },
        columnStyles: {
          0: { cellWidth: 24, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 90 },
          3: { cellWidth: 80 },
          4: { cellWidth: 90, halign: 'right' },
        },
        didParseCell: (hookData: CellHookData) => {
          const isTotal = hookData.row.index >= txs.length;
          if (isTotal && hookData.section === 'body') {
            hookData.cell.styles.fillColor = [245, 245, 245];
            hookData.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: () => {
          const fy = pageHeight - 24;
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.5);
          doc.line(margin, fy - 6, pageWidth - margin, fy - 6);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text('SIMANTAB | Sistem Manajemen Informasi Anggota MB Chondro', margin, fy);
        },
      });
    }

    const fy = pageHeight - 24;
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, fy - 6, pageWidth - margin, fy - 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('SIMANTAB | Sistem Manajemen Informasi Anggota MB Chondro', margin, fy);

    const safeName = report.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    doc.save(`laporan_${safeName}_${report.date}.pdf`);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const totalMasuk = rows.reduce((sum, r) => sum + (r.type === 'masuk' && r.amount ? Number(r.amount) || 0 : 0), 0);
  const totalKeluar = rows.reduce((sum, r) => sum + (r.type === 'keluar' && r.amount ? Number(r.amount) || 0 : 0), 0);

  // ==================== RENDER ====================

  // --- View: Detail Laporan ---
  if (activeReport && activeReportId) {
    const reportTxs = transactions;
    const sumMasuk = reportTxs.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0);
    const sumKeluar = reportTxs.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">{activeReport.title}</h2>
              {activeReport.description && (
                <p className="text-[11px] text-gray-500 mt-0.5">{activeReport.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadReportPDF(activeReport, reportTxs)}
                variant="outline"
                className="gap-2"
              >
                <Download size={15} />
                Download PDF
              </Button>
              <Button
                onClick={() => handleDeleteReport(activeReport)}
                variant="danger"
                className="gap-2"
              >
                <Trash2 size={15} />
                Hapus
              </Button>
            </div>
          </div>
          <p className="text-[11px] md:text-xs text-gray-500">{formatDate(activeReport.date)}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl shadow-sm">
            <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Total Pemasukan</p>
            <h3 className="text-base md:text-lg font-bold text-green-700 leading-none">{formatCurrency(sumMasuk)}</h3>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl shadow-sm">
            <p className="text-[9px] md:text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Total Pengeluaran</p>
            <h3 className="text-base md:text-lg font-bold text-red-700 leading-none">{formatCurrency(sumKeluar)}</h3>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
            <p className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Jumlah Transaksi</p>
            <h3 className="text-base md:text-lg font-bold text-blue-700 leading-none">{reportTxs.length}</h3>
          </div>
        </div>

        {/* Batch Input Form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Input Transaksi</h3>
          </div>
          <form onSubmit={handleSubmitAll} className="p-4 space-y-4">
            <div className="max-w-xs">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  required
                  className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              {rows.map((row) => (
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-4 text-sm">
                <span className="font-bold text-green-600">+ Rp {totalMasuk.toLocaleString('id-ID')}</span>
                <span className="font-bold text-red-600">- Rp {totalKeluar.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addRow}>
                  <Plus size={16} className="mr-1" />
                  Tambah Baris
                </Button>
                <Button type="submit" isLoading={isSaving} variant="primary">
                  <PlusCircle size={16} className="mr-1" />
                  Simpan Semua
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Transaction List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Riwayat Transaksi</h3>
            </div>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              {reportTxs.length} transaksi
            </span>
          </div>

          {reportTxs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Belum ada transaksi dalam laporan ini.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-xs border-b border-gray-100">
                      <th className="px-4 py-2.5 font-bold">Nama Transaksi</th>
                      <th className="px-4 py-2.5 font-bold">Tanggal</th>
                      <th className="px-4 py-2.5 font-bold">Jenis</th>
                      <th className="px-4 py-2.5 font-bold text-right">Nominal</th>
                      <th className="px-4 py-2.5 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-50">
                    {reportTxs.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800 text-sm">{t.description}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                            t.type === 'masuk'
                              ? 'text-green-600 border-green-200 bg-green-50'
                              : 'text-red-600 border-red-200 bg-red-50'
                          }`}>
                            {t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-bold text-right text-sm ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'masuk' ? '+' : '-'}{formatCurrency(t.amount).replace('Rp', '').trim()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteTransaction(t)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-50">
                {reportTxs.map((t) => (
                  <div key={t.id} className="px-4 py-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{t.description}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(t.date)}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                        t.type === 'masuk'
                          ? 'text-green-600 border-green-200 bg-green-50'
                          : 'text-red-600 border-red-200 bg-red-50'
                      }`}>
                        {t.type === 'masuk' ? 'Masuk' : 'Keluar'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                      <p className={`text-base font-black ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'masuk' ? '+' : '-'}{formatCurrency(t.amount).replace('Rp', '').trim()}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(t)} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t)} className="p-2 bg-red-50 text-red-600 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={resetEditForm} title="Edit Transaksi">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tanggal</label>
              <input type="date" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nama Transaksi</label>
              <input type="text" required placeholder="Contoh: Hasil Jualan, Biaya Sewa" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nominal (Rp)</label>
              <input type="number" required placeholder="0" min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Jenis</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditType('masuk')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${editType === 'masuk' ? 'bg-green-50 text-green-700 border-green-400 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                  <PlusCircle size={18} /> Masuk
                </button>
                <button type="button" onClick={() => setEditType('keluar')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${editType === 'keluar' ? 'bg-red-50 text-red-700 border-red-400 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                  <MinusCircle size={18} /> Keluar
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetEditForm}>Batal</Button>
              <Button type="submit" isLoading={isEditSaving} variant="primary" className="flex-1">Simpan Perubahan</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==================== VIEW: Daftar Laporan ====================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Laporan Kegiatan</h2>
          <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Rekap pemasukan dan pengeluaran per kegiatan</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
        >
          <PlusCircle size={18} />
          Buat Laporan
        </Button>
      </div>

      {/* Report List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daftar Laporan</h3>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            {reports.length} laporan
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Memuat...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Belum ada laporan. Klik "Buat Laporan" untuk memulai.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-xs border-b border-gray-100">
                    <th className="px-4 py-2.5 font-bold">Judul Laporan</th>
                    <th className="px-4 py-2.5 font-bold">Tanggal</th>
                    <th className="px-4 py-2.5 font-bold text-right">Pemasukan</th>
                    <th className="px-4 py-2.5 font-bold text-right">Pengeluaran</th>
                    <th className="px-4 py-2.5 font-bold text-center">Transaksi</th>
                    <th className="px-4 py-2.5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => loadReport(r.id)}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800 text-sm">{r.title}</p>
                        {r.description && <p className="text-[10px] text-gray-400 mt-0.5">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 font-bold text-right text-green-600 text-sm">{formatCurrency(r.total_masuk).replace('Rp', '').trim()}</td>
                      <td className="px-4 py-3 font-bold text-right text-red-600 text-sm">{formatCurrency(r.total_keluar).replace('Rp', '').trim()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {r.transaction_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => loadReport(r.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => downloadReportPDF({ ...r, description: r.description || '' }, [])}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(r); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Laporan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-gray-50">
              {reports.map((r) => (
                <div key={r.id} onClick={() => loadReport(r.id)} className="px-4 py-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(r.date)}</p>
                      {r.description && <p className="text-[10px] text-gray-400 truncate mt-0.5">{r.description}</p>}
                    </div>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {r.transaction_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 text-xs">
                      <span className="font-bold text-green-600">+ Rp {r.total_masuk.toLocaleString('id-ID')}</span>
                      <span className="font-bold text-red-600">- Rp {r.total_keluar.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => loadReport(r.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={14} />
                      </button>
                      <button onClick={() => downloadReportPDF({ ...r, description: r.description || '' }, [])} className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Download size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(r); }} className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Report Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Buat Laporan Baru">
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Judul Laporan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Laporan Dana Pembuatan Kaos"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
              value={newReportTitle}
              onChange={(e) => setNewReportTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                required
                className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
                value={newReportDate}
                onChange={(e) => setNewReportDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Deskripsi (Opsional)</label>
            <textarea
              placeholder="Keterangan kegiatan..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30 resize-none"
              value={newReportDesc}
              onChange={(e) => setNewReportDesc(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
            <Button type="submit" isLoading={isCreating} variant="primary" className="flex-1">Buat Laporan</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title={deleteConfirm.type === 'report' ? 'Hapus Laporan' : 'Hapus Transaksi'}
        message={
          deleteConfirm.type === 'report'
            ? `Apakah Anda yakin ingin menghapus laporan "${deleteConfirm.label}"? Semua transaksi di dalamnya akan ikut terhapus.`
            : `Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.label}"?`
        }
      />
    </div>
  );
};
