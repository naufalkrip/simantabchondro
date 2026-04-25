import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { getAttendanceByDateRange } from '../../services/attendanceService';
import type { Attendance } from '../../types/attendance';
import { 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText
} from 'lucide-react';
import clsx from 'clsx';

export const Absensi: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const memberId = localStorage.getItem('member_id');

  useEffect(() => {
    const fetchData = async () => {
      if (!memberId) return;

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const data = await getAttendanceByDateRange(startDate, endDate);
      const myData = data.filter(a => a.member_id === memberId);
      
      setAttendance(myData);
      setIsLoading(false);
    };

    fetchData();
  }, [memberId]);

  const stats = {
    hadir: attendance.filter(a => a.status === 'hadir').length,
    izin: attendance.filter(a => a.status === 'izin').length,
    bolos: attendance.filter(a => a.status === 'bolos').length,
    total: attendance.length
  };

  const percentage = stats.total > 0 
    ? Math.round((stats.hadir / stats.total) * 100) 
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px] text-gray-400">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Detail Absensi</h2>
          <p className="text-xs text-gray-500 mt-1">Bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
          <FileText size={18} className="text-red-700" />
          <span className="text-sm font-black text-red-700">{percentage}% Kehadiran</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-green-50/30 border-green-100">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Hadir</p>
            <h4 className="text-xl font-black text-gray-900">{stats.hadir} Hari</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-yellow-50/30 border-yellow-100">
          <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Izin</p>
            <h4 className="text-xl font-black text-gray-900">{stats.izin} Hari</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-red-50/30 border-red-100">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Tanpa Keterangan</p>
            <h4 className="text-xl font-black text-gray-900">{stats.bolos} Hari</h4>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Kehadiran Lengkap</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lokasi/Keterangan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendance.length > 0 ? [...attendance].reverse().map(att => (
                <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-gray-800">{new Date(att.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-500 font-medium">{att.location || 'Latihan Rutin'}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={clsx(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-sm",
                      att.status === 'hadir' ? "bg-green-100 text-green-700" :
                      att.status === 'izin' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    )}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-xs italic">
                    Tidak ada data absensi untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
