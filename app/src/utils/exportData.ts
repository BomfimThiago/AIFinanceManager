// src/utils/exportData.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import { Expense } from '../types';
import { formatCurrency, formatDate } from './formatters';

interface ExportOptions {
  expenses: Expense[];
  filename: string;
  dateRange?: { start: Date; end: Date };
  totals?: { usd: number; eur: number; brl: number; count: number };
}

// Generate Excel file
export async function exportToExcel({ expenses, filename, dateRange, totals }: ExportOptions): Promise<void> {
  // Prepare data rows
  const data = expenses.map((exp) => ({
    'Descripción': exp.description,
    'Categoría': exp.category,
    'Fecha': formatDate(exp.expenseDate),
    'Moneda Original': exp.currency,
    'Monto Original': Number(exp.amount),
    'USD': exp.amountUsd != null ? Number(exp.amountUsd) : '',
    'EUR': exp.amountEur != null ? Number(exp.amountEur) : '',
    'BRL': exp.amountBrl != null ? Number(exp.amountBrl) : '',
  }));

  // Add totals row if provided
  if (totals) {
    data.push({
      'Descripción': 'TOTAL',
      'Categoría': '',
      'Fecha': '',
      'Moneda Original': '',
      'Monto Original': '' as any,
      'USD': totals.usd,
      'EUR': totals.eur,
      'BRL': totals.brl,
    });
  }

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos');

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Descripción
    { wch: 15 }, // Categoría
    { wch: 12 }, // Fecha
    { wch: 15 }, // Moneda Original
    { wch: 15 }, // Monto Original
    { wch: 12 }, // USD
    { wch: 12 }, // EUR
    { wch: 12 }, // BRL
  ];

  // Generate file
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  if (Platform.OS === 'web') {
    // For web, download directly
    const blob = base64ToBlob(wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // For native, save and share
    const fileUri = `${FileSystem.cacheDirectory}${filename}.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar Gastos',
    });
  }
}

// Generate PDF file
export async function exportToPDF({ expenses, filename, dateRange, totals }: ExportOptions): Promise<void> {
  const dateRangeText = dateRange
    ? `${formatDate(dateRange.start.toISOString())} - ${formatDate(dateRange.end.toISOString())}`
    : 'Todos los gastos';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Gastos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1f2937;
          }
          .header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #7C3AED;
          }
          .header h1 {
            color: #7C3AED;
            font-size: 28px;
            margin-bottom: 8px;
          }
          .header .date-range {
            color: #6b7280;
            font-size: 14px;
          }
          .summary {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          .summary-card {
            background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            min-width: 150px;
          }
          .summary-card .label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 4px;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #f3e8ff;
            color: #7C3AED;
            padding: 14px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          th:nth-child(n+4) { text-align: right; }
          td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          td:nth-child(n+4) { text-align: right; font-family: monospace; }
          tr:nth-child(even) { background: #fafafa; }
          tr:hover { background: #f3e8ff; }
          .category-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            background: #e5e7eb;
            font-size: 11px;
            font-weight: 500;
          }
          .total-row {
            font-weight: 700;
            background: #f3e8ff !important;
          }
          .total-row td {
            border-top: 2px solid #7C3AED;
            color: #7C3AED;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 11px;
            text-align: center;
          }
          .primary { color: #7C3AED; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Gastos</h1>
          <div class="date-range">${dateRangeText}</div>
        </div>

        ${totals ? `
        <div class="summary">
          <div class="summary-card">
            <div class="label">Total USD</div>
            <div class="value">${formatCurrency(totals.usd, 'USD')}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total EUR</div>
            <div class="value">${formatCurrency(totals.eur, 'EUR')}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total BRL</div>
            <div class="value">${formatCurrency(totals.brl, 'BRL')}</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <div class="label">Transacciones</div>
            <div class="value">${totals.count}</div>
          </div>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>USD</th>
              <th>EUR</th>
              <th>BRL</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((exp) => `
              <tr>
                <td>${escapeHtml(exp.description)}</td>
                <td><span class="category-badge">${escapeHtml(exp.category)}</span></td>
                <td>${formatDate(exp.expenseDate)}</td>
                <td class="${exp.currency === 'USD' ? 'primary' : ''}">${exp.amountUsd != null ? formatCurrency(exp.amountUsd, 'USD') : '-'}</td>
                <td class="${exp.currency === 'EUR' ? 'primary' : ''}">${exp.amountEur != null ? formatCurrency(exp.amountEur, 'EUR') : '-'}</td>
                <td class="${exp.currency === 'BRL' ? 'primary' : ''}">${exp.amountBrl != null ? formatCurrency(exp.amountBrl, 'BRL') : '-'}</td>
              </tr>
            `).join('')}
            ${totals ? `
            <tr class="total-row">
              <td>TOTAL</td>
              <td></td>
              <td></td>
              <td>${formatCurrency(totals.usd, 'USD')}</td>
              <td>${formatCurrency(totals.eur, 'EUR')}</td>
              <td>${formatCurrency(totals.brl, 'BRL')}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="footer">
          Generado el ${new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} • Konta Finance Manager
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    // For web, open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  } else {
    // For native, generate PDF and share
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar Gastos',
    });
  }
}

// Helper functions
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
