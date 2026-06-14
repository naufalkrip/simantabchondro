import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  getAttendanceWithMembers,
  getAttendanceDatesWithCount,
  createFundDistribution,
  getFundDistributions,
  getFundDistributionDetail,
  deleteFundDistribution,
  subscribeToDistributionChanges,
} from '../../services/distributionService';
import type { FundDistribution, FundDistributionRecipient } from '../../types/distribution';
import { toast } from 'sonner';
import {
  Users, Calendar, Download, Save,
  ArrowRight, History, Search, Eye, Trash2, Filter, X,
  AlertCircle
} from 'lucide-react';
import { exportModernPDF } from '../../utils/pdfExport';

interface RecipientInput {
  member_id: string;
  member_name: string;
  status: string;
  paid: boolean;
  amount: number;
}

const ITEMS_PER_PAGE = 10;

export const DistribusiDana: React.FC = () => {
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recipients, setRecipients] = useState<RecipientInput[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<{ date: string; location: string; total_count: number }[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<{ date: string; location: string; count: number } | null>(null);
  const [nominalPerAnggota, setNominalPerAnggota] = useState(0);

  // History state
  const [distributions, setDistributions] = useState<FundDistribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<FundDistribution[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
    distribution: FundDistribution;
    recipients: FundDistributionRecipient[];
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getFundDistributions();
      setDistributions(data);
    } catch (err) {
      console.error('Error fetching distributions:', err);
      toast.error('Gagal memuat riwayat distribusi');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const unsub = subscribeToDistributionChanges(() => fetchHistory());
    return () => { if (unsub) unsub(); };
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    let filtered = distributions.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.date.includes(q)
    );

    if (filterStartDate) {
      filtered = filtered.filter(d => d.date >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(d => d.date <= filterEndDate);
    }

    setFilteredDistributions(filtered);
  }, [searchQuery, filterStartDate, filterEndDate, distributions]);

  const displayDistributions = showAll
    ? filteredDistributions
    : filteredDistributions.slice(0, ITEMS_PER_PAGE);

  const openAttendancePicker = async () => {
    setIsLoadingDates(true);
    setIsPickerOpen(true);
    try {
      const dates = await getAttendanceDatesWithCount();
      setAttendanceDates(dates);
    } catch {
      toast.error('Gagal memuat daftar absensi');
      setIsPickerOpen(false);
    } finally {
      setIsLoadingDates(false);
    }
  };

  const selectAttendanceDate = async (selectedDate: string, location: string) => {
    setDate(selectedDate);
    if (location && !title) {
      setTitle(location);
    }
    setIsPickerOpen(false);
    setRecipients([]);
    setIsDataLoaded(false);

    setIsLoadingAttendance(true);
    try {
      const data = await getAttendanceWithMembers(selectedDate, location);

      if (!data || data.length === 0) {
        toast.error('Tidak ada data absensi untuk sesi tersebut');
        setSelectedDisplay(null);
        return;
      }

      setSelectedDisplay({ date: selectedDate, location, count: data.length });
      setRecipients(data.map(m => ({
        member_id: m.member_id,
        member_name: m.member_name,
        status: m.status,
        paid: false,
        amount: 0
      })));

      setIsDataLoaded(true);
      toast.success(`${data.length} anggota ditemukan`);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      toast.error('Gagal mengambil data absensi');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const lunasCount = recipients.filter(r => r.paid).length;

  const updateNominal = (value: number) => {
    setNominalPerAnggota(value);
    setRecipients(prev => prev.map(r => r.paid ? { ...r, amount: value } : r));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Nama kegiatan harus diisi');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Belum ada penerima dana');
      return;
    }

    setIsSaving(true);
    const promise = createFundDistribution(
      title.trim(),
      date,
      '',
      nominalPerAnggota * recipients.length,
      description.trim(),
      recipients.map(r => ({
        member_id: r.member_id,
        status: r.status,
        amount: r.amount
      }))
    );

    toast.promise(promise, {
      loading: 'Menyimpan distribusi dana...',
      success: () => {
        setIsDataLoaded(false);
        setTitle('');
        setDescription('');
        setRecipients([]);
        setNominalPerAnggota(0);
        return 'Distribusi dana berhasil disimpan';
      },
      error: (err) => `Gagal: ${err.message || 'Terjadi kesalahan sistem'}`
    });

    try {
      await promise;
    } catch {
      // handled by toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!isDataLoaded) return;

    const statusText = (s: string) =>
      s === 'hadir' ? 'Hadir' : s === 'tampil' ? 'Tampil' : s === 'izin' ? 'Izin' : 'Alpha';

    const columns = ['No', 'Nama Anggota', 'Status Kehadiran', 'Nominal Diterima', 'Status Pembayaran'];
    const data = recipients.map((r, i) => [
      String(i + 1).padStart(2, '0'),
      r.member_name,
      statusText(r.status),
      `Rp ${r.amount.toLocaleString('id-ID')}`,
      r.paid ? 'Lunas' : 'Belum Lunas'
    ]);

    const foot = [
      ['', `Total ${recipients.length} Penerima`, '', `Rp ${(nominalPerAnggota * lunasCount).toLocaleString('id-ID')}`, `${lunasCount} Lunas | ${recipients.length - lunasCount} Belum`]
    ];

    const toastId = toast.loading('Membuat PDF...');
    try {
      await exportModernPDF({
        title: `Distribusi Dana - ${title || date}`,
        filename: `distribusi_${title.replace(/\s+/g, '_')}_${date}`,
        subtitle: `Kegiatan: ${title} | Tanggal: ${date} | Nominal/Orang: Rp ${nominalPerAnggota.toLocaleString('id-ID')}`,
        orientation: 'landscape',
        columns,
        data,
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 80, halign: 'center' },
          3: { cellWidth: 90, halign: 'right' },
          4: { cellWidth: 80, halign: 'center' },
        },
        foot,
      });
      toast.success('PDF berhasil diunduh', { id: toastId });
    } catch {
      toast.error('Gagal membuat PDF', { id: toastId });
    }
  };

  const handleViewDetail = async (distribution: FundDistribution) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getFundDistributionDetail(distribution.id);
      if (detail) {
        setSelectedDetail(detail);
      } else {
        toast.error('Gagal memuat detail distribusi');
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
      toast.error('Gagal memuat detail distribusi');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteFundDistribution(id);
      toast.success('Distribusi dana berhasil dihapus');
      setDeleteConfirm(null);
      fetchHistory();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportDetailPDF = async () => {
    if (!selectedDetail) return;

    const { distribution, recipients } = selectedDetail;
    const memberName = (r: FundDistributionRecipient) => r.member_name || 'Data Anggota Tidak Ditemukan';
    const statusKehadiran = (s: string) =>
      s === 'hadir' ? 'Hadir' : s === 'izin' ? 'Izin' : 'Alpha';
    const nominalStr = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
    const statusBayar = (v: number) => v > 0 ? 'Lunas' : 'Belum Lunas';

    const columns = ['No', 'Nama Anggota', 'Status Kehadiran', 'Nominal Diterima', 'Status Pembayaran'];
    const data = recipients.map((r, i) => [
      String(i + 1).padStart(2, '0'),
      memberName(r),
      statusKehadiran(r.attendance_status),
      nominalStr(r.amount),
      statusBayar(r.amount),
    ]);

    const totalDistributed = recipients.reduce((s, r) => s + r.amount, 0);
    const lunasCount = recipients.filter(r => r.amount > 0).length;
    const belumCount = recipients.filter(r => r.amount === 0).length;

    const nominalPerOrang = distribution.member_count
      ? Math.round((distribution.total_amount || 0) / distribution.member_count)
      : 0;

    const foot = [
      [
        '',
        `Total ${distribution.member_count} Penerima`,
        '',
        nominalStr(totalDistributed),
        `${lunasCount} Lunas | ${belumCount} Belum`
      ]
    ];

    const toastId = toast.loading('Membuat PDF...');
    try {
      await exportModernPDF({
        title: `Detail Distribusi Dana - ${distribution.title}`,
        filename: `detail_distribusi_${distribution.title.replace(/\s+/g, '_')}_${distribution.date}`,
        subtitle: `Kegiatan: ${distribution.title} | Tanggal: ${distribution.date} | Nominal/Orang: ${nominalStr(nominalPerOrang)}`,
        orientation: 'landscape',
        columns,
        data,
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 80, halign: 'center' },
          3: { cellWidth: 90, halign: 'right' },
          4: { cellWidth: 80, halign: 'center' },
        },
        foot,
      });
      toast.success('PDF berhasil diunduh', { id: toastId });
    } catch {
      toast.error('Gagal membuat PDF', { id: toastId });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStartDate('');
    setFilterEndDate('');
    setShowAll(false);
  };

  const hasActiveFilters = searchQuery || filterStartDate || filterEndDate;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Distribusi Dana</h2>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
          Buat distribusi dana baru berdasarkan data absensi kegiatan
        </p>
      </div>

      {/* Form Card */}
      <div className="p-4 md:p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nama Kegiatan</label>
            <input
              type="text"
              placeholder="Contoh: Penampilan HUT RI"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Penampilan</label>
            {selectedDisplay ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                  <Calendar size={14} className="text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-green-800">{selectedDisplay.date}</p>
                    <p className="text-[10px] text-green-600">
                      {selectedDisplay.location || 'Tanpa lokasi'} • {selectedDisplay.count} anggota hadir
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAttendancePicker}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-gray-200 rounded-md transition-all shrink-0"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <button
                onClick={openAttendancePicker}
                disabled={isLoadingDates}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50/30 transition-all"
              >
                <Calendar size={14} />
                <span>{isLoadingDates ? 'Memuat...' : 'Pilih Penampilan'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nominal Per Anggota</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">Rp</span>
            <input
              type="number"
              placeholder="0"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30"
              value={nominalPerAnggota || ''}
              onChange={(e) => updateNominal(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Keterangan</label>
          <textarea
            placeholder="Tambahkan keterangan jika diperlukan"
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30 resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>


      </div>

      {/* Recipients Section */}
      {isDataLoaded && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Jumlah Penerima', value: `${recipients.length} orang`, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Lunas', value: `${lunasCount} orang`, icon: ArrowRight, color: 'text-green-600 bg-green-50' },
              { label: 'Belum Lunas', value: `${recipients.length - lunasCount} orang`, icon: AlertCircle, color: lunasCount < recipients.length ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50' },
              { label: 'Total Terdistribusi', value: `Rp ${(nominalPerAnggota * lunasCount).toLocaleString('id-ID')}`, icon: ArrowRight, color: 'text-emerald-600 bg-emerald-50' },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                    <card.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recipients Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase border-b border-gray-100 font-black tracking-widest">
                    <th className="px-4 py-3 font-bold w-12">No</th>
                    <th className="px-4 py-3 font-bold">Nama Anggota</th>
                    <th className="px-4 py-3 font-bold">Status Absensi</th>
                    <th className="px-4 py-3 font-bold text-right">Nominal</th>
                    <th className="px-4 py-3 font-bold text-right">Pembayaran</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {recipients.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{r.member_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.status === 'hadir' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        Rp {r.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={r.paid ? 'lunas' : 'belum'}
                          onChange={(e) => {
                            const newPaid = e.target.value === 'lunas';
                            setRecipients(prev => prev.map((rec, idx) =>
                              idx === i ? { ...rec, paid: newPaid, amount: newPaid ? nominalPerAnggota : 0 } : rec
                            ));
                          }}
                          className={`px-4 py-2.5 rounded-lg text-sm font-bold border outline-none cursor-pointer transition-all ${
                            r.paid
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          <option value="belum" className="text-gray-500">Belum Lunas</option>
                          <option value="lunas" className="text-green-700">Lunas</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {recipients.map((r, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">#{i + 1}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      r.status === 'hadir' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{r.member_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Nominal:</span>
                    <span className="text-sm font-semibold text-gray-800">Rp {r.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Pembayaran:</span>
                    <select
                      value={r.paid ? 'lunas' : 'belum'}
                      onChange={(e) => {
                        const newPaid = e.target.value === 'lunas';
                        setRecipients(prev => prev.map((rec, idx) =>
                          idx === i ? { ...rec, paid: newPaid, amount: newPaid ? nominalPerAnggota : 0 } : rec
                        ));
                      }}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border outline-none cursor-pointer transition-all ${
                        r.paid
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      <option value="belum" className="text-gray-500">Belum Lunas</option>
                      <option value="lunas" className="text-green-700">Lunas</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="h-[38px] text-xs font-bold rounded-md"
            >
              <Download size={14} className="mr-1.5" />
              Cetak PDF
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              variant="primary"
              className="h-[38px] text-xs font-bold rounded-md"
            >
              <Save size={14} className="mr-1.5" />
              Simpan Distribusi Dana
            </Button>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 pt-2">
        <div className="flex items-center gap-2 text-gray-300">
          <div className="flex-1 h-px bg-gray-100" />
          <History size={14} />
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      </div>

      {/* Riwayat Section */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-gray-800">Riwayat Distribusi Dana</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {showAll
            ? `Menampilkan semua (${filteredDistributions.length} transaksi)`
            : `Menampilkan ${displayDistributions.length} dari ${filteredDistributions.length} transaksi terakhir`
          }
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama kegiatan, sumber, atau tanggal..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all bg-gray-50/30"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              placeholder="Dari"
              title="Filter dari tanggal"
            />
            <span className="text-gray-400 text-xs">—</span>
            <input
              type="date"
              className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all bg-gray-50/30"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              placeholder="Sampai"
              title="Filter sampai tanggal"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                title="Hapus filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoadingHistory && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-1/4 mx-auto" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoadingHistory && filteredDistributions.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <History size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">
            {hasActiveFilters ? 'Tidak ditemukan hasil pencarian' : 'Belum ada riwayat distribusi'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {hasActiveFilters ? 'Coba ubah kata kunci atau rentang tanggal' : 'Buat distribusi dana baru terlebih dahulu'}
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoadingHistory && displayDistributions.length > 0 && (
        <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase border-b border-gray-100 font-black tracking-widest">
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Nama Kegiatan</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                  <th className="px-4 py-3 font-bold text-right">Penerima</th>
                  <th className="px-4 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {displayDistributions.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono">{d.date}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{d.title}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      Rp {d.total_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                        {d.member_count || '-'} org
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetail(d)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-all"
                          title="Lihat Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(d.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoadingHistory && displayDistributions.length > 0 && (
        <div className="md:hidden space-y-3">
          {displayDistributions.map((d) => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 truncate">{d.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <Calendar size={11} />
                      <span>{d.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleViewDetail(d)}
                      className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(d.id)}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">Rp {d.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Penerima</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">
                    {d.member_count || '-'} org
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Toggle */}
      {!isLoadingHistory && filteredDistributions.length > ITEMS_PER_PAGE && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            {showAll
              ? 'Tampilkan 10 Terakhir'
              : `Tampilkan Semua (${filteredDistributions.length} transaksi)`
            }
          </button>
        </div>
      )}

      {/* Attendance Picker Modal */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Pilih Penampilan"
      >
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-3">Pilih tanggal penampilan untuk melihat daftar anggota yang hadir</p>
          {isLoadingDates ? (
            <div className="text-center py-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : attendanceDates.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-gray-500">Belum ada data absensi</p>
              <p className="text-xs text-gray-400 mt-1">Input absensi terlebih dahulu</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1">
              {attendanceDates.map((item) => (
                <button
                  key={`${item.date}|${item.location}`}
                  onClick={() => selectAttendanceDate(item.date, item.location)}
                  disabled={isLoadingAttendance}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={15} className="text-gray-400" />
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{item.date}</span>
                      {item.location && <p className="text-[10px] text-gray-400">{item.location}</p>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                    {item.total_count} org
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => {
          if (!isDeleting) setDeleteConfirm(null);
        }}
        title="Konfirmasi Hapus"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Hapus Distribusi Dana</p>
              <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setDeleteConfirm(null)}
              variant="outline"
              className="h-[34px] text-xs rounded-md"
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              isLoading={isDeleting}
              variant="danger"
              className="h-[34px] text-xs rounded-md"
            >
              <Trash2 size={13} className="mr-1" />
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedDetail}
        onClose={() => {
          if (!isLoadingDetail) setSelectedDetail(null);
        }}
        title="Detail Distribusi Dana"
        maxWidth="4xl"
      >
        {selectedDetail && (
          <div className="space-y-5">
            {/* Kegiatan Info */}
            <div className="bg-gradient-to-r from-red-50 to-red-50/30 rounded-xl p-4 border border-red-100">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="col-span-2 md:col-span-2">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Nama Kegiatan</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{selectedDetail.distribution.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Tanggal</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{selectedDetail.distribution.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Nominal/Orang</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">
                    Rp {selectedDetail.distribution.total_amount && selectedDetail.distribution.member_count
                      ? (selectedDetail.distribution.total_amount / selectedDetail.distribution.member_count).toLocaleString('id-ID')
                      : 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Jumlah Penerima</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{selectedDetail.distribution.member_count} orang</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-xl p-4 border border-blue-100">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Total Dana</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  Rp {(selectedDetail.distribution.total_amount || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-50/30 rounded-xl p-4 border border-indigo-100">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Jumlah Penerima</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {selectedDetail.recipients.length}
                  <span className="text-gray-400 font-medium text-[11px]"> orang</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/30 rounded-xl p-4 border border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Sudah Dibayar</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">
                  {selectedDetail.recipients.filter(r => r.amount > 0).length}
                  <span className="text-emerald-400 font-medium text-[11px]"> org</span>
                </p>
                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                  Rp {selectedDetail.distribution.distributed_amount?.toLocaleString('id-ID') || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-50/30 rounded-xl p-4 border border-orange-100">
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Belum Dibayar</p>
                <p className="text-sm font-bold text-orange-700 mt-1">
                  {selectedDetail.recipients.filter(r => r.amount === 0).length}
                  <span className="text-orange-400 font-medium text-[11px]"> org</span>
                </p>
                <p className="text-[10px] font-semibold text-orange-600 mt-0.5">
                  Rp {selectedDetail.distribution.remaining_amount?.toLocaleString('id-ID') || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-violet-50/30 rounded-xl p-4 border border-violet-100">
                <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">Sisa Dana</p>
                <p className="text-sm font-bold text-violet-700 mt-1">
                  Rp {(
                    (selectedDetail.distribution.total_amount || 0) -
                    (selectedDetail.distribution.distributed_amount || 0)
                  ).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {selectedDetail.distribution.description && (
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Keterangan</p>
                <p className="text-sm text-gray-700 mt-1">{selectedDetail.distribution.description}</p>
              </div>
            )}

            {/* Recipients Table */}
            {isLoadingDetail ? (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-red-700 to-red-800">
                        <th className="px-4 py-3.5 font-bold text-white text-[11px] uppercase tracking-wider w-[5%] text-center">No</th>
                        <th className="px-4 py-3.5 font-bold text-white text-[11px] uppercase tracking-wider w-[40%]">Nama Anggota</th>
                        <th className="px-4 py-3.5 font-bold text-white text-[11px] uppercase tracking-wider w-[15%] text-center">Status Kehadiran</th>
                        <th className="px-4 py-3.5 font-bold text-white text-[11px] uppercase tracking-wider w-[20%] text-right">Nominal Diterima</th>
                        <th className="px-4 py-3.5 font-bold text-white text-[11px] uppercase tracking-wider w-[20%] text-center">Status Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.recipients.map((r, i) => (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          } hover:bg-red-50/30`}
                        >
                          <td className="px-4 py-3 text-gray-400 font-mono text-sm text-center align-middle">
                            {String(i + 1).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-200 text-red-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                                {r.member_name ? r.member_name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm">
                                  {r.member_name || 'Data Anggota Tidak Ditemukan'}
                                </p>
                                {r.divisi && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">{r.divisi}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold leading-none ${
                              r.attendance_status === 'hadir' ? 'bg-green-50 text-green-700 border border-green-200' :
                              r.attendance_status === 'izin' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {r.attendance_status === 'hadir' ? 'Hadir' :
                               r.attendance_status === 'izin' ? 'Izin' :
                               r.attendance_status === 'bolos' ? 'Alpha' :
                               r.attendance_status || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <span className="font-semibold text-gray-800 text-sm tabular-nums">
                              Rp {r.amount.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold leading-none ${
                              r.amount > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {r.amount > 0 ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200">
                        <td colSpan={2} className="px-4 py-3.5 text-gray-700 font-bold text-sm">Total Terdistribusi</td>
                        <td className="px-4 py-3.5 text-center text-gray-500 text-sm font-semibold">
                          {selectedDetail.distribution.member_count} penerima
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-800 font-bold text-sm tabular-nums">
                          Rp {selectedDetail.recipients.reduce((s, r) => s + r.amount, 0).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-emerald-600 font-bold text-[11px]">
                            {selectedDetail.recipients.filter(r => r.amount > 0).length} Lunas
                          </span>
                          <span className="text-gray-300 mx-1">|</span>
                          <span className="text-red-500 font-bold text-[11px]">
                            {selectedDetail.recipients.filter(r => r.amount === 0).length} Belum
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleExportDetailPDF}
                variant="outline"
                className="h-[36px] text-xs font-bold rounded-lg px-4"
              >
                <Download size={14} className="mr-1.5" />
                Cetak PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
