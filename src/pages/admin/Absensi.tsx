import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { getMembers } from '../../services/memberService';
import { getAttendanceByDate, saveAttendance } from '../../services/attendanceService';
import type { Member } from '../../types/member';
import { ArrowUpDown, Calendar as CalendarIcon } from 'lucide-react';

export const Absensi: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'hadir' | 'izin' | 'bolos'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [divisionOrder, setDivisionOrder] = useState<string[]>([]);

  const fetchData = async () => {
    const fetchedMembers = await getMembers();
    const existingAttendance = await getAttendanceByDate(date);

    const divisions = Array.from(new Set(fetchedMembers.map(m => m.divisi)));

    if (divisionOrder.length === 0 || divisions.some(d => !divisionOrder.includes(d))) {
      const newOrder = [...divisionOrder.filter(d => divisions.includes(d))];
      divisions.forEach(d => {
        if (!newOrder.includes(d)) newOrder.push(d);
      });
      setDivisionOrder(newOrder);
    }

    const attendanceMap: Record<string, 'hadir' | 'izin' | 'bolos'> = {};

    fetchedMembers.forEach(m => {
      attendanceMap[m.id] = 'hadir';
    });

    if (existingAttendance.length > 0) {
      existingAttendance.forEach(record => {
        attendanceMap[record.member_id] = record.status;
      });
      if (existingAttendance[0].location) {
        setLocation(existingAttendance[0].location);
      } else {
        setLocation('');
      }
    } else {
      setLocation('');
    }

    setMembers(fetchedMembers);
    setAttendance(attendanceMap);
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const handleStatusChange = (memberId: string, status: 'hadir' | 'izin' | 'bolos') => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const recordsToSave = members.map(member => ({
      member_id: member.id,
      date: date,
      status: attendance[member.id] || 'hadir',
      location: location
    }));

    const success = await saveAttendance(recordsToSave);
    if (success) {
      alert('Data absensi berhasil disimpan!');
    } else {
      alert('Gagal menyimpan absensi.');
    }

    setIsSaving(false);
  };

  const rotateDivisionOrder = () => {
    if (divisionOrder.length <= 1) return;
    const newOrder = [...divisionOrder];
    const first = newOrder.shift()!;
    newOrder.push(first);
    setDivisionOrder(newOrder);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 md:p-4 border-b border-gray-200 rounded-md shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">Input Absensi</h2>
          <p className="text-xs text-gray-500 mt-0.5">Catat kehadiran anggota MB Chondro hari ini</p>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-400  mb-1.5">Tanggal Kegiatan</label>
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
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-gray-400  mb-1.5">Keterangan / Lokasi Kegiatan</label>
            <input
              type="text"
              placeholder="Contoh: Latihan Rutin, Perform GOR, dll"
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium outline-none transition-all bg-gray-50/30"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="primary"
              className="w-full h-[34px] text-xs font-bold  rounded-md"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Simplified Unified Attendance Table - Flat Style */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase border-b border-gray-100 font-black tracking-widest">
                <th className="px-4 py-3 font-bold">Nama Anggota</th>
                <th className="px-4 py-3 font-bold flex items-center gap-1.5">
                  Divisi
                  <button
                    onClick={rotateDivisionOrder}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-4 py-3 font-bold text-right">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {divisionOrder.map((div) => {
                const divMembers = members.filter(m => m.divisi === div);
                return divMembers.map((member) => (
                  <tr key={member?.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-800 text-[13px]">{member?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-sm text-[10px] font-black border border-gray-200 uppercase tracking-tight">
                        {member?.divisi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        className={`px-2 py-1 border rounded-md text-xs font-bold outline-none transition-all cursor-pointer ${
                          (attendance[member.id] || 'hadir') === 'hadir' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20 focus:border-green-500' :
                          (attendance[member.id] || 'hadir') === 'izin' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500/20 focus:border-yellow-500' :
                          'bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20 focus:border-red-500'
                        }`}
                        value={attendance[member.id] || 'hadir'}
                        onChange={(e) => handleStatusChange(member.id, e.target.value as any)}
                      >
                        <option value="hadir">Hadir</option>
                        <option value="izin">Izin</option>
                        <option value="bolos">Bolos</option>
                      </select>
                    </td>
                  </tr>
                ));})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


