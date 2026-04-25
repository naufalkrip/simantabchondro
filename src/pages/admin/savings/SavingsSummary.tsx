import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { getMembers } from '../../../services/memberService';
import { getTransactions } from '../../../services/transactionService';
import type { Member } from '../../../types/member';
import type { Transaction } from '../../../types/transaction';
import { ChevronDown, ChevronUp, Download, Users, Wallet, ArrowRightLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const SavingsSummary: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [membersData, transData] = await Promise.all([
        getMembers(),
        getTransactions()
      ]);
      setMembers(membersData);
      setTransactions(transData);};
    loadData();}, []);

  const totalMembers = Array.isArray(members) ? members.length : 0;
  const totalBalance = Array.isArray(members) ? members.reduce((acc, m) => acc + (m?.totalBalance || 0), 0) : 0;
  const totalTransactions = Array.isArray(transactions) ? transactions.length : 0;

  const toggleAccordion = (id: string) => {
    setExpandedMember(expandedMember === id ? null : id);};

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SIMANTAB - Rekap Saldo Anggota', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

    const tableColumn = ["No", "Nama Anggota", "Divisi", "Total Saldo"];
    const tableRows = members.map((m, i) => [
      i + 1,
      m.name,
      m.divisi,
      `Rp ${m.totalBalance?.toLocaleString('id-ID') || '0'}`
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [185, 28, 28] }});

    doc.save('Rekap_Saldo_SIMANTAB.pdf');};

  return (
    <div className="space-y-4">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white border-0 shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-50 text-red-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 ">Total Anggota</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalMembers}</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-green-50 text-green-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 ">Total Saldo</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">Rp {totalBalance.toLocaleString('id-ID')}</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 ">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalTransactions}</p>
          </div>
        </Card>
      </div>

      {/* Member Balances Table */}
      <Card className="overflow-hidden p-0">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">Rekap Saldo Anggota</h3>
          <Button onClick={downloadPDF} size="sm" variant="outline" className="flex items-center gap-2">
            <Download size={14} /> Download PDF
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs border-b">
                <th className="px-4 py-2 font-medium">Nama Anggota</th>
                <th className="px-4 py-2 font-medium">Divisi</th>
                <th className="px-4 py-2 font-medium">Total Saldo</th>
                <th className="px-4 py-2 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {members.map(member => (
                <React.Fragment key={member.id}>
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleAccordion(member.id)}>
                    <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{member.divisi}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">Rp {member.totalBalance?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-gray-400 hover:text-red-700">
                        {expandedMember === member.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>
                  {/* Accordion Content */}
                  {expandedMember === member.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="border rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">5 Transaksi Terakhir</p>
                          {transactions.filter(t => t.member_id === member.id).slice(0, 5).length > 0 ? (
                            <ul className="space-y-2">
                              {transactions.filter(t => t.member_id === member.id).slice(0, 5).map(t => (
                                <li key={t.id} className="flex justify-between items-center text-xs border-b last:border-0 pb-1 last:pb-0">
                                  <div>
                                    <span className={`font-medium ${t.type === 'setoran' ? 'text-green-600' : 'text-red-600'}`}>
                                      {t.type === 'setoran' ? 'Setoran' : 'Penarikan'}
                                    </span>
                                    <span className="text-gray-400 ml-2">{t.date}</span>
                                  </div>
                                   <span className="font-semibold text-gray-700">Rp {(t.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-400">Belum ada riwayat transaksi.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-500">Belum ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Transactions List (Moved from Dashboard) */}
      <Card className="overflow-hidden p-0 border-0 shadow-sm ring-1 ring-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-800">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-y-auto max-h-[400px]">
          <ul className="divide-y divide-gray-100 text-sm">
            {transactions.slice(0, 10).map((trx) => {
              const member = members.find(m => m.id === trx.member_id);
              return (
                <li key={trx.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${trx.type === 'setoran' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{member?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 font-medium  mt-0.5">{trx.type} • {trx.date}</p>
                    </div>
                  </div>
                  <div className={`font-bold text-base ${trx.type === 'setoran' ? 'text-green-600' : 'text-red-600'}`}>
                    {trx.type === 'setoran' ? '+' : '-'} Rp {(trx.amount || 0).toLocaleString('id-ID')}
                  </div>
                </li>
              );})}
            {transactions.length === 0 && (
              <li className="px-6 py-12 text-center text-gray-400 font-medium italic">
                Belum ada riwayat transaksi terbaru
              </li>
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
};


