import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';

async function newWord(text1: string[], textTranslated: string[], outputPath: string): Promise<void> {

    // Créer un tableau de Paragraphs en combinant text1 et text2
    const paragraphs = text1.flatMap((text, index) => [
        new Paragraph({
            children: [new TextRun({ text, size: 24, font: "Georgia" })],
        }),
        new Paragraph({
            children: [new TextRun({ text: textTranslated[index], size: 24, font: "Georgia", color: "cbcbca" })],
        }),
        new Paragraph({}), // Saut de ligne
    ]);

    // Créer le document avec les paragraphes
    const doc = new Document({
        sections: [{ children: paragraphs }],
    });

    // Sauvegarder le document
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}

export { newWord };