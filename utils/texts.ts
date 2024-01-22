import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function splitText(text: string, limit: number = 1450): Promise<string[]> {

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: limit,
        chunkOverlap: 1
    });

    const output = await splitter.createDocuments([text]);

    const result: string[] = [];

    for (const document of output) {
        result.push(document.pageContent);
    }

    return result;
}

function toTable(text: string): string[] {
    
    //We need to split the text at every line break, if a line break is alone in a paragraph, it will be removed
    const lines = text.split('\n');

    const result: string[] = [];

    for (const line of lines) {
        result.push(line);
    }

    //remove empty lines
    return result.filter(line => line !== "");
}

export { splitText, toTable };