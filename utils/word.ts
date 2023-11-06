import { Document, Packer, Paragraph, Styles, TextRun, ThematicBreak } from 'docx';
import * as fs from 'fs';

async function createWord(text: string[], outputPath: string): Promise<void> {

    const textWordBreak: TextRun[] = text.join('\n').split('\n').map(line => new TextRun({
        text: line,
        break: 1,
    }));

    const doc: Document = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Georgia",
                    name: "Georgia",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 24,
                        font: "Georgia",
                        color: "#000000",
                    },
                },
            ],
        },
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: textWordBreak, // TextRun[]
                    style: "Georgia",
                }),
            ],
        }],
    });

    await Packer.toBuffer(doc).then((buffer: Buffer) => {
        fs.writeFileSync(outputPath, buffer, {
            encoding: 'utf-8',
            flag: 'wx',
        });
    });

}

async function newWord(text1: string[], text2: string[], outputPath: string): Promise<void> {

    text2 = text2.join('\n').split('\n');

    // Create a paragraph style
    const styles = new Styles({
        paragraphStyles: [
            {
                id: "Georgia",
                name: "Georgia",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 24,
                    font: "Georgia",
                },
            },
            {
                id: "OriginalText",
                name: "OriginalText",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 24,
                    font: "Georgia",
                    color: "cbcbca",
                    italics: true,
                },
            },
        ],
    });

    //For each line of text, create a paragraph with two runs
    const textWordBreakParagraph: Paragraph[] = text1.join('\n').split('\n').map((line, index) => 
        new Paragraph({
            children: [
                new TextRun({
                    text: line,
                    style: "Georgia",
                }),
                new TextRun({
                    text: text2[index],
                    italics: true,
                    color: "cbcbca",
                    break: 1,
                    style: "OriginalText",
                }),
            ],
        })
    );

    // Delete every break non followed by a text
    

    const doc: Document = new Document({
        sections: [{
            properties: {

            },
            children: textWordBreakParagraph,
        }],
    });

    const buffer: Buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer, {
        encoding: 'utf-8',
        flag: 'wx',
    });
}

export { createWord, newWord };