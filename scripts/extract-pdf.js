// Script para extrair texto de PDF usando pdfjs-dist
// Uso: node scripts/extract-pdf.js <caminho-do-pdf>
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Uso: node scripts/extract-pdf.js <caminho-do-pdf>');
    process.exit(1);
  }

  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buffer = fs.readFileSync(path.resolve(pdfPath));
  const uint8Array = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDocument = await loadingTask.promise;

  console.error(`=== TOTAL DE PÁGINAS: ${pdfDocument.numPages}`);

  const allText = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    allText.push(pageText);
    if (pageNum % 10 === 0) {
      console.error(`  processadas ${pageNum}/${pdfDocument.numPages} páginas...`);
    }
  }

  const raw = allText.join('\n');
  const cleaned = raw
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  console.error(`=== TOTAL DE CHARS: ${cleaned.length}`);
  // Saída principal só com o texto (stdout)
  process.stdout.write(cleaned);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
