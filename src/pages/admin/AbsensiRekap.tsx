import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getMembers } from '../../services/memberService';
import { getAttendanceByDateRange } from '../../services/attendanceService';
import type { Member } from '../../types/member';
import { Calendar as CalendarIcon, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AbsensiRekap: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const loadInitialData = async () => {
    const fetchedMembers = await getMembers();
    setMembers(fetchedMembers);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleFetchSummary = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Pilih rentang tanggal terlebih dahulu.');
      return;
    }
    setIsLoading(true);
    const data = await getAttendanceByDateRange(dateRange.start, dateRange.end);
    setSummaryData(data);
    setIsLoading(false);
  };

  const handleDownloadReport = async (type: 'daftar' | 'rekap') => {
    const { start, end } = dateRange;
    if (!start || !end) return;

    const data = summaryData.length > 0 ? summaryData : await getAttendanceByDateRange(start, end);
    if (data.length === 0) {
      alert('Tidak ada data absensi pada rentang waktu tersebut.');
      return;
    }

    try {
      const doc = new jsPDF(type === 'daftar' ? 'l' : 'p');
      const title = type === 'daftar' ? 'Laporan Daftar Absensi' : 'Laporan Rekap Absensi';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SIMANTAB', 14, 15);
      doc.setFontSize(14);
      doc.text(title, 14, 22);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${start} s/d ${end}`, 14, 30);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 35);

      if (type === 'daftar') {
        const uniqueDates = Array.from(new Set(data.map(d => d.date))).sort();
        const tableColumn = ["Nama", "Divisi", ...uniqueDates];
        const tableRows = members.map(m => {
          const row = [m.name, m.divisi];
          uniqueDates.forEach(date => {
            const record = data.find(r => r.member_id === m.id && r.date === date);
            row.push(record ? record.status.toUpperCase() : '-');
          });
          return row;
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 45,
          styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
          headStyles: { fillColor: [185, 28, 28], fontStyle: 'bold' },
          columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } }
        });
      } else {
        const tableColumn = ["No", "Nama", "Divisi", "Hadir", "Izin", "Bolos"];
        const tableRows = members.map((m, i) => {
          const memberRecords = data.filter(r => r.member_id === m.id);
          const hadir = memberRecords.filter(r => r.status === 'hadir').length;
          const izin = memberRecords.filter(r => r.status === 'izin').length;
          const bolos = memberRecords.filter(r => r.status === 'bolos').length;
          return [i + 1, m.name, m.divisi, hadir, izin, bolos];
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 45,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [185, 28, 28], halign: 'center' },
          columnStyles: { 0: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } }
        });
      }

      doc.save(`Laporan_Absensi_${type}_${start}_${end}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Gagal membuat PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border-b border-gray-200 rounded-md shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Rekap Absensi</h2>
          <p className="text-xs text-gray-500 mt-0.5">Analisis persentase kehadiran anggota</p>
        </div>
        <Button 
          onClick={() => setIsDownloadModalOpen(true)}
          variant="outline" 
          size="sm" 
          className="gap-2 text-xs font-bold text-red-700 border-red-200"
        >
          <Download size={14} /> Download PDF
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none bg-gray-50 focus:ring-2 focus:ring-red-500/20"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none bg-gray-50 focus:ring-2 focus:ring-red-500/20"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <Button onClick={handleFetchSummary} disabled={isLoading} className="font-bold text-xs py-2.5">
            {isLoading ? 'Memproses...' : 'Tampilkan Data'}
          </Button>
        </div>
      </div>

      {summaryData.length > 0 ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Hadir', status: 'hadir', color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Izin', status: 'izin', color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Bolos', status: 'bolos', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }
            ].map((stat) => {
              const count = summaryData.filter(d => d.status === stat.status).length;
              const percent = Math.round((count / summaryData.length) * 100) || 0;
              return (
                <div key={stat.label} className={clsx("p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden", stat.bg)}>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.text}`}>{percent}%</p>
                    <div className="w-full h-1.5 bg-white/50 rounded-full mt-3 overflow-hidden">
                      <div className={`h-full ${stat.color}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-2 italic">Total: {count} Kali</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Member Table */}
          <Card className="overflow-hidden border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Kehadiran Per Anggota</h3>
              <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase">
                <span className="w-10 text-center">Hadir</span>
                <span className="w-10 text-center">Izin</span>
                <span className="w-10 text-center">Bolos</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {members.map(member => {
                const mRecords = summaryData.filter(d => d.member_id === member.id);
                const h = mRecords.filter(d => d.status === 'hadir').length;
                const i = mRecords.filter(d => d.status === 'izin').length;
                const b = mRecords.filter(d => d.status === 'bolos').length;
                return (
                  <div key={member.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{member.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{member.divisi}</p>
                    </div>
                    <div className="flex gap-4 font-black">
                      <div className="w-10 text-center text-xs text-green-600 bg-green-50 py-1.5 rounded-lg border border-green-100/30">{h}</div>
                      <div className="w-10 text-center text-xs text-yellow-600 bg-yellow-50 py-1.5 rounded-lg border border-yellow-100/30">{i}</div>
                      <div className="w-10 text-center text-xs text-red-600 bg-red-50 py-1.5 rounded-lg border border-red-100/30">{b}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
          <CalendarIcon size={40} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-900 font-bold">Siap Menganalisis?</h3>
          <p className="text-gray-400 text-sm">Pilih rentang tanggal di atas untuk melihat rekapitulasi kehadiran.</p>
        </div>
      )}

      {/* Download Modal */}
      <Modal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title="Pilih Format Laporan"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <button
            onClick={() => handleDownloadReport('daftar')}
            className="w-full p-4 border rounded-xl hover:bg-gray-50 transition-all text-left flex items-center gap-4 group"
          >
            <div className="p-3 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Daftar Absensi Harian</p>
              <p className="text-[10px] text-gray-400">Detail status per tanggal dalam bentuk tabel lebar.</p>
            </div>
          </button>
          
          <button
            onClick={() => handleDownloadReport('rekap')}
            className="w-full p-4 border rounded-xl hover:bg-gray-50 transition-all text-left flex items-center gap-4 group"
          >
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Rekapitulasi Total</p>
              <p className="text-[10px] text-gray-400">Akumulasi jumlah Hadir, Izin, dan Bolos.</p>
            </div>
          </button>

          <Button variant="outline" className="w-full font-bold text-xs" onClick={() => setIsDownloadModalOpen(false)}>
            Tutup
          </Button>
        </div>
      </Modal>
    </div>
  );
};
