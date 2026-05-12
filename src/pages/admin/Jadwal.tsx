import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  getSchedules, 
  addSchedule, 
  updateSchedule, 
  deleteSchedule
} from '../../services/scheduleService';
import type { Schedule } from '../../services/scheduleService';
import { 
  PlusCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Pencil, 
  Trash2
} from 'lucide-react';


import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSetting, updateSetting } from '../../services/settingsService';

export const Jadwal: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Queries
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules
  });

  const { data: activityCategories = ['Latihan Rutin', 'Tampilan Parade', 'Rapat Pengurus'] } = useQuery({
    queryKey: ['settings', 'activity_categories'],
    queryFn: () => getSetting('activity_categories').then(res => res || ['Latihan Rutin', 'Tampilan Parade', 'Rapat Pengurus'])
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Category management
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [deleteScheduleConfirm, setDeleteScheduleConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ isOpen: boolean; name: string }>({
    isOpen: false,
    name: ''
  });

  const [formData, setFormData] = useState({
    title: 'Latihan Rutin',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: '',
    description: '',
    type: 'latihan' as Schedule['type']});

  const updateCategoryMutation = useMutation({
    mutationFn: (newCategories: string[]) => updateSetting('activity_categories', newCategories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'activity_categories'] });
    }
  });

  const handleAddActivityCategory = () => {
    if (newActivityName.trim() && !activityCategories.includes(newActivityName.trim())) {
      const updated = [...activityCategories, newActivityName.trim()];
      updateCategoryMutation.mutate(updated);
      setFormData({ ...formData, title: newActivityName.trim() });
      toast.success(`Kategori ${newActivityName.trim()} ditambahkan`);
    }
    setNewActivityName('');
    setIsAddingActivity(false);};

  const handleDeleteCategory = (catToDelete: string) => {
    setDeleteCategoryConfirm({ isOpen: true, name: catToDelete });
  };

  const confirmDeleteCategory = () => {
    const catToDelete = deleteCategoryConfirm.name;
    const updated = activityCategories.filter((c: string) => c !== catToDelete);
    updateCategoryMutation.mutate(updated);
    if (formData.title === catToDelete) {
      setFormData({ ...formData, title: updated[0] || '' });
    }
    setDeleteCategoryConfirm({ isOpen: false, name: '' });
    toast.success(`Kategori ${catToDelete} dihapus`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const promise = editingId 
      ? updateSchedule(editingId, formData) 
      : addSchedule(formData);

    toast.promise(promise, {
      loading: 'Menyimpan jadwal...',
      success: (res) => {
        if (res) {
          setIsModalOpen(false);
          resetForm();
          queryClient.invalidateQueries({ queryKey: ['schedules'] });
          return editingId ? 'Jadwal diperbarui' : 'Jadwal ditambahkan';
        }
        throw new Error('Gagal menyimpan');
      },
      error: 'Terjadi kesalahan sistem'
    });

    setIsSubmitting(false);};

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      title: schedule.title,
      date: schedule.date,
      time: schedule.time,
      location: schedule.location,
      description: schedule.description,
      type: schedule.type});
    setEditingId(schedule.id);
    setIsModalOpen(true);};

  const handleDelete = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      setDeleteScheduleConfirm({ isOpen: true, id: schedule.id, title: schedule.title });
    }
  };

  const confirmDeleteSchedule = async () => {
    const { id, title } = deleteScheduleConfirm;
    setDeleteScheduleConfirm(prev => ({ ...prev, isOpen: false }));
    
    const promise = deleteSchedule(id);

    toast.promise(promise, {
      loading: `Menghapus jadwal ${title}...`,
      success: () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        return `Jadwal ${title} berhasil dihapus`;
      },
      error: 'Gagal menghapus jadwal'
    });
  };

  const resetForm = () => {
    setFormData({
      title: activityCategories?.[0] || 'Latihan Rutin',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      location: '',
      description: '',
      type: 'latihan'});
    setEditingId(null);};

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);};

  // Group schedules by Month Year
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = formatMonthYear(schedule.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(schedule);
    return acc;}, {} as Record<string, Schedule[]>);



  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white px-4 py-3 border-b border-gray-200 rounded-md shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">Manajemen Jadwal</h2>
          <p className="text-xs text-gray-500 mt-0.5">Atur kegiatan latihan, tampilan, dan agenda lainnya</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          variant="primary" 
          size="sm" 
          className="w-full md:w-auto gap-2"
          disabled={isLoadingSchedules}
        >
          <PlusCircle size={16} /> Tambah Jadwal
        </Button>
      </div>

      {isLoadingSchedules ? (
        <Card className="p-12 text-center bg-white border-0 shadow-sm ring-1 ring-gray-100">
          <p className="text-gray-500 font-medium">Memuat jadwal...</p>
        </Card>
      ) : Object.keys(groupedSchedules).length > 0 ? (
        Object.entries(groupedSchedules).map(([monthYear, monthSchedules]) => (
          <div key={monthYear} className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="h-6 w-1 bg-red-700 rounded-full" />
              <h3 className="text-lg font-bold text-gray-700">{monthYear}</h3>
            </div>
            
            <Card className="p-0 overflow-hidden border-0 shadow-sm ring-1 ring-gray-100">
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-2.5 text-xs font-bold text-gray-400  w-16 text-center">No</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-gray-400 ">Nama Kegiatan</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-gray-400 ">Waktu & Tanggal</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-gray-400 " >Lokasi</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-gray-400  text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthSchedules.map((item, index) => (
                      <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">
                        <td className="px-5 py-3 text-sm text-gray-400 text-center font-medium">{index + 1}</td>
                        <td className="px-5 py-3">
                          <div className="font-bold text-gray-800 text-sm">{item.title}</div>
                          {item.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</div>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <CalendarIcon size={12} className="text-red-700" />
                            <span>{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock size={12} className="text-gray-400" />
                            <span>{item.time} WIB</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin size={12} className="text-red-700" />
                            <span className="line-clamp-1">{item.location}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Card List */}
              <div className="md:hidden divide-y divide-gray-100">
                {monthSchedules.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 font-medium">
                          <CalendarIcon size={10} className="text-red-700" />
                          <span>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          <span className="mx-1">•</span>
                          <Clock size={10} className="text-gray-400" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded-md"><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded-md"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg text-[11px] text-gray-600">
                      <MapPin size={10} className="text-red-700 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))
      ) : (
        <Card className="p-12 text-center bg-white border-0 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <CalendarIcon size={32} />
            </div>
            <p className="text-gray-500 font-medium">Belum ada jadwal untuk bulan ini dan mendatang</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-2">
              Buat Jadwal Pertama
            </Button>
          </div>
        </Card>
      )}

      {/* Schedule Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Jadwal Kegiatan' : 'Tambah Jadwal Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700  mb-1.5">Nama Kegiatan (Pilih Kategori)</label>
            {!isAddingActivity ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all appearance-none bg-white"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  >
                    {['latihan', 'rapat', 'tampilan', 'lainnya'].map((cat: any) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsAddingActivity(true)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-lg font-bold hover:bg-gray-200 transition-colors"
                  title="Tambah Kategori Baru"
                >
                  +
                </button>
                {activityCategories.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteCategory(formData.title)} 
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                  <input
                  type="text"
                  autoFocus
                  className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all"
                  placeholder="Kategori kegiatan baru"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                />
                <button type="button" onClick={handleAddActivityCategory} disabled={updateCategoryMutation.isPending} className="px-4 py-2.5 bg-red-700 text-white rounded-xl text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50">Simpan</button>
                <button type="button" onClick={() => setIsAddingActivity(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Batal</button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700  mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700  mb-1.5">Waktu (WIB)</label>
              <input
                type="time"
                required
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700  mb-1.5">Lokasi</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Masukkan lokasi kegiatan"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>


          <div>
            <label className="block text-xs font-bold text-gray-700  mb-1.5">Keterangan Tambahan (Opsional)</label>
            <textarea
              placeholder="Detail tambahan mengenai kegiatan..."
              rows={2}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1 h-11" isLoading={isSubmitting}>
              {editingId ? 'Simpan Perubahan' : 'Tambah ke Jadwal'}
            </Button>
            <Button type="button" variant="outline" className="px-6" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={deleteScheduleConfirm.isOpen}
        onClose={() => setDeleteScheduleConfirm({ ...deleteScheduleConfirm, isOpen: false })}
        onConfirm={confirmDeleteSchedule}
        title="Hapus Jadwal"
        message={`Apakah Anda yakin ingin menghapus jadwal kegiatan "${deleteScheduleConfirm.title}"?`}
      />

      <ConfirmDialog
        isOpen={deleteCategoryConfirm.isOpen}
        onClose={() => setDeleteCategoryConfirm({ ...deleteCategoryConfirm, isOpen: false })}
        onConfirm={confirmDeleteCategory}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteCategoryConfirm.name}"?`}
      />
    </div>
  );
};


