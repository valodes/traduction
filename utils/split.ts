import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export default async function splitText(text: string, limit: number = 1450): Promise<string[]> {

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: limit,
        chunkOverlap: 1,
    });

    const output = await splitter.createDocuments([text]);

    const result: string[] = [];

    for (const document of output) {
        result.push(document.pageContent);
    }

    return result;
}