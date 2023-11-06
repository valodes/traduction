import { newWord } from "../utils/word";

async function test(): Promise<void> {
    const chapterText: string = "This is a test for the newWord function" + "\n" + "This is a test for the newWord function;";
    const chunks: string[] = [chapterText];
    const translatedText = ["Ceci est un test"];
    const outputPath: string = `./Chapitre 1.docx`;

    await newWord(translatedText, chunks, outputPath);
}

export default test;