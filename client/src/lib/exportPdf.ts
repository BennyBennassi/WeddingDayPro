import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatTimeTo24h, formatTimeTo12h } from './helpers';

export function usePdfExport() {
  const generatePdf = (timeline: any, events: any[]) => {
    // Initialize PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(212, 138, 110); // Primary color
    doc.text('Wedding Day Timeline', 105, 15, { align: 'center' });
    
    // Add wedding date
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    const formattedDate = new Date(timeline.weddingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Wedding Date: ${formattedDate}`, 105, 25, { align: 'center' });
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    // Format times based on timeline settings
    const formatTime = (time: string) => {
      return timeline.timeFormat === '24h' ? formatTimeTo24h(time) : formatTimeTo12h(time);
    };
    
    // Prepare data for table
    const tableData = sortedEvents.map(event => [
      `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`,
      event.name,
      event.category.charAt(0).toUpperCase() + event.category.slice(1),
      event.notes || ''
    ]);
    
    // Add table
    (doc as any).autoTable({
      startY: 35,
      head: [['Time', 'Block of Time', 'Category', 'Notes']],
      body: tableData,
      headStyles: {
        fillColor: [212, 138, 110],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 70 }
      }
    });
    
    // Add venue restrictions if they exist
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (timeline.venueRestrictions) {
      doc.setFontSize(14);
      doc.setTextColor(228, 126, 37); // Warning color
      doc.text('Venue Restrictions', 20, yPos);
      
      doc.setFontSize(10);
      doc.setTextColor(33, 37, 41);
      let currentY = yPos + 10;
      
      if (timeline.venueRestrictions.musicEndTime) {
        doc.text(`• Music must end by ${formatTime(timeline.venueRestrictions.musicEndTime)}`, 25, currentY);
        currentY += 7;
      }
      
      if (timeline.venueRestrictions.ceremonyStartTime) {
        doc.text(`• Ceremony can't start before ${formatTime(timeline.venueRestrictions.ceremonyStartTime)}`, 25, currentY);
        currentY += 7;
      }
      
      if (timeline.venueRestrictions.dinnerStartTime) {
        doc.text(`• Dinner must start by ${formatTime(timeline.venueRestrictions.dinnerStartTime)}`, 25, currentY);
        currentY += 7;
      }
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Wedding Timeline Planner', 20, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
    }
    
    // Save the PDF
    doc.save('wedding_timeline.pdf');
  };
  
  return { generatePdf };
}
