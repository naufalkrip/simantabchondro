import { getSchedules } from '../../services/scheduleService';
import type { Schedule } from '../../services/scheduleService';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Info
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { exportModernPDF } from '../../utils/pdfExport';

export const Jadwal: React.FC = () => {
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const data = await getSchedules();
      return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  });

  const handleDownloadPDF = async () => {
    if (schedules.length === 0) {
      toast.error('Tidak ada data jadwal untuk didownload');
      return;
    }

    const tableData = schedules.map((item, index) => [
      index + 1,
      item.title,
      new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      `${item.time} WIB`,
      item.location
    ]);

    const toastId = toast.loading('Membuat laporan PDF...');
    try {
      await exportModernPDF({
        title: 'Jadwal Kegiatan',
        filename: `Jadwal_Kegiatan_SIMANTAB_${new Date().toISOString().split('T')[0]}`,
        columns: ['No', 'Nama Kegiatan', 'Tanggal', 'Waktu', 'Lokasi'],
        data: tableData,
        columnStyles: {
          0: { halign: 'center', cellWidth: 30 },
          2: { cellWidth: 120 },
          3: { halign: 'center', cellWidth: 60 },
          4: { cellWidth: 'auto' }
        }
      });
      toast.success('Laporan PDF berhasil diunduh', { id: toastId });
    } catch {
      toast.error('Gagal membuat PDF', { id: toastId });
    }
  };

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  };

  // Group schedules by Month Year
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = formatMonthYear(schedule.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white px-4 py-3 border-b border-gray-100 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Jadwal Kegiatan</h2>
          <p className="text-xs text-gray-500 mt-1">Informasi latihan, tampilan, dan agenda MB Chondro</p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="sm"
          className="w-full md:w-auto border-gray-200"
        >
          Download PDF
        </Button>
      </div>

      {Object.keys(groupedSchedules).length > 0 ? (
        Object.entries(groupedSchedules).map(([monthYear, monthSchedules]) => (
          <div key={monthYear} className="space-y-2">
            <div className="flex items-center gap-2 px-1 py-1">
              <div className="h-4 w-1 bg-red-700 rounded-full" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{monthYear}</h3>
            </div>
            
            <Card className="p-0 overflow-hidden border-0 shadow-sm ring-1 ring-gray-100">
              <div className="divide-y divide-gray-50">
                {monthSchedules.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                    {/* Date Badge */}
                    <div className="w-12 md:w-16 flex flex-col items-center justify-center border-r border-gray-100 shrink-0 pr-3">
                      <span className="text-[10px] font-bold text-red-600 uppercase leading-none mb-1">
                        {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                      <span className="text-lg md:text-xl font-black text-gray-900 leading-none">
                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors truncate">
                          {item.title}
                        </h4>
                        <span className="text-[9px] font-black text-red-600/40 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded border border-red-100/50">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} className="text-gray-400" />
                          <span>{item.time} WIB</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={10} className="text-red-700" />
                          <span className="truncate max-w-[150px] md:max-w-none">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Small Arrow or Status indicator if needed, or just leave it clean */}
                    <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                      <Info size={14} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))
      ) : isLoading ? (
        <Card className="p-16 text-center bg-white border-0 shadow-sm ring-1 ring-gray-100">
          <p className="text-gray-500 font-medium">Memuat jadwal...</p>
        </Card>
      ) : (
        <Card className="p-16 text-center bg-white border-0 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <CalendarIcon size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-gray-900 font-bold">Belum Ada Jadwal</p>
              <p className="text-gray-400 text-sm">Tidak ada kegiatan yang dijadwalkan untuk saat ini.</p>
            </div>
          </div>
        </Card>
      )}
      
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
          Jadwal di atas dapat berubah sewaktu-waktu sesuai kebijakan pengurus. Pastikan Anda selalu memantau informasi terbaru di grup koordinasi masing-masing divisi.
        </p>
      </div>
    </div>
  );
};
