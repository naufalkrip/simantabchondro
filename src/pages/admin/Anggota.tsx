import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getMembersList, addMember, deleteMember, updateMember } from '../../services/memberService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { Member } from '../../types/member';
import { exportModernPDF } from '../../utils/pdfExport';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const BANK_OPTIONS = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Dana', 'OVO', 'Gopay', 'ShopeePay'];

export const Anggota: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joinedDate: new Date().toISOString().split('T')[0],
    bankOwnerName: '',
    bankAccountNumber: '',
    bankName: '',
    divisi: 'Reguler'
  });
  const [divisions, setDivisions] = useState(['Reguler', 'VIP', 'Pengurus']);
  const [newDivision, setNewDivision] = useState('');
  const [isAddingDivision, setIsAddingDivision] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const fetchMembers = async () => {
    const data = await getMembersList();
    setMembers(data);
    
    const existingDivisions = Array.from(new Set(data.map(m => m.divisi)));
    setDivisions(prev => Array.from(new Set([...prev, ...existingDivisions])));
  };

  useEffect(() => {
    fetchMembers();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToDataChange(() => {
      fetchMembers();
    });

    // Periodic polling sebagai fallback real-time
    const interval = setInterval(fetchMembers, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload: any = { ...formData };
    if (!payload.bankName) delete payload.bankName;
    if (!payload.bankAccountNumber) delete payload.bankAccountNumber;
    if (!payload.bankOwnerName) delete payload.bankOwnerName;

    try {
      const res = editingId 
        ? await updateMember(editingId, payload) 
        : await addMember(payload);

      if (res) {
        setIsModalOpen(false);
        resetForm();
        await fetchMembers();
        toast.success(editingId ? 'Data berhasil diperbarui' : 'Anggota berhasil ditambahkan');
      } else {
        throw new Error('Gagal menyimpan data');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      joinedDate: new Date().toISOString().split('T')[0],
      divisi: 'Reguler',
      bankOwnerName: '',
      bankAccountNumber: '',
      bankName: ''
    });
    setEditingId(null);
  };

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      joinedDate: member.joinedDate,
      divisi: member.divisi,
      bankOwnerName: member.bankOwnerName || '',
      bankAccountNumber: member.bankAccountNumber || '',
      bankName: member.bankName || ''
    });
    setEditingId(member.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      setDeleteConfirm({ isOpen: true, id: member.id, name: member.name });
    }
  };

  const confirmDelete = async () => {
    const { id, name } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    
    try {
      await deleteMember(id);
      await fetchMembers();
      toast.success(`Anggota ${name} berhasil dihapus`);
    } catch {
      toast.error('Gagal menghapus anggota');
    }
  };

  const handleAddDivision = () => {
    if (newDivision.trim() && !divisions.includes(newDivision.trim())) {
      setDivisions([...divisions, newDivision.trim()]);
      setFormData({ ...formData, divisi: newDivision.trim() });
      toast.success(`Divisi ${newDivision.trim()} ditambahkan`);
    }
    setNewDivision('');
    setIsAddingDivision(false);
  };

  const handleDownloadPDF = async () => {
    if (members.length === 0) {
      toast.error('Tidak ada data anggota untuk didownload');
      return;
    }

    // Sort by Division then by Name
    const sortedMembers = [...members].sort((a, b) => {
      if (a.divisi === b.divisi) {
        return a.name.localeCompare(b.name);
      }
      return a.divisi.localeCompare(b.divisi);
    });

    const tableData = sortedMembers.map((m, index) => [
      index + 1,
      m.name,
      m.phone,
      m.divisi
    ]);

    const toastId = toast.loading('Membuat laporan PDF...');
    try {
      await exportModernPDF({
        title: 'Laporan Data Anggota',
        filename: `Laporan_Anggota_SIMANTAB_${new Date().toISOString().split('T')[0]}`,
        columns: ['No', 'Nama', 'No HP', 'Divisi'],
        data: tableData,
        columnStyles: {
          0: { halign: 'center', cellWidth: 30 },
          2: { cellWidth: 100 },
          3: { halign: 'center', cellWidth: 80 }
        }
      });
      toast.success('Laporan PDF berhasil diunduh', { id: toastId });
    } catch (error) {
      toast.error('Gagal membuat PDF', { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 leading-tight">Manajemen Anggota</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Kelola dan organisir anggota berdasarkan divisi</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="flex-1 md:flex-none text-[11px] md:text-xs font-semibold px-3 py-1.5 border-gray-200 rounded-md h-9">
            Download PDF
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="primary" size="sm" className="flex-1 md:flex-none gap-1.5 text-[11px] md:text-xs font-bold px-4 py-1.5 rounded-md h-9">
            <UserPlus size={14} /> Tambah
          </Button>
        </div>
      </div>

      {/* Member Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Informasi Anggota' : 'Tambah Anggota Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400  mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap"
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400  mb-1.5">No HP</label>
              <input
                type="text"
                required
                placeholder="0812..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400  mb-1.5">Tanggal Bergabung</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all bg-gray-50/30"
                value={formData.joinedDate}
                onChange={(e) => setFormData({...formData, joinedDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400  mb-1.5">Divisi</label>
              {!isAddingDivision ? (
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none bg-gray-50/30 transition-all appearance-none"
                    value={formData.divisi}
                    onChange={(e) => setFormData({...formData, divisi: e.target.value})}
                  >
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingDivision(true)} 
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none bg-gray-50/30 transition-all"
                    placeholder="Nama divisi"
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                  />
                  <button type="button" onClick={handleAddDivision} className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-bold uppercase hover:bg-red-700 transition-colors">OK</button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400  mb-3">Rekening (Opsional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-400  mb-1.5">Bank</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none bg-gray-50/30 transition-all"
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                >
                  <option value="">-- Bank --</option>
                  {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-400  mb-1.5">No Rekening</label>
                <input
                  type="text"
                  placeholder="Nomor..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none bg-gray-50/30 transition-all"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-400  mb-1.5">Atas Nama (A/N)</label>
                <input
                  type="text"
                  placeholder="Nama pemilik rekening..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none bg-gray-50/30 transition-all"
                  value={formData.bankOwnerName}
                  onChange={(e) => setFormData({...formData, bankOwnerName: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1 h-10 text-sm font-bold  rounded-md" disabled={isSubmitting}>
              {isSubmitting ? 'Proses...' : editingId ? 'Simpan' : 'Daftar'}
            </Button>
            <Button type="button" variant="outline" className="px-4 text-sm font-bold  rounded-md" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      {/* List Members grouped by Division - Flat Style */}
      <div className="space-y-3 md:space-y-4">
        {divisions.map((division) => {
          const divisionMembers = members.filter(m => m.divisi === division);
          if (divisionMembers.length === 0) return null;
          
          return (
            <div key={division} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-red-600 rounded-full" />
                  <h3 className="text-xs font-bold text-gray-800 ">{division}</h3>
                </div>
                <span className="text-[10px] md:text-xs font-bold  bg-red-50 text-red-600 px-2 py-0.5 rounded-sm border border-red-100">
                  {divisionMembers.length} Anggota
                </span>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-xs border-b border-gray-100 font-bold">
                      <th className="px-4 py-2.5 font-bold">Nama Anggota</th>
                      <th className="px-4 py-2.5 font-bold">Telepon</th>
                      <th className="px-4 py-2.5 font-bold text-right">Aksi</th>
                      <th className="px-4 py-2.5 font-bold text-right">Gabung</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-50">
                    {divisionMembers.map((member) => (
                      <tr key={member?.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800 text-sm">{member?.name || 'Unknown'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-500 text-xs font-medium">
                            {member?.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleEdit(member)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(member.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-400 text-xs">
                          {member?.joinedDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-100">
                {divisionMembers.map((member) => (
                  <div key={member?.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 leading-tight">{member?.name}</p>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-medium tracking-wider">{member?.phone || '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(member)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-95 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-95 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );})}

        {members.length === 0 && (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-md">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-2">
                <UserPlus size={24} />
              </div>
              <p className="text-gray-500 font-bold text-sm">Belum ada data anggota</p>
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="outline" size="sm" className="mt-4 text-sm font-bold uppercase rounded-md">
                Tambah Anggota
              </Button>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Anggota"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirm.name}" dari daftar anggota? Aksi ini tidak dapat dibatalkan.`}
      />
    </div>
  );
};


