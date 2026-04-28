import { Injectable, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';

// ── Design tokens ──────────────────────────────────────────
const C = {
  navy:    '#0D1117',
  brand:   '#2563EB',
  text:    '#0F172A',
  muted:   '#64748B',
  subtle:  '#94A3B8',
  border:  '#E2E8F0',
  bg:      '#F8FAFC',
  white:   '#FFFFFF',
  success: '#059669',
};
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD    = 'Helvetica-Bold';
const PAGE_L = 48;   // left margin
const PAGE_R = 547;  // right edge

@Injectable()
export class QuotePdfService {
  constructor(private prisma: PrismaService) {}

  async generate(id: string): Promise<Buffer> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { client: true, items: true },
    });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');

    const company = {
      name:    process.env.COMPANY_NAME    || 'JSN Pintura Eletrostática',
      phone:   process.env.COMPANY_PHONE   || '',
      email:   process.env.COMPANY_EMAIL   || '',
      website: process.env.COMPANY_WEBSITE || '',
      address: process.env.COMPANY_ADDRESS || '',
    };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;   // 595
      const H = doc.page.height;  // 842

      // ── Header bar ────────────────────────────────────────
      doc.rect(0, 0, W, 72).fill(C.navy);

      // Company name (white, left)
      doc.font(FONT_BOLD).fontSize(15).fillColor(C.white);
      doc.text(company.name, PAGE_L, 22, { width: 280 });

      // "ORÇAMENTO" label (right)
      doc.font(FONT_BOLD).fontSize(10).fillColor('rgba(255,255,255,0.5)');
      doc.text('ORÇAMENTO', 0, 18, { align: 'right', width: W - PAGE_L });
      doc.font(FONT_BOLD).fontSize(22).fillColor(C.white);
      doc.text(`#${String(quote.number).padStart(5, '0')}`, 0, 30, { align: 'right', width: W - PAGE_L });

      // ── Accent line ───────────────────────────────────────
      doc.rect(0, 72, W, 3).fill(C.brand);

      let y = 95;

      // ── Meta row (data + validade + status) ───────────────
      const metaY = y;
      const col   = (W - PAGE_L * 2) / 3;

      function metaBlock(label: string, value: string, x: number) {
        doc.font(FONT_REGULAR).fontSize(7).fillColor(C.subtle);
        doc.text(label.toUpperCase(), x, metaY, { width: col });
        doc.font(FONT_BOLD).fontSize(10).fillColor(C.text);
        doc.text(value, x, metaY + 11, { width: col });
      }

      metaBlock('Emitido em',  quote.issuedAt.toLocaleDateString('pt-BR'), PAGE_L);
      metaBlock('Válido até',  quote.validUntil ? quote.validUntil.toLocaleDateString('pt-BR') : '—', PAGE_L + col);

      // Status badge area
      const statusLabel = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado' }[String(quote.status)] || quote.status;
      const statusColor = { PENDING: '#D97706', APPROVED: C.success, REJECTED: '#DC2626' }[String(quote.status)] || C.muted;
      doc.roundedRect(PAGE_L + col * 2, metaY + 6, 72, 18, 4).fill(statusColor + '18');
      doc.font(FONT_BOLD).fontSize(8).fillColor(statusColor);
      doc.text(statusLabel, PAGE_L + col * 2 + 4, metaY + 11, { width: 64, align: 'center' });

      y = metaY + 44;

      // ── Divider ───────────────────────────────────────────
      doc.moveTo(PAGE_L, y).lineTo(PAGE_R, y).lineWidth(0.5).strokeColor(C.border).stroke();
      y += 18;

      // ── Client info ───────────────────────────────────────
      doc.font(FONT_BOLD).fontSize(7).fillColor(C.subtle);
      doc.text('CLIENTE', PAGE_L, y);
      y += 13;

      doc.font(FONT_BOLD).fontSize(12).fillColor(C.text);
      doc.text(quote.client.name, PAGE_L, y);
      y += 16;

      doc.font(FONT_REGULAR).fontSize(9).fillColor(C.muted);
      const clientDetails: string[] = [];
      if (quote.client.document) clientDetails.push(quote.client.document);
      if (quote.client.phone)    clientDetails.push(quote.client.phone);
      if (quote.client.email)    clientDetails.push(quote.client.email);
      const addrParts = [quote.client.address, quote.client.city, quote.client.state].filter(Boolean);
      if (addrParts.length) clientDetails.push(addrParts.join(', '));

      clientDetails.forEach((d) => {
        doc.text(d, PAGE_L, y); y += 13;
      });

      y += 12;

      // ── Items table ───────────────────────────────────────
      // Header
      const col1 = PAGE_L;
      const col2 = col1 + 260;
      const col3 = col2 + 60;
      const col4 = col3 + 80;
      const col5 = col4 + 80;   // = ~530

      doc.rect(PAGE_L, y, PAGE_R - PAGE_L, 22).fill(C.bg);
      doc.font(FONT_BOLD).fontSize(7).fillColor(C.subtle);
      doc.text('DESCRIÇÃO',    col1 + 4, y + 7, { width: 256 });
      doc.text('QTD',          col2,     y + 7, { width: 56,  align: 'right' });
      doc.text('VLR UNIT.',    col3,     y + 7, { width: 76,  align: 'right' });
      doc.text('TOTAL',        col4,     y + 7, { width: 76,  align: 'right' });
      y += 22;

      // Rows
      let rowBg = false;
      for (const it of quote.items) {
        const rowH = Math.max(doc.heightOfString(it.description, { width: 250 }) + 14, 26);
        if (rowBg) doc.rect(PAGE_L, y, PAGE_R - PAGE_L, rowH).fill('#FAFBFC');
        rowBg = !rowBg;

        doc.font(FONT_REGULAR).fontSize(9).fillColor(C.text);
        doc.text(it.description, col1 + 4, y + 7, { width: 250 });
        doc.text(String(Number(it.quantity)),     col2, y + 7, { width: 56, align: 'right' });
        doc.text(brl(Number(it.unitPrice)),  col3, y + 7, { width: 76, align: 'right' });
        doc.font(FONT_BOLD);
        doc.text(brl(Number(it.totalPrice)), col4, y + 7, { width: 76, align: 'right' });

        y += rowH;
        if (y > H - 160) {
          doc.addPage({ margin: 0, size: 'A4' });
          // thin brand stripe on continuation pages
          doc.rect(0, 0, W, 3).fill(C.brand);
          y = 20;
        }
      }

      // ── Totals ────────────────────────────────────────────
      y += 4;
      doc.moveTo(PAGE_L, y).lineTo(PAGE_R, y).lineWidth(0.5).strokeColor(C.border).stroke();
      y += 12;

      function totalRow(label: string, value: string, bold = false, color = C.text) {
        doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(bold ? 11 : 9)
           .fillColor(color);
        doc.text(label, col3, y, { width: 76, align: 'right' });
        doc.text(value, col4, y, { width: 76, align: 'right' });
        y += bold ? 20 : 15;
      }

      if (Number(quote.totalCost) > 0) {
        totalRow('Custo estimado', brl(Number(quote.totalCost)));
        totalRow('Margem', `${brl(Number(quote.margin))} (${Number(quote.marginPct).toFixed(1)}%)`, false, C.success);
        y += 4;
        doc.moveTo(col3, y).lineTo(PAGE_R, y).lineWidth(0.3).strokeColor(C.border).stroke();
        y += 8;
      }
      totalRow('TOTAL', brl(Number(quote.totalValue)), true, C.brand);

      // ── Notes ─────────────────────────────────────────────
      if (quote.notes) {
        y += 8;
        doc.moveTo(PAGE_L, y).lineTo(PAGE_R, y).lineWidth(0.5).strokeColor(C.border).stroke();
        y += 14;
        doc.font(FONT_BOLD).fontSize(8).fillColor(C.subtle);
        doc.text('OBSERVAÇÕES', PAGE_L, y);
        y += 12;
        doc.font(FONT_REGULAR).fontSize(9).fillColor(C.muted);
        doc.text(quote.notes, PAGE_L, y, { width: PAGE_R - PAGE_L });
        y += doc.heightOfString(quote.notes, { width: PAGE_R - PAGE_L }) + 8;
      }

      // ── Footer (on last page) ──────────────────────────────
      doc.rect(0, H - 48, W, 48).fill(C.bg);
      doc.moveTo(0, H - 48).lineTo(W, H - 48).lineWidth(0.5).strokeColor(C.border).stroke();

      const footerParts: string[] = [company.name];
      if (company.phone)   footerParts.push(company.phone);
      if (company.email)   footerParts.push(company.email);
      if (company.website) footerParts.push(company.website);
      if (company.address) footerParts.push(company.address);

      doc.font(FONT_REGULAR).fontSize(8).fillColor(C.subtle);
      doc.text(footerParts.join('  ·  '), PAGE_L, H - 33, { width: W - PAGE_L * 2, align: 'center' });

      doc.end();
    });
  }
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
