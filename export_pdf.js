import fs from 'fs';
import PDFDocument from 'pdfkit';

const inPath = 'DEMO_HANDOUT.md';
const outPath = 'DEMO_HANDOUT.pdf';

if (!fs.existsSync(inPath)) {
  console.error('Missing', inPath);
  process.exit(1);
}

const md = fs.readFileSync(inPath, 'utf8');
const doc = new PDFDocument({ size: 'A4', margin: 50 });
const out = fs.createWriteStream(outPath);
doc.pipe(out);

function writeWrapped(text, options = {}) {
  const { indent = 0, fontSize = 11, lineGap = 4 } = options;
  doc.fontSize(fontSize);
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right - indent;
  const lines = doc.splitTextToSize(text, width);
  for (const line of lines) {
    doc.text(line, { continued: false, indent });
  }
  doc.moveDown(0.5);
}

const lines = md.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trimEnd();
  if (!line) {
    doc.moveDown(0.5);
    continue;
  }

  // Heading (line wrapped in **...**)
  if (line.startsWith('**') && line.endsWith('**')) {
    const title = line.replace(/^\*\*|\*\*$/g, '').trim();
    doc.font('Helvetica-Bold');
    doc.fontSize(18);
    doc.text(title);
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.fontSize(11);
    continue;
  }

  // Bullet list
  if (line.startsWith('- ')) {
    const content = line.slice(2).trim();
    if (content.startsWith('**')) {
      // bold keyword like - **Purpose:** ...
      const m = content.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
      if (m) {
        const key = m[1];
        const rest = m[2];
        doc.font('Helvetica-Bold');
        doc.text('\u2022 ' + key + ': ', { continued: true });
        doc.font('Helvetica');
        writeWrapped(rest, { indent: 14, fontSize: 11 });
        continue;
      }
    }
    // plain bullet
    doc.text('\u2022 ' + content);
    continue;
  }

  // Sub-bullets (two spaces then - )
  if (line.startsWith('  - ')) {
    const content = line.slice(4).trim();
    doc.text('   \u2022 ' + content);
    continue;
  }

  // Regular paragraph
  writeWrapped(line);
}

doc.end();

out.on('finish', () => {
  console.log('Wrote', outPath);
});
