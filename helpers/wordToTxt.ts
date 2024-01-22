import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import * as officeparser from 'officeparser';

async function convertWordToTxt(startChapter: number, endChapter: number) {
    const sourceFolder = path.join(__dirname, '../translation', 'Chapitre FR');
    const outputFolder = path.join(__dirname, 'Chapitre X to Z');

    // Create output folder if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const zip = archiver('zip',
        {
            zlib: { level: 9 }
        });

    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
        const chapterFolder = path.join(outputFolder, `Chapitre ${chapter}`);
        const chapterFile = path.join(chapterFolder, 'chapter-content.txt');

        // Create chapter folder if it doesn't exist
        if (!fs.existsSync(chapterFolder)) {
            fs.mkdirSync(chapterFolder);
        }

        // Read Word document
        const wordFile = path.join(sourceFolder, `Chapitre ${chapter}.docx`);
        const data = fs.readFileSync(wordFile);
        const parsedData = await officeparser.parseOfficeAsync(data,
            {
                newlineDelimiter: '\n\n',
            }
        );

        // Write text to output file
        fs.writeFileSync(chapterFile, parsedData);

        // Add output file to ZIP
        zip.file(chapterFile, { name: `Chapitre ${chapter}/chapter-content.txt` });
    }

    // Save ZIP file
    const zipFile = fs.createWriteStream(path.join(outputFolder, `../Chapitre ${startChapter} to ${endChapter}.zip`));
    zip.pipe(zipFile);
    await zip.finalize();

    // Delete the Chapitre X to Z folder
    fs.rmdirSync(outputFolder, { recursive: true });

    console.log('Conversion completed successfully.');
}

export default convertWordToTxt;
