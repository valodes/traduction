import { input } from '@inquirer/prompts';
import select, { Separator } from '@inquirer/select';
import main from './translate';
import Queue from 'queue-promise';
import test from './tests/words';

const validateNumber = (value: string) => !isNaN(parseInt(value)) || 'Please enter a number';

const handleSingleChapter = async (action: string) => {
    const chapterNumber = await input({
        message: `Which chapter do you want to ${action}?`,
        validate: validateNumber,
    });
    action === 'translate' ? main(chapterNumber) : console.log(`You want to download chapter ${chapterNumber}`);
};

// This code asks the user for a range of chapters to translate.
// It then creates a queue of tasks to translate each chapter.
// It also handles the success event to notify the user that each chapter is translated.
const handleRangeOfChapters = async (action: string) => {
    const startChapter = await input({ message: `Which chapter do you want to ${action} first?`, validate: validateNumber });
    const endChapter = await input({ message: `Which chapter do you want to ${action} last?`, validate: validateNumber });

    if (action === 'translate') {
        const queue = new Queue({ concurrent: 1, interval: 1000, start: true });
        for (let i = parseInt(startChapter); i <= parseInt(endChapter); i++) {
            queue.enqueue(() => main(i.toString()));
        }
        queue.on('success', (result) => console.log(`Chapter ${result} is translated.`));
    } else {
        console.log(`You want to download chapters from ${startChapter} to ${endChapter}`);
    }
};

(async () => {
    const answers = await select({
        message: 'What do you want to do?',
        choices: [
            { name: 'Translate a chapter', value: 'translateChapter' },
            { name: 'Translate a range of chapters', value: 'translateRangeOfChapters' },
            new Separator(),
            { name: 'Download chapters', value: 'downloadChapters' },
            { name: 'Download all chapters', value: 'downloadAllChapters' },
            { name: 'Download a range of chapters', value: 'downloadRangeOfChapters' },
            new Separator(),
            { name: 'Test', value: 'test' },
        ],
    });

    const singleChapterActions = ['translateChapter', 'downloadChapters'];
    const rangeChapterActions = ['translateRangeOfChapters', 'downloadRangeOfChapters'];

    if (singleChapterActions.includes(answers)) {
        await handleSingleChapter(answers === 'translateChapter' ? 'translate' : 'download');
    }

    if (rangeChapterActions.includes(answers)) {
        await handleRangeOfChapters(answers === 'translateRangeOfChapters' ? 'translate' : 'download');
    }

    /*make the test function
    if (answers === 'test') {
        await markdownIt(['# markdown-it rulezz!'], './test.md');
    }*/
})();