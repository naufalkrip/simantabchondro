import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import logoUrl from '../assets/logo.png';
import { getFinanceData } from '../services/financeService';
import { getMediaInventory } from '../services/mediaInventoryService';
import { getMediaAccounts } from '../services/mediaAccountService';

interface ExportPDFOptions {
  title: string;
  filename: string;
  columns: string[];
  data: any[][];
  orientation?: 'portrait' | 'landscape';
  columnStyles?: UserOptions['columnStyles'];
  foot?: any[][];
  subtitle?: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export const exportModernPDF = async ({
  title,
  filename,
  columns,
  data,
  orientation = 'portrait',
  columnStyles,
  foot,
  subtitle
}: ExportPDFOptions) => {
  // 1. Initialize Document
  const doc = new jsPDF({
    orientation,
    unit: 'px',
    format: 'a4'
  });

  const pageSize = doc.internal.pageSize;
  const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
  const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
  
  const margin = {
    top: 24,
    bottom: 24,
    left: 28,
    right: 28
  };

  try {
    // 2. Load Logo
    const img = await loadImage(logoUrl);
    
    // 3. Draw Header Layout (proportional based on natural aspect ratio)
    const logoHeight = 28;
    const logoWidth = logoHeight * (img.naturalWidth / img.naturalHeight);
    doc.addImage(img, 'PNG', margin.left, margin.top, logoWidth, logoHeight);
    
    // Title "SIMANTAB"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(139, 0, 0); // Dark Red
    doc.text("SIMANTAB", margin.left + logoWidth + 10, margin.top + 12);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Sistem Manajemen Informasi Anggota MB Chondro", margin.left + logoWidth + 10, margin.top + 24);

    // Date
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const dateText = `Tanggal dibuat: ${today}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin.right - dateWidth, margin.top + 12);

    // Separator Line
    const lineY = margin.top + logoHeight + 12;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(margin.left, lineY, pageWidth - margin.right, lineY);

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(title.toUpperCase(), margin.left, lineY + 20);

    // Period Subtitle
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, margin.left, lineY + 32);
    }

    // 4. Draw Table
    autoTable(doc, {
      startY: lineY + (subtitle ? 42 : 30),
      head: [columns],
      body: data,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 4,
        lineColor: [240, 240, 240],
        lineWidth: 0.5,
        textColor: [60, 60, 60]
      },
      headStyles: {
        fillColor: [139, 0, 0], // Dark Red (#8B0000)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252]
      },
      margin: { left: margin.left, right: margin.right, bottom: margin.bottom + 20 },
      columnStyles: columnStyles || {},
      foot: data.length > 0 && foot ? foot : undefined,
      footStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      
      // 5. Draw Footer
      didDrawPage: (hookData) => {
        const str = `SIMANTAB | Sistem Manajemen Informasi Anggota MB Chondro`;
        const pageStr = `Halaman ${hookData.pageNumber}`;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        
        const footerY = pageHeight - margin.bottom;
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.5);
        doc.line(margin.left, footerY - 10, pageWidth - margin.right, footerY - 10);
        
        doc.text(str, margin.left, footerY);
        const pageStrWidth = doc.getTextWidth(pageStr);
        doc.text(pageStr, pageWidth - margin.right - pageStrWidth, footerY);
      }
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
    
  } catch (err) {
    console.error("Error generating PDF:", err);
    throw err;
  }
};

export const exportFinancePDF = async (
  category: 'media' | 'pengurus',
  title: string,
  filename: string,
  startDate?: string,
  endDate?: string
) => {
  const allData = await getFinanceData(category);

  let filtered = allData;
  if (startDate) {
    filtered = filtered.filter(t => t.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(t => t.date <= endDate);
  }

  const rows = filtered.map(t => [
    new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
    t.description,
    `Rp ${t.amount.toLocaleString('id-ID')}`,
  ]);

  const totalPemasukan = filtered
    .filter(t => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPengeluaran = filtered
    .filter(t => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  const foot = [
    ['', '', 'TOTAL PEMASUKAN', `Rp ${totalPemasukan.toLocaleString('id-ID')}`],
    ['', '', 'TOTAL PENGELUARAN', `Rp ${totalPengeluaran.toLocaleString('id-ID')}`],
    ['', '', 'SALDO AKHIR', `Rp ${saldoAkhir.toLocaleString('id-ID')}`],
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const subtitle = startDate || endDate
    ? `Periode: ${startDate ? formatDate(startDate) : '…'} — ${endDate ? formatDate(endDate) : '…'}`
    : 'Semua Periode';

  await exportModernPDF({
    title,
    filename,
    subtitle,
    columns: ['Tanggal', 'Tipe', 'Deskripsi', 'Jumlah'],
    data: rows,
    foot,
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 80 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 90, halign: 'right' },
    }
  });
};

export const exportMediaInventoryPDF = async () => {
  const data = await getMediaInventory();
  const rows = data.map(i => [
    i.name,
    i.category,
    i.quantity.toString(),
    i.condition === 'bagus' ? 'Bagus' : 'Jelek / Rusak',
  ]);

  await exportModernPDF({
    title: 'Inventaris Media',
    filename: 'inventaris-media',
    columns: ['Nama Barang', 'Kategori', 'Jumlah', 'Kondisi'],
    data: rows,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 80 },
      2: { cellWidth: 60, halign: 'center' },
      3: { cellWidth: 80, halign: 'center' },
    }
  });
};

export const exportMediaAccountsPDF = async () => {
  const data = await getMediaAccounts();
  const rows = data.map(a => [
    a.platform,
    a.username,
    a.status === 'aktif' ? 'Aktif' : 'Nonaktif',
  ]);

  await exportModernPDF({
    title: 'Daftar Akun Media',
    filename: 'daftar-akun-media',
    columns: ['Platform', 'Username / Email', 'Status'],
    data: rows,
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 70, halign: 'center' },
    }
  });
};
