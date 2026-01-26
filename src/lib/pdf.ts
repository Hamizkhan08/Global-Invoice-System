import { Invoice } from '@/types/invoice';

export async function generatePDF(invoice: Invoice): Promise<void> {
  // Dynamically import html2pdf to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;
  
  const element = document.getElementById('invoice-template');
  
  if (!element) {
    throw new Error('Invoice template not found');
  }

  const invoiceNumber = invoice.invoice_number?.toString().padStart(4, '0') || 'draft';
  // Sanitize customer name for filename (remove special chars, replace spaces with underscore)
  const customerName = invoice.customer_name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30); // Limit length
  const filename = `${customerName}_invoice_${invoiceNumber}.pdf`;

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'portrait' as const 
    },
  };

  // Generate PDF blob and manually trigger download with correct filename
  const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
  
  // Create download link and trigger download
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generatePDFBlob(invoice: Invoice): Promise<{blob: Blob, filename: string}> {
  const html2pdf = (await import('html2pdf.js')).default;
  
  const element = document.getElementById('invoice-template');
  
  if (!element) {
    throw new Error('Invoice template not found');
  }

  const invoiceNumber = invoice.invoice_number?.toString().padStart(4, '0') || 'draft';
  // Sanitize customer name for filename (remove special chars, replace spaces with underscore)
  const customerName = invoice.customer_name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30); // Limit length
  const filename = `${customerName}_invoice_${invoiceNumber}.pdf`;

  const opt = {
    margin: 0,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'portrait' as const 
    },
  };

  const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
  return { blob, filename };
}

// Share PDF via WhatsApp
export async function sharePDFOnWhatsApp(invoice: Invoice): Promise<boolean> {
  try {
    const { blob, filename } = await generatePDFBlob(invoice);
    
    // Detect if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create a File object from the blob
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    // Only use Web Share API on mobile (not desktop - it opens wrong apps like Outlook)
    if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Invoice #${invoice.invoice_number?.toString().padStart(4, '0')}`,
        text: `Invoice from Global Tours & Travels - ₹${invoice.total_amount.toLocaleString('en-IN')}`,
      });
      return true;
    } else {
      // Desktop: Download PDF first
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Format customer phone for WhatsApp (add India country code if needed)
      let customerPhone = invoice.customer_phone.replace(/\D/g, ''); // Remove non-digits
      if (customerPhone.length === 10) {
        customerPhone = '91' + customerPhone; // Add India country code
      }
      
      // Create pre-filled message
      const message = `🚗 *Global Tours & Travels*

Invoice #${invoice.invoice_number?.toString().padStart(4, '0')}
📅 ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}

🚀 ${invoice.pickup_location} ➜ ${invoice.destination}
💰 Total: ₹${invoice.total_amount.toLocaleString('en-IN')}

Please find the invoice PDF attached.

Thank you for choosing Global Tours & Travels! 🙏
📞 Contact: 98815 98109`;

      // Open WhatsApp Web directly with customer's number and message
      window.open(`https://web.whatsapp.com/send?phone=${customerPhone}&text=${encodeURIComponent(message)}`, '_blank');
      return false; // Indicates PDF was downloaded separately
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    return false;
  }
}
