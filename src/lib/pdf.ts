import { Invoice } from '@/types/invoice';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to create proper filename
function createFilename(invoice: Invoice, extension: string = 'pdf'): string {
  const invoiceNumber = invoice.invoice_number?.toString().padStart(4, '0') || 'draft';
  // Sanitize customer name for filename (remove special chars, replace spaces with underscore)
  const customerName = invoice.customer_name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30); // Limit length
  return `${customerName}_invoice_${invoiceNumber}.${extension}`;
}

// Generate and download invoice as PDF (Manual html2canvas + jsPDF + FileSaver)
export async function generatePDF(invoice: Invoice): Promise<void> {
  const element = document.getElementById('invoice-template');
  
  if (!element) {
    throw new Error('Invoice template not found');
  }

  const filename = createFilename(invoice, 'pdf');

  try {
    // 1. Convert HTML to Canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      // Ensure element is visible during capture
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById('invoice-template');
        if (clonedElement) {
          clonedElement.style.visibility = 'visible';
          // Also check parent
          const parent = clonedElement.parentElement;
          if (parent) parent.style.visibility = 'visible';
        }
      }
    });

    // 2. Calculate dimensions to fit A4
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 3. Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // 4. Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // 5. Output as Blob and use FileSaver (Most robust method)
    const blob = pdf.output('blob');
    saveAs(blob, filename);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Failed to generate PDF. Please try again.');
    throw error;
  }
}

// Generate and download invoice as JPEG image
export async function generateImage(invoice: Invoice): Promise<void> {
  const element = document.getElementById('invoice-template');
  
  if (!element) {
    throw new Error('Invoice template not found');
  }

  const filename = createFilename(invoice, 'jpg');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById('invoice-template');
      if (clonedElement) {
        clonedElement.style.visibility = 'visible';
        const parent = clonedElement.parentElement;
        if (parent) parent.style.visibility = 'visible';
      }
    }
  });

  // Convert canvas to blob and use file-saver
  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, filename);
    }
  }, 'image/jpeg', 0.95);
}

// Generate PDF blob for sharing
export async function generatePDFBlob(invoice: Invoice): Promise<{blob: Blob, filename: string}> {
  const element = document.getElementById('invoice-template');
  
  if (!element) {
    throw new Error('Invoice template not found');
  }

  const filename = createFilename(invoice, 'pdf');

  // Same manual pipeline
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById('invoice-template');
      if (clonedElement) {
        clonedElement.style.visibility = 'visible';
        const parent = clonedElement.parentElement;
        if (parent) parent.style.visibility = 'visible';
      }
    }
  });

  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

  // Output as blob
  const pdfBlob = pdf.output('blob');
  
  return { blob: pdfBlob, filename };
}

// Share PDF via WhatsApp
export async function sharePDFOnWhatsApp(invoice: Invoice): Promise<boolean> {
  try {
    const { blob, filename } = await generatePDFBlob(invoice);
    
    // Detect if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create a File object from the blob
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    // Only use Web Share API on mobile
    if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Invoice #${invoice.invoice_number?.toString().padStart(4, '0')}`,
        text: `Invoice from Global Tours & Travels - ₹${invoice.total_amount.toLocaleString('en-IN')}`,
      });
      return true;
    } else {
      // Desktop: Download PDF first using file-saver
      saveAs(blob, filename);
      
      // Format customer phone for WhatsApp
      let customerPhone = invoice.customer_phone.replace(/\D/g, '');
      if (customerPhone.length === 10) {
        customerPhone = '91' + customerPhone;
      }
      
      const message = `🚗 *Global Tours & Travels*

Invoice #${invoice.invoice_number?.toString().padStart(4, '0')}
📅 ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}

🚀 ${invoice.pickup_location} ➜ ${invoice.destination}
💰 Total: ₹${invoice.total_amount.toLocaleString('en-IN')}

Please find the invoice PDF attached.

Thank you for choosing Global Tours & Travels! 🙏
📞 Contact: 98815 98109`;

      window.open(`https://web.whatsapp.com/send?phone=${customerPhone}&text=${encodeURIComponent(message)}`, '_blank');
      return false;
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    return false;
  }
}
