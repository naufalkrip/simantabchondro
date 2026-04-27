import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { getAttendanceByDateRange } from '../../services/attendanceService';
import { getTransactions } from '../../services/transactionService';
import { getMembers } from '../../services/memberService';
import { subscribeToDataChange } from '../../services/refreshService';
import type { Attendance } from '../../types/attendance';
import type { Transaction } from '../../types/transaction';
import type { Member } from '../../types/member';
import { 
  Calendar, 
  Wallet, 
  History, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle,
  UserCircle,
  Image as ImageIcon
} from 'lucide-react';
import clsx from 'clsx';

export const Dashboard: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [member, setMember] = useState<Member | null>(null);

  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const memberId = localStorage.getItem('member_id');
  const storedName = localStorage.getItem('member_name') || 'Anggota';

  useEffect(() => {
    const fetchData = async () => {
      if (!memberId) return;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const startDate = oneMonthAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const [attData, transData, membersData] = await Promise.all([
        getAttendanceByDateRange(startDate, endDate),
        getTransactions(),
        getMembers()
      ]);

      const myAttendance = attData.filter(a => a.member_id === memberId);
      const myTransactions = transData.filter(t => t.member_id === memberId);
      const myProfile = membersData.find(m => m.id === memberId) || null;

      setAttendance(myAttendance);
      setTransactions(myTransactions);
      setMember(myProfile);

    };

    fetchData();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToDataChange(() => {
      fetchData();
    });

    return () => unsubscribe();
  }, [memberId]);

  const attendanceStats = {
    hadir: attendance.filter(a => a.status === 'hadir').length,
    izin: attendance.filter(a => a.status === 'izin').length,
    bolos: attendance.filter(a => a.status === 'bolos').length,
    total: attendance.length
  };

  const attendancePercentage = attendanceStats.total > 0 
    ? Math.round((attendanceStats.hadir / attendanceStats.total) * 100) 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };


  return (
    <div className="space-y-6">
      {/* Welcome Section (Matching Admin Style) */}
      <div className="p-4 bg-gradient-to-r from-red-700 to-red-900 text-white shadow-sm rounded-md overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-0.5">Halo. {member?.name || storedName}! 👋</h3>
            <p className="text-red-50/80 text-xs max-w-xl leading-relaxed">
              Selamat datang di portal informasi SIMANTAB. Pantau data kehadiran, tabungan, dan informasi tampilan Anda di sini.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-bold text-red-200 uppercase tracking-widest opacity-80">Divisi</p>
              <p className="text-sm font-bold text-white">{member?.divisi || '-'}</p>
            </div>
            <div className="text-right border-l pl-4 border-white/20">
              <p className="text-[10px] font-bold text-red-200 uppercase tracking-widest opacity-80">Status</p>
              <p className="text-sm font-bold text-green-400">Aktif</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <UserCircle size={70} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance Summary */}
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Kehadiran (30 Hari)</p>
              <h3 className="text-2xl font-black text-gray-900">{attendancePercentage}%</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-500 font-bold">{attendanceStats.hadir} Hadir</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-gray-500 font-bold">{attendanceStats.izin} Izin</span>
            </div>
          </div>
        </Card>

        {/* Savings Summary */}
        <Card className="p-4 border-l-4 border-l-red-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Tabungan</p>
              <h3 className="text-2xl font-black text-gray-900">{formatCurrency(member?.totalBalance || 0)}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-700 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <p className="mt-3 text-[10px] text-gray-400 font-medium italic">*Update terakhir: {new Date().toLocaleDateString('id-ID')}</p>
        </Card>

        {/* Quick Info / Performance */}
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Penampilan</p>
              <h3 className="text-2xl font-black text-gray-900">
                {attendance.filter(a => a.location && a.location.toLowerCase().includes('penampilan') && a.status === 'hadir').length} Kali
              </h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-tight">Riwayat Kehadiran Penampilan</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance List */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Riwayat Kehadiran Terakhir</h3>
            <History size={14} className="text-gray-300" />
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {attendance.length > 0 ? [...attendance].reverse().map(att => (
              <div key={att.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    att.status === 'hadir' ? "bg-green-50 text-green-600" :
                    att.status === 'izin' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                  )}>
                    {att.status === 'hadir' ? <CheckCircle2 size={16} /> :
                     att.status === 'izin' ? <Clock size={16} /> : <XCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{new Date(att.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{att.location || 'Latihan Rutin'}</p>
                  </div>
                </div>
                <span className={clsx(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-sm",
                  att.status === 'hadir' ? "bg-green-100 text-green-700" :
                  att.status === 'izin' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                )}>
                  {att.status}
                </span>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400 text-xs italic">Belum ada riwayat kehadiran</div>
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaksi Terakhir</h3>
            <Wallet size={14} className="text-gray-300" />
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {transactions.length > 0 ? [...transactions].reverse().slice(0, 10).map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    tx.type === 'setoran' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {tx.type === 'setoran' ? <TrendingUp size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(tx.amount)}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                    <span className={clsx(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-sm",
                      tx.type === 'setoran' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {tx.type}
                    </span>
                    {tx.proof_url && (
                      <button 
                        onClick={() => setSelectedProofUrl(tx.proof_url || null)}
                        className="ml-2 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1.5"
                        title="Lihat Bukti Transfer"
                      >
                        <ImageIcon size={12} />
                        <span className="text-[10px] font-bold">Lihat</span>
                      </button>
                    )}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400 text-xs italic">Belum ada riwayat transaksi</div>
            )}
          </div>
        </Card>
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!selectedProofUrl}
        onClose={() => setSelectedProofUrl(null)}
        title="Bukti Transfer"
        maxWidth="lg"
      >
        {selectedProofUrl && (
          <div className="space-y-4">
            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
              <img 
                src={selectedProofUrl} 
                alt="Bukti Transfer Detail" 
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-sm mx-auto"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1 font-bold text-xs py-3"
                onClick={() => setSelectedProofUrl(null)}
              >
                Tutup Preview
              </Button>
              <a 
                href={selectedProofUrl} 
                download={`Bukti_Transfer_${new Date().getTime()}.png`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full font-bold text-xs py-3 border-gray-200">
                  Unduh Gambar
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
