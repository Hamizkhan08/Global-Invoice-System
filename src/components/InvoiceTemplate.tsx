'use client';

import { Invoice } from '@/types/invoice';
import { forwardRef } from 'react';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return (
      <div ref={ref} className="invoice-template" id="invoice-template">
        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            <h1>Global Tours & Travels</h1>
            <p>📍 Sainath Nagar, Nashik</p>
            <p>📞 98815 98109</p>
          </div>
          <div className="invoice-details">
            <h2>INVOICE</h2>
            <p><strong>Invoice No:</strong> #{invoice.invoice_number?.toString().padStart(4, '0')}</p>
            <p><strong>Date:</strong> {formatDate(invoice.invoice_date)}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="section">
          <div className="section-title">Customer Details</div>
          <table>
            <tbody>
              <tr>
                <td style={{ width: '30%' }}><strong>Name</strong></td>
                <td>{invoice.customer_name}</td>
              </tr>
              <tr>
                <td><strong>Phone</strong></td>
                <td>{invoice.customer_phone}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Journey Details */}
        <div className="section">
          <div className="section-title">Journey Details</div>
          <table>
            <tbody>
              <tr>
                <td style={{ width: '30%' }}><strong>Pickup Location</strong></td>
                <td>{invoice.pickup_location}</td>
              </tr>
              <tr>
                <td><strong>Destination</strong></td>
                <td>{invoice.destination}</td>
              </tr>
              <tr>
                <td><strong>Journey Date</strong></td>
                <td>{formatDate(invoice.journey_date)}</td>
              </tr>
              <tr>
                <td><strong>Journey Type</strong></td>
                <td style={{ textTransform: 'capitalize' }}>
                  {invoice.journey_type.replace('-', ' ')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cab & Driver Details */}
        {(invoice.cab_number || invoice.driver_name) && (
          <div className="section">
            <div className="section-title">Cab & Driver Details</div>
            <table>
              <tbody>
                {invoice.cab_number && (
                  <tr>
                    <td style={{ width: '30%' }}><strong>Cab Number</strong></td>
                    <td>{invoice.cab_number}</td>
                  </tr>
                )}
                {invoice.cab_type && (
                  <tr>
                    <td><strong>Cab Type</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{invoice.cab_type}</td>
                  </tr>
                )}
                {invoice.driver_name && (
                  <tr>
                    <td><strong>Driver Name</strong></td>
                    <td>{invoice.driver_name}</td>
                  </tr>
                )}
                {invoice.driver_phone && (
                  <tr>
                    <td><strong>Driver Phone</strong></td>
                    <td>{invoice.driver_phone}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Fare Breakdown */}
        <div className="section">
          <div className="section-title">Fare Breakdown</div>
          <table className="fare-table">
            <tbody>
              <tr>
                <td>Fare Amount</td>
                <td>{formatCurrency(invoice.fare_amount)}</td>
              </tr>
              {invoice.toll_amount > 0 && (
                <tr>
                  <td>Toll Charges</td>
                  <td>{formatCurrency(invoice.toll_amount)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td>Total Amount</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.total_amount)}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: '10px', fontSize: '10pt', color: '#666' }}>
            <strong>Payment Mode:</strong> {invoice.payment_mode.toUpperCase()}
          </p>
        </div>

        {/* Footer */}
        <div className="footer">
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#333', marginBottom: '5px' }}>
            Thank you for travelling with us! 🙏
          </p>
          <p>We wish you a safe and pleasant journey.</p>
          <p style={{ marginTop: '10px' }}>
            <strong>Global Tours & Travels</strong> | Sainath Nagar, Nashik | 📞 98815 98109
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
