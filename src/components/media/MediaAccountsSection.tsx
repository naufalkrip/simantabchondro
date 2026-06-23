import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { getMediaAccounts, addMediaAccount, updateMediaAccount, deleteMediaAccount } from '../../services/mediaAccountService';
import type { MediaAccount } from '../../services/mediaAccountService';
import { Fingerprint, Plus, Pencil, Trash2, Copy, Eye, EyeOff, Globe2, Power } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

const PLATFORMS = ['Email', 'TikTok', 'YouTube', 'Instagram', 'Facebook', 'Spotify', 'Canva', 'CapCut', 'Drive', 'Meta Business', 'Lainnya'];

export const MediaAccountsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ platform: 'Instagram', username: '', password: '', status: 'aktif' as 'aktif' | 'nonaktif' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: '', platform: '' });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['media_accounts'],
    queryFn: getMediaAccounts,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Omit<MediaAccount, 'id' | 'last_updated' | 'created_at'>) => editingId ? updateMediaAccount(editingId, data) : addMediaAccount(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['media_accounts'] });
        setIsModalOpen(false);
        toast.success(editingId ? 'Akun diperbarui' : 'Akun ditambahkan');
      } else {
        toast.error(`Gagal: ${res.error}`);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMediaAccount,
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['media_accounts'] });
        toast.success('Akun dihapus');
      }
    }
  });

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} disalin ke clipboard`);
  };

  const handleToggleStatus = (item: MediaAccount) => {
    const newStatus = item.status === 'aktif' ? 'nonaktif' : 'aktif';
    updateMediaAccount(item.id, { status: newStatus }).then(success => {
      if(success) {
        queryClient.invalidateQueries({ queryKey: ['media_accounts'] });
        toast.success(`Status ${item.platform} diubah menjadi ${newStatus.toUpperCase()}`);
      }
    });
  };

  const openModal = (item?: MediaAccount) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ platform: item.platform, username: item.username, password: item.password, status: item.status });
    } else {
      setEditingId(null);
      setFormData({ platform: 'Instagram', username: '', password: '', status: 'aktif' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Fingerprint className="text-red-600" /> Kelola Akun Media
          </h2>
          <p className="text-sm text-gray-500 mt-1">Pusat penyimpanan kredensial akun media sosial</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={16} className="mr-2" /> Tambah Akun
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {isLoading ? (
            <div className="col-span-full py-10 text-center text-gray-400">Loading...</div>
          ) : accounts.length > 0 ? (
            accounts.map((acc, index) => (
              <motion.div 
                key={acc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-700">
                      <Globe2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{acc.platform}</h3>
                      <button 
                        onClick={() => handleToggleStatus(acc)}
                        className={clsx("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", acc.status === 'aktif' ? 'text-green-600' : 'text-gray-400')}
                      >
                        <Power size={10} /> {acc.status}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(acc)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: acc.id, platform: acc.platform })} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center group">
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Username / Email</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{acc.username}</p>
                    </div>
                    <button onClick={() => copyToClipboard(acc.username, 'Username')} className="p-2 text-gray-400 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy">
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center group">
                    <div className="overflow-hidden flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Password</p>
                      <p className={clsx("text-sm font-mono truncate", !visiblePasswords[acc.id] && "blur-[4px] select-none opacity-60")}>
                        {acc.password}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => togglePassword(acc.id)} className="p-2 text-gray-400 hover:text-gray-900" title="Reveal">
                        {visiblePasswords[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => copyToClipboard(acc.password, 'Password')} className="p-2 text-gray-400 hover:text-gray-900" title="Copy">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
             <div className="col-span-full py-10 text-center text-gray-400 bg-white border border-dashed rounded-xl">Belum ada data akun media.</div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Akun' : 'Tambah Akun'}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Platform</label>
            <select className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500 bg-white" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Username / Email</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Password</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" isLoading={saveMutation.isPending}>Simpan Akun</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={() => { deleteMutation.mutate(deleteConfirm.id); setDeleteConfirm({ ...deleteConfirm, isOpen: false }); }}
        title="Hapus Akun"
        message={`Yakin ingin menghapus kredensial ${deleteConfirm.platform}?`}
      />
    </div>
  );
};
