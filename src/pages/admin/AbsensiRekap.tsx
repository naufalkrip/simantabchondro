import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getMembers } from '../../services/memberService';
import { getAttendanceByDateRange } from '../../services/attendanceService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { Member } from '../../types/member';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '../../assets/logo.png';

export const AbsensiRekap: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const loadInitialData = async () => {
    const fetchedMembers = await getMembers();
    setMembers(fetchedMembers);
  };

  useEffect(() => {
    loadInitialData();
    const unsubscribe = subscribeToDataChange(() => {
      loadInitialData();
      handleFetchSummary(true);
    });
    return () => unsubscribe();
  }, [filterMonth, filterYear]);

  const getDateRangeFromMonth = () => {
    const start = `${filterYear}-${filterMonth}-01`;
    const lastDay = new Date(Number(filterYear), Number(filterMonth), 0).getDate();
    const end = `${filterYear}-${filterMonth}-${lastDay.toString().padStart(2, '0')}`;
    return { start, end };
  };

  const handleFetchSummary = async (silent: boolean = false) => {
    const { start, end } = getDateRangeFromMonth();
    if (!silent) setIsLoading(true);
    try {
      const data = await getAttendanceByDateRange(start, end);
      setSummaryData(data);
      if (!silent) {
        if (data.length === 0) {
          toast.info('Tidak ada data absensi pada bulan tersebut.');
        } else {
          toast.success(`Ditemukan ${data.length} rekaman absensi.`);
        }
      }
    } catch (err) {
      if (!silent) toast.error('Gagal mengambil data.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    const { start, end } = getDateRangeFromMonth();
    setIsDownloading(true);
    const toastId = toast.loading('Menyiapkan laporan PDF...');

    try {
      const data = summaryData.length > 0 ? summaryData : await getAttendanceByDateRange(start, end);
      if (data.length === 0) {
        toast.error('Tidak ada data absensi untuk dicetak.', { id: toastId });
        setIsDownloading(false);
        return;
      }

      const sortedMembers = members
        .map(m => {
          const mRecords = data.filter(r => r.member_id === m.id);
          const hadir = mRecords.filter(r => r.status === 'hadir').length;
          const izin = mRecords.filter(r => r.status === 'izin').length;
          const bolos = mRecords.filter(r => r.status === 'bolos').length;
          return { ...m, hadir, izin, bolos };
        })
        .sort((a, b) => {
          if (a.divisi < b.divisi) return -1;
          if (a.divisi > b.divisi) return 1;
          return b.hadir - a.hadir;
        });

      const monthLabel = months.find(m => m.value === filterMonth)?.label || filterMonth;
      const periodLabel = `Periode: ${monthLabel} ${filterYear}`;
      const filename = `Laporan_Absensi_${filterYear}_${filterMonth}`;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      const margin = { top: 24, bottom: 24, left: 28, right: 28 };

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = logoUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const logoHeight = 28;
      const logoWidth = logoHeight * (img.naturalWidth / img.naturalHeight);
      doc.addImage(img, 'PNG', margin.left, margin.top, logoWidth, logoHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(139, 0, 0);
      doc.text("SIMANTAB", margin.left + logoWidth + 10, margin.top + 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Sistem Manajemen Informasi Anggota MB Chondro", margin.left + logoWidth + 10, margin.top + 24);

      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const dateText = `Tanggal dibuat: ${today}`;
      doc.text(dateText, pageWidth - margin.right - doc.getTextWidth(dateText), margin.top + 12);

      const lineY = margin.top + logoHeight + 12;
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(1);
      doc.line(margin.left, lineY, pageWidth - margin.right, lineY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text('LAPORAN ABSENSI', margin.left, lineY + 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(periodLabel, margin.left, lineY + 32);

      const uniqueDates = Array.from(new Set(data.map(d => d.date))).sort();
      const dateToLocationMap: Record<string, string> = {};
      uniqueDates.forEach(date => {
        const record = data.find(r => r.date === date);
        dateToLocationMap[date] = record?.location || '';
      });

      const dailyColumns = ["Nama", "Divisi", ...uniqueDates.map(d => dateToLocationMap[d] || d.slice(5))];
      const dailyData = sortedMembers.map(m => {
        const row = [m.name, m.divisi];
        uniqueDates.forEach(date => {
          const record = data.find(r => r.member_id === m.id && r.date === date);
          row.push(record ? record.status.toUpperCase().charAt(0) : '-');
        });
        return row;
      });

      const drawFooter = (hookData: any) => {
        const str = 'SIMANTAB | Sistem Manajemen Informasi Anggota MB Chondro';
        const pageStr = `Halaman ${hookData.pageNumber}`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const footerY = pageHeight - margin.bottom;
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.5);
        doc.line(margin.left, footerY - 10, pageWidth - margin.right, footerY - 10);
        doc.text(str, margin.left, footerY);
        doc.text(pageStr, pageWidth - margin.right - doc.getTextWidth(pageStr), footerY);
      };

      autoTable(doc, {
        startY: lineY + 42,
        head: [dailyColumns],
        body: dailyData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 7, cellPadding: 3, lineColor: [240, 240, 240], lineWidth: 0.5, textColor: [60, 60, 60] },
        headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 6 },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: margin.left, right: margin.right, bottom: margin.bottom + 20 },
        columnStyles: { 0: { halign: 'left', cellWidth: 40 }, 1: { halign: 'left', cellWidth: 30 } },
        didDrawPage: drawFooter
      });

      const table1End = (doc as any).lastAutoTable.finalY;
      const remainingSpace = pageHeight - margin.bottom - table1End;
      if (remainingSpace < 80) doc.addPage();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(139, 0, 0);
      doc.text('REKAPITULASI TOTAL', margin.left, (remainingSpace < 80 ? margin.top : table1End + 24));

      const recapColumns = ["No", "Nama", "Divisi", "Hadir", "Izin", "Bolos"];
      const recapData = sortedMembers.map((m, i) => [i + 1, m.name, m.divisi, m.hadir, m.izin, m.bolos]);

      autoTable(doc, {
        startY: (remainingSpace < 80 ? margin.top : table1End + 24) + 12,
        head: [recapColumns],
        body: recapData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, lineColor: [240, 240, 240], lineWidth: 0.5, textColor: [60, 60, 60] },
        headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: margin.left, right: margin.right, bottom: margin.bottom + 20 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'left', cellWidth: 60 },
          3: { halign: 'center', cellWidth: 40 },
          4: { halign: 'center', cellWidth: 40 },
          5: { halign: 'center', cellWidth: 40 }
        },
        didDrawPage: drawFooter
      });

      doc.save(`${filename}.pdf`);
      toast.success('Laporan berhasil diunduh', { id: toastId });
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Gagal membuat PDF.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-md shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Rekap Absensi</h2>
          <p className="text-xs text-gray-500 mt-0.5">Analisis persentase kehadiran anggota</p>
        </div>
        <Button 
          onClick={handleDownloadReport}
          isLoading={isDownloading}
          variant="outline" 
          size="sm" 
          className="gap-2 text-xs font-bold text-red-700 border-red-200"
        >
          <Download size={14} /> Download PDF
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bulan</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none bg-gray-50 focus:ring-2 focus:ring-red-500/20 cursor-pointer"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tahun</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none bg-gray-50 focus:ring-2 focus:ring-red-500/20 cursor-pointer"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={() => handleFetchSummary(false)} isLoading={isLoading} className="font-bold text-xs py-2.5 flex-1">
              Tampilkan Data
            </Button>
          </div>
        </div>
      </div>

      {summaryData.length > 0 ? (
        <div className="space-y-4">
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
                <div key={stat.label} className={clsx("p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden", stat.bg)}>
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
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Kehadiran Per Anggota</h3>
              <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase">
                <span className="w-10 text-center">Hadir</span>
                <span className="w-10 text-center">Izin</span>
                <span className="w-10 text-center">Bolos</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {members
                .map(member => {
                  const mRecords = summaryData.filter(d => d.member_id === member.id);
                  const h = mRecords.filter(d => d.status === 'hadir').length;
                  const i = mRecords.filter(d => d.status === 'izin').length;
                  const b = mRecords.filter(d => d.status === 'bolos').length;
                  return { ...member, h, i, b };
                })
                .sort((a, b) => {
                  if (a.divisi < b.divisi) return -1;
                  if (a.divisi > b.divisi) return 1;
                  return b.h - a.h;
                }) // Sort by Division then by highest 'Hadir' count
                .map((member, index) => (
                  <div key={member.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-gray-300 w-4">{index + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{member.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{member.divisi}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 font-black">
                      <div className="w-10 text-center text-xs text-green-600 bg-green-50 py-1.5 rounded-lg border border-green-100/30">{member.h}</div>
                      <div className="w-10 text-center text-xs text-yellow-600 bg-yellow-50 py-1.5 rounded-lg border border-yellow-100/30">{member.i}</div>
                      <div className="w-10 text-center text-xs text-red-600 bg-red-50 py-1.5 rounded-lg border border-red-100/30">{member.b}</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
          <CalendarIcon size={40} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-900 font-bold">Siap Menganalisis?</h3>
          <p className="text-gray-400 text-sm">Pilih bulan di atas untuk melihat rekapitulasi kehadiran.</p>
        </div>
      )}

    </div>
  );
};
