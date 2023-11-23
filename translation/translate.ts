
import * as cliProgress from 'cli-progress';
import translate from '../utils/deapl';
import * as fs from 'fs';
import splitText from '../utils/split';
import { newWord } from '../utils/word';

async function translateChapter(chapterPath: string): Promise<void> {

    const matches = chapterPath.match(/Chapitre(\d+)\.txt/);

    if (matches)
        var chapterNumber: number = parseInt(matches[1]);
    else
        return;

    const outputPath: string = `${__dirname}/Chapitre FR/Chapitre ${chapterNumber}.docx`;

    if (fs.existsSync(outputPath)) {
        console.log(`Chapter ${chapterNumber} is already translated.`);
        return;
    }

    const chapterText: string = fs.readFileSync(chapterPath, 'utf-8').trim();
    const chunks: string[] = await splitText(chapterText, 1500); // Votre fonction splitText

    const translatedText = await translate(chunks, {
        targetLanguage: 'fr-FR',
        defaultDelay: 1000,
    });

    //await createWord(translatedText, outputPath);
    await newWord(translatedText, chunks, outputPath);

    console.log(`Chapter ${chapterNumber} is translated.`);
}

async function main(chapterNumber?: string): Promise<void> {
    const chapterFolder = __dirname + '/Chapitre';
    const chapterFiles = fs.readdirSync(chapterFolder);

    // Filtrer et trier les fichiers de chapitre
    const sortedChapterFiles = chapterFiles
        .filter(file => file.startsWith('Chapitre') && file.endsWith('.txt'))
        .sort((a, b) => {
            const aNumber = parseInt(a.match(/\d+/)?.[0] || "0");
            const bNumber = parseInt(b.match(/\d+/)?.[0] || "0");
            return aNumber - bNumber;
        });

    // Traduire le chapitre spécifié ou tous les chapitres
    const chaptersToTranslate = chapterNumber
        ? sortedChapterFiles.filter(file => file.includes(`Chapitre${chapterNumber}`))
        : sortedChapterFiles;

    for (const file of chaptersToTranslate) {
        console.log(`Queueing ${chapterFolder}/${file} for translation...`);
        await translateChapter(`${chapterFolder}/${file}`);
    }

    console.log('All chapters translated.');
}

export default main;