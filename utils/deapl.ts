/* eslint-disable no-await-in-loop */
import { Browser, Page, executablePath } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

type SourceLanguage = 'bg' | 'zh' | 'cs' | 'da' | 'nl'
    | 'en' | 'et' | 'fi' | 'fr' | 'de' | 'el'
    | 'hu' | 'id' | 'it' | 'ja' | 'lv' | 'lt'
    | 'pl' | 'pt' | 'ro' | 'ru' | 'sk' | 'sl'
    | 'es' | 'sv' | 'tr' | 'uk'
const TargetLanguageMap = {
    'bg-BG': 'bg',
    'zh-CN': 'zh',
    'cs-CZ': 'cs',
    'da-DK': 'da',
    'nl-NL': 'nl',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'et-ET': 'et',
    'fi-FI': 'fi',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'el-GR': 'el',
    'hu-HU': 'hu',
    'id-ID': 'id',
    'it-IT': 'it',
    'ja-JP': 'ja',
    'lv-LV': 'lv',
    'lt-LT': 'lt',
    'pl-PL': 'pl',
    'pt-PT': 'pt-PT',
    'pt-BR': 'pt-BR',
    'ro-RO': 'ro',
    'ru-RU': 'ru',
    'sk-SK': 'sk',
    'sl-SL': 'sl',
    'es-ES': 'es',
    'sv-SV': 'sv',
    'tr-TR': 'tr',
    'uk-UA': 'uk',
}

type TargetLanguage = keyof typeof TargetLanguageMap

export interface Options {
    sourceLanguage?: SourceLanguage,
    targetLanguage: TargetLanguage,
    formality?: 'formal' | 'informal',
    defaultDelay?: number,
}

let browserPromise: Promise<Browser> | undefined
const getBrowser = () => {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            executablePath: executablePath(),
            headless: false,
        })
    }
    return browserPromise
}

export async function kill() {
    if (!browserPromise) return
    const browser = await getBrowser()
    await browser.close()
}

const sleepMs = (ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms)
})
const hasSelector = (page: Page, selector: string) => page.evaluate(s =>
    !!document.querySelector(s), selector)

const selectors = {
    dialogDismiss: '[role=dialog] button[aria-label=Close]',
    cookieBannerDismiss: 'button[data-testid="cookie-banner-strict-accept-all"]',
    //translationActive: '.lmt:not(.lmt--active_translation_request)',
    translationActive: 'div[data-testid="translator-inline-loading-indicator"]',
    selectSourceLanguageButton: 'button[data-testid="translator-source-lang-btn"]',
    selectTargetLanguageButton: 'button[data-testid="translator-target-lang-btn"]',
    sourceLanguageOption: (language: SourceLanguage) => `[data-testid="translator-source-lang-list"] [data-testid="translator-lang-option-${language}"]`,
    targetLanguageOption: (language: TargetLanguage) => `[data-testid="translator-target-lang-list"] [data-testid="translator-lang-option-${language}"]`,
    sourceTextarea: 'd-textarea[data-testid="translator-source-input"]',
    targetTextarea: 'd-textarea[data-testid="translator-target-input"]',
    formalityToggler: '.lmt__formalitySwitch__toggler',
    formalitySwitch: '.lmt__formalitySwitch',
    formalOption: '.lmt__formalitySwitch div button:nth-child(1)',
    informalOption: '.lmt__formalitySwitch div button:nth-child(2)',
    chromeExtensionBanner: '[data-testid=chrome-extension-toast] button[aria-label=Fermer]',
}

async function translatePhrase(text: string, options: Options, page: Page) {
    const defaultDelay = options.defaultDelay || 150;
    const targetLanguage = TargetLanguageMap[options.targetLanguage] as TargetLanguage;

    const waitForTranslation = async () => {
        await sleepMs(1000);
        await page.waitForSelector(selectors.translationActive, { hidden: true });
        await sleepMs(1000);
    };

    await page.setRequestInterception(true);

    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
            request.respond({ status: 200, body: 'aborted' })
        } else {
            request.continue();
        }
    });

    await page.goto('https://www.deepl.com/translator', { waitUntil: 'networkidle2' });

    /*if (await hasSelector(page, selectors.chromeExtensionBanner)) {
        await page.click(selectors.chromeExtensionBanner);
    }*/

    await page.waitForSelector(selectors.selectTargetLanguageButton);

    /*while (await hasSelector(page, selectors.cookieBannerDismiss)) {
        await page.click(selectors.cookieBannerDismiss);
        await sleepMs(1000);
    }*/

    /*await sleepMs(2000);
    while (await hasSelector(page, selectors.dialogDismiss)) {
        await page.click(selectors.dialogDismiss);
        await sleepMs(1000);
    }*/

    if (options.sourceLanguage) {
        await sleepMs(defaultDelay);
        await page.waitForSelector(selectors.selectSourceLanguageButton);
        await page.click(selectors.selectSourceLanguageButton);
        await sleepMs(defaultDelay);
        await page.click(selectors.sourceLanguageOption(options.sourceLanguage));
    }

    await sleepMs(defaultDelay);
    await page.click(selectors.selectTargetLanguageButton);
    await sleepMs(defaultDelay);
    await page.click(selectors.targetLanguageOption(targetLanguage));
    await sleepMs(defaultDelay);

    await page.click(selectors.sourceTextarea);
    await sleepMs(defaultDelay);
    //await page.keyboard.type(text);
    await page.evaluate((text, selector) => {
        const textarea = document.querySelector(selector) as HTMLTextAreaElement;
        if (textarea) {
            textarea.value = text;
            // Déclencher les événements input et change pour que l'application réagisse à la modification du texte
            textarea.dispatchEvent(new Event('input', { 'bubbles': true }));
            textarea.dispatchEvent(new Event('change', { 'bubbles': true }));
        }
    }, text, selectors.sourceTextarea);
    await waitForTranslation();

    if (options.formality) {
        if (!await hasSelector(page, selectors.formalityToggler)) {
            throw new Error('Cannot switch formality');
        }

        await sleepMs(defaultDelay);
        if (options.formality === 'formal') {
            await page.click(selectors.formalityToggler);
            await page.waitForSelector(selectors.formalOption);
            await page.click(selectors.formalOption);
        } else if (options.formality === 'informal') {
            await page.click(selectors.formalityToggler);
            await page.waitForSelector(selectors.informalOption);
            await page.click(selectors.informalOption);
        }

        await waitForTranslation();
    }

    const result = await page.evaluate((selector) => {
        const node = document.querySelector(selector) as HTMLTextAreaElement;
        if (!node) return '';
        return node.value;
    }, selectors.targetTextarea);

    return result;
}

export default async function translate(texts, options) {
    const browser = await getBrowser();
    let pages: any = [];
    let results: any = [];

    try {
        // Limiter le nombre d'onglets ouverts simultanément
        const maxTabs = 5;
        for (let i = 0; i < texts.length; i += maxTabs) {
            const textsChunk = texts.slice(i, i + maxTabs);
            pages = await Promise.all(textsChunk.map(() => browser.newPage()));

            const translationPromises = textsChunk.map((text, index) =>
                translatePhrase(text, options, pages[index])
            );

            results = results.concat(await Promise.all(translationPromises));

            // Fermer les onglets après chaque lot de traductions
            await Promise.all(pages.map(page => page.close()));
            pages = [];
        }
    } catch (error) {
        console.error('An error occurred during translation:', error);
    } finally {
        // Assurez-vous que toutes les pages sont fermées
        await Promise.all(pages.map(page => page?.close()));
        await kill();
    }

    return results;
}