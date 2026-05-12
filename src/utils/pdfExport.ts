import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import logoUrl from '../assets/logo.png';

interface ExportPDFOptions {
  title: string;
  filename: string;
  columns: string[];
  data: any[][];
  orientation?: 'portrait' | 'landscape';
  columnStyles?: UserOptions['columnStyles'];
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
  columnStyles
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
    
    // 3. Draw Header Layout
    const logoSize = 28;
    doc.addImage(img, 'PNG', margin.left, margin.top, logoSize, logoSize);
    
    // Title "SIMANTAB"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(139, 0, 0); // Dark Red
    doc.text("SIMANTAB", margin.left + logoSize + 10, margin.top + 12);
    
    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Sistem Manajemen Informasi Anggota MB Chondro", margin.left + logoSize + 10, margin.top + 24);

    // Date
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const dateText = `Tanggal dibuat: ${today}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin.right - dateWidth, margin.top + 12);

    // Separator Line
    const lineY = margin.top + logoSize + 12;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(margin.left, lineY, pageWidth - margin.right, lineY);

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(title.toUpperCase(), margin.left, lineY + 20);

    // 4. Draw Table
    autoTable(doc, {
      startY: lineY + 30,
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
