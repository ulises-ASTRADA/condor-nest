import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function discountReceipt(code: string, downloadedAt = new Date()) {
  if (!/^NIDO30-[A-F0-9]{12}$/.test(code)) throw new Error('Invalid discount code');
  const document = await PDFDocument.create();
  document.setTitle('Condor Nest - Comprobante de descuento');
  document.setAuthor('Condor Nest');
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const mono = await document.embedFont(StandardFonts.CourierBold);
  const page = document.addPage([595.28, 700]);
  const ink = rgb(.08, .09, .12);
  const muted = rgb(.35, .38, .43);
  const line = (text: string, y: number, size = 12, strong = false) => page.drawText(text, { x: 44, y, size, font: strong ? bold : regular, color: ink });
  page.drawRectangle({ x: 0, y: 602, width: 595.28, height: 98, color: ink });
  page.drawText('CONDOR NEST', { x: 44, y: 645, size: 23, font: bold, color: rgb(.77, 1, .18) });
  line('Comprobante de descuento', 556, 24, true);
  line('Gracias por ayudarnos a mejorar.', 522, 13);
  page.drawRectangle({ x: 44, y: 342, width: 507, height: 140, color: rgb(.95, .98, .89) });
  line('30% DE DESCUENTO', 446, 25, true);
  line('En tu próximo evento destacado en Condor Nest.', 415);
  page.drawText(code, { x: 60, y: 372, size: 21, font: mono, color: ink });
  line('Cómo usarlo', 300, 15, true);
  line('1. Completá el formulario en condor-nest.lat/destacar.', 272);
  line('2. Ingresá el código con el mismo email de tu invitación.', 248);
  line('3. Aplicá el código para ver el precio con el descuento.', 224);
  line('Condiciones', 178, 15, true);
  line('Válido para un solo uso. Sujeto a validación del código.', 151);
  line('Este comprobante no es una factura ni acredita un pago.', 129);
  const date = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'long' }).format(downloadedAt);
  page.drawText(`Descargado el ${date}`, { x: 44, y: 65, size: 10, font: regular, color: muted });
  page.drawText('condor-nest.lat', { x: 44, y: 45, size: 10, font: bold, color: muted });
  return document.save();
}
