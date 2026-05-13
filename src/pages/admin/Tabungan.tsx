import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Wallet, PlusCircle, MinusCircle, FileText, Search, Pencil, Trash2, Calendar } from 'lucide-react';
import { getMembers, computeMemberBalances } from '../../services/memberService';
import { getTransactions, addTransaction, deleteTransaction, updateTransaction } from '../../services/transactionService';
import type { Member } from '../../types/member';
import type { Transaction } from '../../types/transaction';
import { exportModernPDF } from '../../utils/pdfExport';
import { subscribeToDataChange } from '../../services/refreshService';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const Tabungan: React.FC = () => {
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isAllMembersModalOpen, setIsAllMembersModalOpen] = useState(false);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('Semua');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; amount: number; memberName: string }>({
    isOpen: false,
    id: '',
    amount: 0,
    memberName: ''
  });

  const [formData, setFormData] = useState({
    type: 'setoran' as 'setoran' | 'penarikan',
    memberId: '',
    nominal: '',
    note: ''
  });

  // Date range state for filtering and PDF
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    const [memberData, transactionData] = await Promise.all([
      getMembers(),
      getTransactions()
    ]);
    
    const membersWithBalance = computeMemberBalances(memberData, transactionData);
    setMembers(membersWithBalance);
    setTransactions(transactionData);
    
    const total = membersWithBalance.reduce((acc, m) => acc + (m.totalBalance || 0), 0);
    setTotalBalance(total);
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeToDataChange(() => {
      fetchData();
    });
    const pollInterval = setInterval(() => fetchData(), 15000);
    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [fetchData]);

  const divisions = useMemo(
    () => ['Semua', ...Array.from(new Set(members.map(m => m.divisi)))],
    [members]
  );

  const filteredMembers = useMemo(
    () => members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDivision = selectedDivision === 'Semua' || m.divisi === selectedDivision;
      return matchesSearch && matchesDivision;
    }),
    [members, searchQuery, selectedDivision]
  );

  const filteredTransactions = useMemo(
    () => transactions.filter(t => {
      const tDate = t.date;
      return tDate >= startDate && tDate <= endDate;
    }),
    [transactions, startDate, endDate]
  );

  const getFilteredTransactions = useCallback(() => filteredTransactions, [filteredTransactions]);

  const downloadHistoryPDF = async () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada transaksi untuk diunduh');
      return;
    }

    const tableData = filteredTransactions.map(t => [
      t.member?.name || 'Unknown',
      `${t.date} ${t.created_at ? new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}`,
      t.type === 'setoran' ? 'SETORAN' : 'PENARIKAN',
      formatCurrency(t.amount).replace('Rp', '').trim()
    ]);

    const toastId = toast.loading('Membuat dokumen PDF...');
    try {
      await exportModernPDF({
        title: `Riwayat Transaksi Tabungan (Periode: ${startDate} s/d ${endDate})`,
        filename: `Riwayat_Transaksi_SIMANTAB_${startDate}_to_${endDate}`,
        columns: ['Nama Anggota', 'Waktu Transaksi', 'Jenis', 'Nominal (Rp)'],
        data: tableData,
        columnStyles: {
          3: { halign: 'right', fontStyle: 'bold' }
        }
      });
      toast.success('Riwayat transaksi PDF berhasil diunduh', { id: toastId });
    } catch (err) {
      toast.error('Gagal membuat laporan PDF', { id: toastId });
    }
  };

  const downloadMemberSavingsPDF = async () => {
    const activeMembers = members.filter(m => (m.totalBalance || 0) > 0)
      .sort((a, b) => (b.totalBalance || 0) - (a.totalBalance || 0));

    if (activeMembers.length === 0) {
      toast.error('Tidak ada data saldo anggota untuk diunduh');
      return;
    }

    const tableData = activeMembers.map((m, index) => [
      index + 1,
      m.name,
      m.divisi.toUpperCase(),
      formatCurrency(m.totalBalance || 0).replace('Rp', '').trim()
    ]);

    // Add total row at the bottom
    tableData.push([
      '', 
      'TOTAL AKUMULASI SALDO', 
      '', 
      formatCurrency(totalBalance).replace('Rp', '').trim()
    ]);

    const toastId = toast.loading('Membuat dokumen PDF...');

    try {
      await exportModernPDF({
        title: 'Laporan Total Tabungan Anggota',
        filename: `Total_Tabungan_Anggota_${new Date().toISOString().split('T')[0]}`,
        columns: ['No', 'Nama Anggota', 'Divisi', 'Total Saldo (Rp)'],
        data: tableData,
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 80 },
          3: { halign: 'right', fontStyle: 'bold' }
        }
      });
      toast.success('Laporan tabungan PDF berhasil diunduh', { id: toastId });
    } catch (err) {
      toast.error('Gagal membuat laporan PDF', { id: toastId });
    }
  };

  const getMemberHistory = (memberId: string) => {
    return transactions
      .filter(t => t.member_id === memberId)
      .slice(0, 5);
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      type: tx.type as 'setoran' | 'penarikan',
      memberId: tx.member_id,
      nominal: tx.amount.toString(),
      note: tx.note || ''
    });
    setIsInputModalOpen(true);
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    
    const promise = deleteTransaction(id);

    toast.promise(promise, {
      loading: 'Menghapus transaksi...',
      success: () => 'Transaksi berhasil dihapus',
      error: 'Gagal menghapus transaksi'
    });
  };

  const handleDelete = (tx: Transaction) => {
    setDeleteConfirm({
      isOpen: true,
      id: tx.id,
      amount: tx.amount,
      memberName: tx.member?.name || 'Unknown'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.nominal) return;

    setIsSubmitting(true);
    
    const promise = editingId 
      ? updateTransaction(editingId, {
          member_id: formData.memberId,
          type: formData.type as 'setoran' | 'penarikan',
          amount: Number(formData.nominal),
          note: formData.note
        })
      : addTransaction({
          member_id: formData.memberId,
          type: formData.type as 'setoran' | 'penarikan',
          amount: Number(formData.nominal),
          date: new Date().toISOString().split('T')[0],
          status: 'approved', // Manual input by admin is automatically approved
          proof_url: '',
          note: formData.note
        });

    toast.promise(promise, {
      loading: 'Menyimpan transaksi...',
      success: (res) => {
        if (res) {
          setIsInputModalOpen(false);
          setEditingId(null);
          setFormData({ type: 'setoran', memberId: '', nominal: '', note: '' });
          return editingId ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil disimpan';
        }
        throw new Error('Gagal menyimpan');
      },
      error: 'Terjadi kesalahan sistem'
    });
    
    setIsSubmitting(false);
  };

  /* 
  const handleProcessRequest = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} permintaan ini?`)) return;
    
    setIsSubmitting(true);
    const success = await updateTransactionStatus(id, status);
    if (success) {
      alert(`Permintaan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      await fetchData();
    } else {
      alert('Gagal memproses permintaan.');
    }
    setIsSubmitting(false);
  };
  */

  // const pendingSetoran = transactions.filter(t => t.type === 'setoran' && t.status === 'pending');
  // const pendingPenarikan = transactions.filter(t => t.type === 'penarikan' && t.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Header Box */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 leading-tight">Manajemen Tabungan</h2>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Kelola saldo, setoran, dan penarikan anggota</p>
      </div>



      {/* Main Balance Card (Minimalist Highlight) */}
      <div className="p-4 bg-gradient-to-r from-red-700 to-red-900 text-white shadow-sm rounded-xl overflow-hidden relative border border-red-700/10">
        <div className="relative z-10">
          <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] mb-1">Total Saldo Tabungan</p>
          <h2 className="text-xl md:text-2xl font-bold leading-none">{formatCurrency(totalBalance)}</h2>
        </div>
        <div className="absolute top-0 right-0 p-4 md:p-5 opacity-10">
          <Wallet size={48} className="md:size-[60px]" />
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 border border-green-100 rounded-xl shadow-sm">
          <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Uang Masuk Hari Ini</p>
          <h3 className="text-base md:text-lg font-bold text-green-700 leading-none">
            {formatCurrency(
              transactions
                .filter(t => t.type === 'setoran' && t.status === 'approved' && t.date === new Date().toISOString().split('T')[0])
                .reduce((acc, t) => acc + t.amount, 0)
            )}
          </h3>
        </div>
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl shadow-sm">
          <p className="text-[9px] md:text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Uang Keluar Hari Ini</p>
          <h3 className="text-base md:text-lg font-bold text-red-700 leading-none">
            {formatCurrency(
              transactions
                .filter(t => t.type === 'penarikan' && t.status === 'approved' && t.date === new Date().toISOString().split('T')[0])
                .reduce((acc, t) => acc + t.amount, 0)
            )}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Actions and Transactions */}
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:flex md:flex-wrap gap-3">
            <Button 
              className="w-full md:w-auto font-bold text-xs gap-2 px-6 py-2.5 shadow-md active:scale-95 transition-all"
              onClick={() => {
                setEditingId(null);
                setFormData(prev => ({ ...prev, type: 'setoran', memberId: '', nominal: '', note: '' }));
                setIsInputModalOpen(true);
              }}
            >
              <PlusCircle size={16} /> Uang Masuk
            </Button>
            <Button 
              className="w-full md:w-auto font-bold text-xs gap-2 px-6 py-2.5 shadow-md active:scale-95 transition-all"
              onClick={() => {
                setEditingId(null);
                setFormData(prev => ({ ...prev, type: 'penarikan', memberId: '', nominal: '', note: '' }));
                setIsInputModalOpen(true);
              }}
            >
              <MinusCircle size={16} /> Uang Keluar
            </Button>
          </div>

          {/* Recent Transactions Table / Card List */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Riwayat Transaksi</h3>
            <button 
              onClick={() => setIsAllTransactionsModalOpen(true)}
              className="text-[10px] font-bold text-red-600 hover:underline uppercase"
            >
              Lihat Semua
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-xs border-b border-gray-100">
                  <th className="px-4 py-2.5 font-bold">Nama</th>
                  <th className="px-4 py-2.5 font-bold">Tanggal</th>
                  <th className="px-4 py-2.5 font-bold text-right">Nominal</th>
                  <th className="px-4 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {transactions.length > 0 ? transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedMemberId(tx.member_id)}
                        className="font-bold text-gray-800 text-sm hover:text-red-700 hover:underline text-left"
                      >
                        {tx.member?.name || 'Unknown'}
                      </button>
                      <div className={clsx("text-[10px] font-bold uppercase mt-0.5", tx.type === 'setoran' ? "text-green-600" : "text-red-600")}>
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Calendar size={12} className="text-red-700" />
                        <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </td>
                    <td className={clsx("px-4 py-3 font-bold text-right text-sm", tx.type === 'setoran' ? "text-gray-900" : "text-red-600")}>
                      {tx.type === 'penarikan' ? '-' : ''}{formatCurrency(tx.amount).replace('Rp', '').trim()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(tx)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Transaksi"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs italic">Belum ada transaksi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-gray-100">
            {transactions.length > 0 ? transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <button 
                      onClick={() => setSelectedMemberId(tx.member_id)}
                      className="text-[13px] font-bold text-gray-900 leading-tight text-left"
                    >
                      {tx.member?.name || 'Unknown'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{tx.date}</p>
                  </div>
                  <span className={clsx(
                    "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border",
                    tx.type === 'setoran' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {tx.type}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                  <p className="text-sm font-black text-gray-900">
                    {tx.type === 'penarikan' ? '-' : ''}{formatCurrency(tx.amount)}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(tx)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(tx)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-gray-400 text-xs italic">Belum ada transaksi</div>
            )}
          </div>
        </div>
      </div>

        {/* Member Balances Table / Card List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tabungan Anggota</h3>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedDivision('Semua');
                setIsAllMembersModalOpen(true);
              }}
              className="text-[10px] font-bold text-red-600 hover:underline uppercase"
            >
              Lihat Semua
            </button>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100 font-bold bg-white">
                  <th className="px-4 py-2.5">Nama</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Total Saldo</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {members.filter(m => (m.totalBalance || 0) > 0)
                  .sort((a, b) => (b.totalBalance || 0) - (a.totalBalance || 0))
                  .slice(0, 10).map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedMemberId(member.id)}
                        className="font-semibold text-gray-800 text-[13px] hover:text-red-700 hover:underline text-left"
                      >
                        {member.name}
                      </button>
                      <p className="text-[10px] text-gray-400 uppercase">{member.divisi}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-sm font-bold border border-blue-100 text-[10px] uppercase">Aktif</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-right text-[13px]">
                      {formatCurrency(member.totalBalance || 0).replace('Rp', '').trim()}
                    </td>
                  </tr>
                ))}
                {members.filter(m => (m.totalBalance || 0) > 0).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs italic">Belum ada saldo anggota</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
            {members.filter(m => (m.totalBalance || 0) > 0)
              .sort((a, b) => (b.totalBalance || 0) - (a.totalBalance || 0))
              .slice(0, 10).map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">{member.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{member.divisi}</p>
                </div>
                <p className="text-sm font-black text-gray-900">
                  {formatCurrency(member.totalBalance || 0)}
                </p>
              </button>
            ))}
            {members.filter(m => (m.totalBalance || 0) > 0).length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-xs italic">Belum ada saldo anggota</div>
            )}
          </div>
        </div>
      </div>

      {/* Input Manual Modal */}
      <Modal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        title={editingId ? "Edit Transaksi" : (formData.type === 'setoran' ? "Input Uang Masuk" : "Input Penarikan Dana")}
        maxWidth="lg"
      >
        <form onSubmit={handleInputSubmit} className="space-y-4">


          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Pilih Anggota</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari nama..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-2 py-1.5 border border-gray-200 rounded-md text-xs font-bold outline-none bg-gray-50"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  {divisions.map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-50 bg-gray-50/30">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, memberId: member.id })}
                      className={clsx(
                        "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white transition-colors",
                        formData.memberId === member.id ? "bg-white ring-1 ring-inset ring-blue-500/30" : ""
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-400">{member.divisi}</p>
                          <p className="text-[10px] font-bold text-blue-600">Saldo: {formatCurrency(member.totalBalance || 0)}</p>
                        </div>
                      </div>
                      {formData.memberId === member.id && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-400">Anggota tidak ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Jumlah Nominal (Rp)</label>
            <input
              type="number"
              required
              placeholder="Contoh: 50000"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Keterangan (Opsional)</label>
            <textarea
              placeholder="Catatan transaksi..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 font-bold text-xs" 
              isLoading={isSubmitting}
              disabled={!formData.memberId || !formData.nominal}
            >
              Simpan {editingId ? 'Perubahan' : 'Transaksi'}
            </Button>
            <Button type="button" variant="outline" className="px-6 font-bold text-xs" onClick={() => setIsInputModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      {/* All Members Savings Modal */}
      <Modal
        isOpen={isAllMembersModalOpen}
        onClose={() => setIsAllMembersModalOpen(false)}
        title="Daftar Tabungan Anggota"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="flex-1 px-2 py-2 border border-gray-200 rounded-md text-xs font-bold outline-none bg-gray-50 min-w-[100px]"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              {divisions.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
            <Button 
              onClick={downloadMemberSavingsPDF}
              size="sm" 
              className="w-full md:w-auto font-bold text-xs gap-2 shrink-0"
            >
              <FileText size={14} /> Download PDF
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-50 bg-white">
            {filteredMembers.length > 0 ? (
              filteredMembers.sort((a,b) => (b.totalBalance || 0) - (a.totalBalance || 0)).map(member => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-red-700">{member.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{member.divisi}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{formatCurrency(member.totalBalance || 0)}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Lihat Riwayat</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-400">Anggota tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Member Transaction History Modal */}
      <Modal
        isOpen={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title={`Riwayat Tabungan: ${selectedMember?.name || ''}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Saldo Saat Ini</p>
              <h3 className="text-xl font-black text-gray-900">{formatCurrency(selectedMember?.totalBalance || 0)}</h3>
            </div>
            <div className="p-2 bg-white rounded-full shadow-sm text-red-700">
              <Wallet size={20} />
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest px-1">5 Transaksi Terakhir</h4>
            <div className="space-y-2">
              {selectedMemberId && getMemberHistory(selectedMemberId).length > 0 ? (
                getMemberHistory(selectedMemberId).map(tx => (
                  <div key={tx.id} className="p-3 bg-white border border-gray-100 rounded-md flex justify-between items-center shadow-sm">
                    <div>
                      <p className={clsx("text-[10px] font-bold uppercase", tx.type === 'setoran' ? "text-green-600" : "text-red-700")}>
                        {tx.type}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={clsx("text-sm font-bold", tx.type === 'setoran' ? "text-gray-900" : "text-red-700")}>
                        {tx.type === 'penarikan' ? '-' : '+'}{formatCurrency(tx.amount).replace('Rp', '').trim()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs italic">
                  Belum ada riwayat transaksi
                </div>
              )}
            </div>
          </div>

          <Button 
            className="w-full mt-4 text-xs font-bold" 
            variant="outline" 
            onClick={() => setSelectedMemberId(null)}
          >
            Tutup
          </Button>
        </div>
      </Modal>


      {/* All Transactions Modal */}
      <Modal
        isOpen={isAllTransactionsModalOpen}
        onClose={() => setIsAllTransactionsModalOpen(false)}
        title="Seluruh Riwayat Transaksi"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-end bg-gray-50 p-3 rounded-md border border-gray-100">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dari Tanggal</label>
              <input 
                type="date" 
                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sampai Tanggal</label>
              <input 
                type="date" 
                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={downloadHistoryPDF}
              size="sm" 
              className="w-full md:w-auto font-bold text-xs gap-2"
            >
              <FileText size={14} /> Download PDF
            </Button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 font-bold bg-white">
                  <th className="px-4 py-2.5 font-bold">Nama</th>
                  <th className="px-4 py-2.5 font-bold">Waktu</th>
                  <th className="px-4 py-2.5 font-bold">Jenis</th>
                  <th className="px-4 py-2.5 text-right font-bold">Nominal</th>
                  <th className="px-4 py-2.5 text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-800 text-sm">{tx.member?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {tx.date} <span className="text-gray-300 ml-1">{tx.created_at ? new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("text-xs font-bold uppercase px-1.5 py-0.5 rounded-sm border",
                        tx.type === 'setoran' ? "text-green-600 border-green-100 bg-green-50/30" : "text-red-600 border-red-100 bg-red-50/30"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={clsx("px-4 py-3 font-bold text-right text-sm", tx.type === 'setoran' ? "text-gray-900" : "text-red-600")}>
                      {tx.type === 'penarikan' ? '-' : ''}{formatCurrency(tx.amount).replace('Rp', '').trim()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Transaksi"
                        >
                          <Pencil size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-xs italic">Tidak ada transaksi dalam rentang waktu ini</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.memberName}" sebesar ${formatCurrency(deleteConfirm.amount)}?`}
      />
    </div>
  );
};
