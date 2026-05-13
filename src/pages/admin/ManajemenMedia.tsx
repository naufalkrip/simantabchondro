import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { MediaFinanceSection } from '../../components/media/MediaFinanceSection';
import { MediaInventorySection } from '../../components/media/MediaInventorySection';
import { MediaAccountsSection } from '../../components/media/MediaAccountsSection';
import { exportFinancePDF, exportMediaInventoryPDF, exportMediaAccountsPDF } from '../../utils/pdfExport';
import { Download, FileText, Package, Fingerprint, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const OPTIONS = [
  {
    key: 'finance',
    label: 'Rekap Dana',
    icon: FileText,
    desc: 'Download laporan keuangan divisi media',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hoverBg: 'hover:border-blue-200',
  },
  {
    key: 'inventory',
    label: 'Inventaris',
    icon: Package,
    desc: 'Download daftar inventaris perlengkapan media',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    hoverBg: 'hover:border-emerald-200',
  },
  {
    key: 'accounts',
    label: 'Akun',
    icon: Fingerprint,
    desc: 'Download daftar akun media sosial',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    hoverBg: 'hover:border-purple-200',
  },
] as const;

export const ManajemenMedia: React.FC = () => {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [selectedFinance, setSelectedFinance] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllHistory, setIsAllHistory] = useState(true);

  const resetFinanceState = () => {
    setSelectedFinance(false);
    setStartDate('');
    setEndDate('');
    setIsAllHistory(true);
  };

  const handleExportFinance = async () => {
    setPdfLoading('finance');
    try {
      await exportFinancePDF(
        'media',
        'Rekap Dana Media',
        'rekap-dana-media',
        isAllHistory ? undefined : startDate || undefined,
        isAllHistory ? undefined : endDate || undefined
      );
      toast.success('PDF berhasil didownload');
      setIsPdfModalOpen(false);
      resetFinanceState();
    } catch {
      toast.error('Gagal mendownload PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  const handleExportDirect = async (key: string, action: () => Promise<void>) => {
    setPdfLoading(key);
    try {
      await action();
      toast.success('PDF berhasil didownload');
      setIsPdfModalOpen(false);
    } catch {
      toast.error('Gagal mendownload PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <div className="space-y-4 pb-10 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 leading-tight">Manajemen Media</h2>
          <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Pusat kendali operasional divisi media MB Chondro.</p>
        </div>
        <button
          onClick={() => setIsPdfModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <section>
        <MediaFinanceSection />
      </section>

      <section>
        <MediaInventorySection />
      </section>

      <section>
        <MediaAccountsSection />
      </section>

      <Modal isOpen={isPdfModalOpen} onClose={() => { setIsPdfModalOpen(false); resetFinanceState(); }} title={selectedFinance ? 'Rekap Dana - Filter Tanggal' : 'Download Laporan PDF'} maxWidth="md">
        {selectedFinance ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button onClick={() => { resetFinanceState(); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <ArrowLeft size={16} />
              </button>
              <span>Atur rentang tanggal atau download seluruh riwayat</span>
            </div>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={isAllHistory}
                onChange={e => { setIsAllHistory(e.target.checked); if (!e.target.checked) { setStartDate(''); setEndDate(''); } }}
                className="w-4 h-4 text-red-600 rounded"
              />
              <div>
                <p className="text-sm font-bold text-gray-800">Seluruh Riwayat Transaksi</p>
                <p className="text-xs text-gray-500">Download semua data tanpa batas tanggal</p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  disabled={isAllHistory}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  disabled={isAllHistory}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>

            <button
              onClick={handleExportFinance}
              disabled={pdfLoading !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {pdfLoading === 'finance' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {pdfLoading === 'finance' ? 'Mendownload...' : 'Download PDF'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-3">Pilih jenis laporan yang akan didownload:</p>
            {OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isLoading = pdfLoading === opt.key;
              return (
                <button
                  key={opt.key}
                  disabled={pdfLoading !== null}
                  onClick={() => {
                    if (opt.key === 'finance') {
                      setSelectedFinance(true);
                    } else {
                      const action = opt.key === 'inventory' ? exportMediaInventoryPDF : exportMediaAccountsPDF;
                      handleExportDirect(opt.key, action);
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white ${opt.hoverBg} transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]`}
                >
                  <div className={`p-3 rounded-xl ${opt.bg} ${opt.color}`}>
                    {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      {opt.label}
                      {isLoading && <span className="text-xs font-normal text-gray-400">Mendownload...</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};
