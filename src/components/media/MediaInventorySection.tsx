import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { getMediaInventory, addMediaInventory, updateMediaInventory, deleteMediaInventory } from '../../services/mediaInventoryService';
import type { MediaInventory } from '../../services/mediaInventoryService';
import { Package, Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { staggerContainer, staggerItem } from '../../lib/animations';

const CATEGORIES = ['Kamera', 'Lensa', 'Lighting', 'Audio', 'Komputer', 'Aksesoris', 'Lainnya'];

export const MediaInventorySection: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState<'semua' | 'bagus' | 'jelek'>('semua');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'Kamera', quantity: 1, condition: 'bagus' as 'bagus' | 'jelek' });
  
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: '', name: '' });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['media_inventory'],
    queryFn: getMediaInventory,
  });

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = filterCondition === 'semua' || item.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  const stats = {
    total: inventory.reduce((acc, curr) => acc + curr.quantity, 0),
    bagus: inventory.filter(i => i.condition === 'bagus').reduce((acc, curr) => acc + curr.quantity, 0),
    jelek: inventory.filter(i => i.condition === 'jelek').reduce((acc, curr) => acc + curr.quantity, 0)
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => editingId ? updateMediaInventory(editingId, data) : addMediaInventory(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['media_inventory'] });
        setIsModalOpen(false);
        toast.success(editingId ? 'Barang diperbarui' : 'Barang ditambahkan');
      } else {
        toast.error(`Gagal: ${res.error}`);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMediaInventory,
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['media_inventory'] });
        toast.success('Barang dihapus');
      }
    }
  });

  const handleToggleCondition = (item: MediaInventory) => {
    const newCondition = item.condition === 'bagus' ? 'jelek' : 'bagus';
    updateMediaInventory(item.id, { condition: newCondition }).then(success => {
      if(success) {
        queryClient.invalidateQueries({ queryKey: ['media_inventory'] });
        toast.success(`Kondisi ${item.name} diubah menjadi ${newCondition.toUpperCase()}`);
      }
    });
  };

  const openModal = (item?: MediaInventory) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, category: item.category, quantity: item.quantity, condition: item.condition });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: 'Kamera', quantity: 1, condition: 'bagus' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-red-600" /> Inventaris Media
          </h2>
          <p className="text-sm text-gray-500 mt-1">Kelola perlengkapan dan peralatan operasional media</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={16} className="mr-2" /> Tambah Barang
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Barang</p>
          <p className="text-xl font-black text-gray-900 leading-none">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1.5">
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-none">Kondisi Bagus</p>
          <p className="text-xl font-black text-green-700 leading-none">{stats.bagus}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1.5">
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-none">Kondisi Jelek</p>
          <p className="text-xl font-black text-red-700 leading-none">{stats.jelek}</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-0 ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari barang atau kategori..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500"
            />
          </div>
          <select 
            value={filterCondition} 
            onChange={e => setFilterCondition(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium text-gray-600"
          >
            <option value="semua">Semua Kondisi</option>
            <option value="bagus">Kondisi Bagus</option>
            <option value="jelek">Kondisi Jelek / Rusak</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3">Nama Barang</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-center">Jumlah</th>
                <th className="px-5 py-3 text-center">Kondisi</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="initial" animate="animate" className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map(item => (
                  <motion.tr variants={staggerItem} key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-800">{item.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-medium">{item.category}</td>
                    <td className="px-5 py-3 text-center font-black text-gray-900">{item.quantity}</td>
                    <td className="px-5 py-3 text-center">
                      <button 
                        onClick={() => handleToggleCondition(item)}
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase transition-all hover:opacity-80 active:scale-95",
                          item.condition === 'bagus' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {item.condition === 'bagus' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {item.condition}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openModal(item)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: item.id, name: item.name })} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Tidak ada data inventaris.</td></tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Barang' : 'Tambah Barang'}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Barang</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
              <select className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500 bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Jumlah</label>
              <input type="number" min="1" required className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Kondisi</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formData.condition === 'bagus'} onChange={() => setFormData({...formData, condition: 'bagus'})} className="text-red-600" />
                <span className="text-sm font-medium">Bagus</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formData.condition === 'jelek'} onChange={() => setFormData({...formData, condition: 'jelek'})} className="text-red-600" />
                <span className="text-sm font-medium text-red-600">Jelek / Rusak</span>
              </label>
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" isLoading={saveMutation.isPending}>Simpan Inventaris</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={() => { deleteMutation.mutate(deleteConfirm.id); setDeleteConfirm({ ...deleteConfirm, isOpen: false }); }}
        title="Hapus Barang"
        message={`Hapus ${deleteConfirm.name} dari inventaris?`}
      />
    </div>
  );
};
