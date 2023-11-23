import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    });
    const page = await browser.newPage();

    page.setViewport({ width: 390, height: 844 });
    await page.setRequestInterception(true);

    page.on('request', (req: puppeteer.HTTPRequest) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });

    await page.goto('https://rainbow-reads.com/gl-index/');

    const links: string[] = await page.evaluate(() => {
        const postContentDivs = document.querySelectorAll('.post-content');
        const linkElements = document.querySelectorAll('.post-content a');
        const links: string[] = [];

        const regex = /\/gl-index\/gl-chapter-\d+/;

        linkElements.forEach((linkElement) => {
            const href = linkElement.getAttribute('href');

            if (regex.test(href?.toString() || '')) {
                links.push(href?.toString() || '');
            }
        });

        return links;
    });

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        await page.goto(`${link}`);

        const text: string | undefined = await page.evaluate(() => {
            const postContentDiv: HTMLDivElement | null = document.querySelector('.post-content');
            const text = postContentDiv?.innerText.trim();
            return text;
        });

        const dir = './Chapitre';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        const filePath = `${dir}/Chapitre${i + 1}.txt`;
        fs.writeFileSync(filePath, text?.toString() || '');
    }

    await browser.close();
})();