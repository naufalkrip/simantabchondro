import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { getMembers } from '../../services/memberService';
import { getAttendanceByDateAndLocation, saveAttendance } from '../../services/attendanceService';
import type { Member } from '../../types/member';
import { ArrowUpDown, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeToDataChange } from '../../services/refreshService';

export const Absensi: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'hadir' | 'izin' | 'bolos' | 'tampil'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [divisionOrder, setDivisionOrder] = useState<string[]>([]);

  const fetchData = async (selectedLocation: string) => {
    const fetchedMembers = await getMembers();
    const existingAttendance = await getAttendanceByDateAndLocation(date, selectedLocation);

    const divisions = Array.from(new Set(fetchedMembers.map(m => m.divisi)));

    if (divisionOrder.length === 0 || divisions.some(d => !divisionOrder.includes(d))) {
      const newOrder = [...divisionOrder.filter(d => divisions.includes(d))];
      divisions.forEach(d => {
        if (!newOrder.includes(d)) newOrder.push(d);
      });
      setDivisionOrder(newOrder);
    }

    const attendanceMap: Record<string, 'hadir' | 'izin' | 'bolos' | 'tampil'> = {};

    fetchedMembers.forEach(m => {
      attendanceMap[m.id] = 'hadir';
    });

    existingAttendance.forEach(record => {
      attendanceMap[record.member_id] = record.status;
    });

    setMembers(fetchedMembers);
    setAttendance(attendanceMap);
  };

  useEffect(() => {
    if (location) {
      fetchData(location);
    } else {
      fetchData('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, location]);

  useEffect(() => {
    if (location) {
      fetchData(location);
    }
    const unsub = subscribeToDataChange(() => {
      if (location) fetchData(location);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleStatusChange = (memberId: string, status: 'hadir' | 'izin' | 'bolos' | 'tampil') => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSave = async () => {
    if (!location.trim()) {
      toast.error('Lokasi / sesi harus diisi');
      return;
    }

    setIsSaving(true);

    const recordsToSave = members.map(member => ({
      member_id: member.id,
      date: date,
      status: attendance[member.id] || 'hadir',
      location: location.trim()
    }));

    const promise = saveAttendance(recordsToSave);

    toast.promise(promise, {
      loading: 'Menyimpan data absensi...',
      success: (res) => {
        if (res) {
          fetchData(location);
          return 'Data absensi berhasil disimpan';
        }
        throw new Error('Gagal menyimpan');
      },
      error: (err) => `Gagal: ${err.message || 'Terjadi kesalahan sistem'}`
    });

    setIsSaving(false);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value) {
      fetchData(value);
    }
  };

  const rotateDivisionOrder = () => {
    if (divisionOrder.length <= 1) return;
    const newOrder = [...divisionOrder];
    const first = newOrder.shift()!;
    newOrder.push(first);
    setDivisionOrder(newOrder);
    toast.info(`Urutan divisi dirotasi`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white px-4 py-3 border-b border-gray-200 rounded-md shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">Input Absensi</h2>
          <p className="text-xs text-gray-500 mt-0.5">Catat kehadiran anggota MB Chondro hari ini</p>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tanggal</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sesi / Lokasi Kegiatan</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Latihan Rutin, Perform GOR"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Keterangan Tambahan</label>
            <input
              type="text"
              placeholder="(opsional)"
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
              disabled
            />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              variant="primary"
              className="w-full h-[34px] text-xs font-bold rounded-md"
            >
              Simpan Absensi
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop View Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase border-b border-gray-100 font-black tracking-widest">
                <th className="px-4 py-2.5 font-bold">Nama Anggota</th>
                <th className="px-4 py-2.5 font-bold flex items-center gap-1.5">
                  Divisi
                  <button
                    onClick={rotateDivisionOrder}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-bold text-right">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {divisionOrder.map((div) => {
                const divMembers = members.filter(m => m.divisi === div);
                return divMembers.map((member) => (
                  <tr key={member?.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-gray-800 text-[13px]">{member?.name || 'Unknown'}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-sm text-[10px] font-black border border-gray-200 uppercase tracking-tight">
                        {member?.divisi}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <select
                        className={`px-3 py-2 border rounded-lg text-sm font-bold outline-none transition-all cursor-pointer ${
                          (attendance[member.id] || 'hadir') === 'hadir' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20 focus:border-green-500' :
                          (attendance[member.id] || 'hadir') === 'tampil' ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500/20 focus:border-purple-500' :
                          (attendance[member.id] || 'hadir') === 'izin' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500/20 focus:border-yellow-500' :
                          'bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20 focus:border-red-500'
                        }`}
                        value={attendance[member.id] || 'hadir'}
                        onChange={(e) => handleStatusChange(member.id, e.target.value as 'hadir' | 'tampil' | 'izin' | 'bolos')}
                      >
                        <option value="hadir">Hadir</option>
                        <option value="tampil">Tampil</option>
                        <option value="izin">Izin</option>
                        <option value="bolos">Bolos</option>
                      </select>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View Card List */}
      <div className="md:hidden space-y-3 mb-8">
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Urutkan Divisi</p>
          <button
            onClick={rotateDivisionOrder}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100"
          >
            <ArrowUpDown size={10} /> Putar Urutan
          </button>
        </div>

        <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {divisionOrder.map((div) => {
            const divMembers = members.filter(m => m.divisi === div);
            return divMembers.map((member) => (
              <div key={member?.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">{member?.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{member?.divisi}</p>
                </div>
                <select
                  className={`px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all cursor-pointer ${
                    (attendance[member.id] || 'hadir') === 'hadir' ? 'bg-green-50 text-green-700 border-green-200' :
                    (attendance[member.id] || 'hadir') === 'tampil' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    (attendance[member.id] || 'hadir') === 'izin' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}
                  value={attendance[member.id] || 'hadir'}
                  onChange={(e) => handleStatusChange(member.id, e.target.value as 'hadir' | 'tampil' | 'izin' | 'bolos')}
                >
                  <option value="hadir">Hadir</option>
                  <option value="tampil">Tampil</option>
                  <option value="izin">Izin</option>
                  <option value="bolos">Bolos</option>
                </select>
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
};
