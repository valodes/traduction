import translate from '../utils/deapl';
import { promises as fs } from 'fs';
import { splitText, toTable } from '../utils/texts';
import { newWord } from '../utils/word';

async function translateChapter(chapterPath: string): Promise<void> {

    const matches = chapterPath.match(/Chapitre(\d+)\.txt/);

    if (matches)
        var chapterNumber: number = parseInt(matches[1]);
    else
        return;

    const outputPath: string = `${__dirname}/Chapitre FR/Chapitre ${chapterNumber}.docx`;

    const chapterText: string = await fs.readFile(chapterPath, 'utf-8');
    const chunks: string[] = await splitText(chapterText, 1500); // Votre fonction splitText

    const translatedText = await translate(chunks, {
        targetLanguage: 'fr-FR',
        defaultDelay: 1000,
    });

    //await createWord(translatedText, outputPath);
    if (translatedText) {
        var inlineTranslation = translatedText.join('\n');
        await newWord(toTable(inlineTranslation) || '', toTable(chapterText), outputPath);
    }

    console.log(`Chapter ${chapterNumber} is translated.`);
}

async function main(chapterNumber?: string): Promise<void> {
    const chapterFolder = __dirname + '/Chapitre';

    // Lire le contenu du dossier de manière asynchrone
    const chapterFiles = await fs.readdir(chapterFolder);

    // Filtrer et trier les fichiers de chapitre
    const sortedChapterFiles = chapterFiles
        .filter(file => file.startsWith('Chapitre') && file.endsWith('.txt'))
        .sort((a, b) => {
            const aNumber = parseInt(a.match(/\d+/)?.[0] || "0");
            const bNumber = parseInt(b.match(/\d+/)?.[0] || "0");
            return aNumber - bNumber;
        });

    // Trouver le chapitre spécifié ou utiliser tous les chapitres
    const chaptersToTranslate = chapterNumber
        ? sortedChapterFiles.find(file => file.includes(`Chapitre${chapterNumber}`))
        : sortedChapterFiles;

    if (!chaptersToTranslate) {
        console.log('No chapters to translate.');
        return;
    }

    // Si un seul chapitre est spécifié, le convertir en tableau
    const chaptersArray = Array.isArray(chaptersToTranslate) ? chaptersToTranslate : [chaptersToTranslate];

    for (const file of chaptersArray) {
        const filePath = `${chapterFolder}/${file}`;
        console.log(`Queueing ${filePath} for translation...`);
        await translateChapter(filePath);
    }

    console.log('All chapters translated.');
}

export default main;