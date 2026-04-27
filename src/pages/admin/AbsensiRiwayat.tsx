import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getMembers } from '../../services/memberService';
import { getAttendanceByDate, saveAttendance, getAttendanceHistory } from '../../services/attendanceService';
import type { Member } from '../../types/member';
import { ChevronDown, History, Info } from 'lucide-react';
import { toast } from 'sonner';

export const AbsensiRiwayat: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<{ date: string; location: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  // Constants
  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];
  
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState('');
  const [editingLocation, setEditingLocation] = useState('');
  const [editingAttendance, setEditingAttendance] = useState<Record<string, 'hadir' | 'izin' | 'bolos'>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [fetchedMembers, fetchedHistory] = await Promise.all([
      getMembers(),
      getAttendanceHistory()
    ]);
    setMembers(fetchedMembers);
    setHistory(fetchedHistory);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHistory = history.filter(item => {
    const [year, month] = item.date.split('-');
    const matchesMonth = filterMonth === 'all' || month === filterMonth;
    const matchesYear = year === filterYear;
    return matchesMonth && matchesYear;
  });

  const handleEditHistory = async (selectedDate: string, selectedLocation: string) => {
    setEditingDate(selectedDate);
    setEditingLocation(selectedLocation);

    const existingAttendance = await getAttendanceByDate(selectedDate);
    const attendanceMap: Record<string, 'hadir' | 'izin' | 'bolos'> = {};

    // Initialize with present status for all members
    members.forEach(m => {
      attendanceMap[m.id] = 'hadir';
    });

    existingAttendance.forEach(record => {
      attendanceMap[record.member_id] = record.status;
    });

    setEditingAttendance(attendanceMap);
    setIsEditModalOpen(true);
  };

  const handleStatusChangeEdit = (memberId: string, status: 'hadir' | 'izin' | 'bolos') => {
    setEditingAttendance(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);

    const recordsToSave = members.map(member => ({
      member_id: member.id,
      date: editingDate,
      status: editingAttendance[member.id] || 'hadir',
      location: editingLocation
    }));

    const promise = saveAttendance(recordsToSave);

    toast.promise(promise, {
      loading: 'Menyimpan perubahan absensi...',
      success: (res) => {
        if (res) {
          setIsEditModalOpen(false);
          loadData();
          return 'Perubahan absensi berhasil disimpan';
        }
        throw new Error('Gagal menyimpan');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsSavingEdit(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border-b border-gray-200 rounded-md shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Riwayat Absensi</h2>
        <p className="text-xs text-gray-500 mt-0.5">Lihat dan edit data absensi kegiatan sebelumnya</p>
      </div>

      <div className="flex gap-2 items-center">
        <select 
          className="px-4 py-2 border-none rounded-xl text-xs font-black outline-none bg-white shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer text-gray-700"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="all">Semua Bulan</option>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select 
          className="px-4 py-2 border-none rounded-xl text-xs font-black outline-none bg-white shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer text-gray-700"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-md flex gap-3">
        <Info className="text-blue-500 shrink-0" size={18} />
        <p className="text-xs text-blue-700 leading-relaxed font-medium">
          Klik pada kartu riwayat di bawah untuk mengedit data kehadiran. 
          {filterMonth !== 'all' && ` Menampilkan riwayat bulan ${months.find(m => m.value === filterMonth)?.label} ${filterYear}.`}
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-400">Memuat riwayat...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <button
                key={item.date}
                onClick={() => handleEditHistory(item.date, item.location)}
                className="group relative bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.date}</p>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase">
                    {item.location || 'Tanpa Keterangan'}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase">
                    Edit Detail <ChevronDown size={12} className="-rotate-90" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <History size={32} />
              </div>
              <h3 className="text-gray-900 font-bold">Belum Ada Riwayat</h3>
              <p className="text-gray-400 text-sm">Data absensi akan muncul di sini setelah Anda melakukan input.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Absensi: ${editingDate}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Keterangan / Lokasi</label>
            <input
              type="text"
              placeholder="Isi nama lokasi tempat perform"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-bold outline-none transition-all bg-white"
              value={editingLocation}
              onChange={(e) => setEditingLocation(e.target.value)}
            />
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto max-h-[50vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-3">Anggota</th>
                    <th className="px-6 py-3">Divisi</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-gray-800">{member.name}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-black border border-gray-200 uppercase">
                          {member.divisi}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <select
                          className={`px-2 py-1 border rounded-lg text-xs font-bold outline-none transition-all cursor-pointer ${
                            (editingAttendance[member.id] || 'hadir') === 'hadir' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20 focus:border-green-500' :
                            (editingAttendance[member.id] || 'hadir') === 'izin' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500/20 focus:border-yellow-500' :
                            'bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20 focus:border-red-500'
                          }`}
                          value={editingAttendance[member.id] || 'hadir'}
                          onChange={(e) => handleStatusChangeEdit(member.id, e.target.value as any)}
                        >
                          <option value="hadir">Hadir</option>
                          <option value="izin">Izin</option>
                          <option value="bolos">Bolos</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card List */}
            <div className="md:hidden divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 leading-tight">{member.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{member.divisi}</p>
                  </div>
                  <select
                    className={`px-3 py-1.5 border rounded-lg text-[11px] font-bold outline-none transition-all cursor-pointer ${
                      (editingAttendance[member.id] || 'hadir') === 'hadir' ? 'bg-green-50 text-green-700 border-green-200' :
                      (editingAttendance[member.id] || 'hadir') === 'izin' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}
                    value={editingAttendance[member.id] || 'hadir'}
                    onChange={(e) => handleStatusChangeEdit(member.id, e.target.value as any)}
                  >
                    <option value="hadir">Hadir</option>
                    <option value="izin">Izin</option>
                    <option value="bolos">Bolos</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => setIsEditModalOpen(false)} variant="outline" className="flex-1 font-bold text-xs py-3">
              Batal
            </Button>
            <Button onClick={handleSaveEdit} isLoading={isSavingEdit} variant="primary" className="flex-1 font-bold text-xs py-3">
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
