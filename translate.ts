
import * as cliProgress from 'cli-progress';
import translate from './utils/deapl';
import * as fs from 'fs';
import splitText from './utils/split';
import { newWord, createWord } from './utils/word';
/*
async function translateChunks(chunks: string[], progressBar: cliProgress.SingleBar): Promise<string[]> {
    const translatedText: string[] = [];

    for (const chunk of chunks) {
        const translation = await translate(chunk, {
            targetLanguage: 'fr-FR',
            defaultDelay: 1000,
        });

        if (typeof translation === 'string') {
            translatedText.push(translation);
            progressBar.increment();
        }
    }

    return translatedText;
}*/

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
    const chapterFolder: string = './Chapitre';
    const chapterFiles: string[] = fs.readdirSync(chapterFolder);

    // Order is important here, we want to translate chapters in order
    chapterFiles.sort((a, b) => {
        const aNumber: RegExpMatchArray | null = a.match(/Chapitre(\d+)\.txt/);
        const bNumber: RegExpMatchArray | null = b.match(/Chapitre(\d+)\.txt/);

        var firstNumber: number = 0;
        var secondNumber: number = 0;

        if (aNumber)
            firstNumber = parseInt(aNumber[1]);

        if (bNumber)
            secondNumber = parseInt(bNumber[1]);

        return firstNumber - secondNumber;
    });

    // if a chapter number is specified, we only translate that chapter
    if (chapterNumber) {
        const chapterPath: string = `${chapterFolder}/Chapitre${chapterNumber}.txt`;
        console.log(`Queueing ${chapterPath} for translation...`);

        await translateChapter(chapterPath);
    }

    console.log('All chapters translated.');
}

export default main;