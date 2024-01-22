/* eslint-disable no-await-in-loop */
import { Browser, Page, executablePath } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as cliProgress from 'cli-progress';
import chalk from 'chalk';

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
            headless: "new",
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

/**
 * Traduit une phrase en utilisant le site web DeepL.
 *
 * @param {string} text - Le texte à traduire.
 * @param {Options} options - Les options de traduction.
 * @param {Page} page - La page Puppeteer à utiliser pour la traduction.
 * @returns {Promise<string>} La traduction du texte.
 */
async function translatePhrase(text: string, options: Options): Promise<string> {

    const browser = await getBrowser();
    const page = await browser.newPage();

    const defaultDelay = options.defaultDelay || 150;
    const targetLanguage = TargetLanguageMap[options.targetLanguage] as TargetLanguage;

    // Attends que la traduction soit terminée
    const waitForTranslation = async () => {
        await sleepMs(1000);
        await page.waitForSelector(selectors.translationActive, { hidden: true });
        await sleepMs(1000);
    };

    // Configure l'interception des requêtes pour bloquer les ressources inutiles
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'media', 'imageset'].includes(request.resourceType())) {
            request.respond({ status: 200, body: 'aborted' });
        } else {
            request.continue();
        }
    });

    // Accède à la page de traduction
    await page.goto('https://www.deepl.com/translator', { waitUntil: 'networkidle0' });

    // Configure la langue source, si spécifiée
    if (options.sourceLanguage) {
        await sleepMs(defaultDelay);
        await page.waitForSelector(selectors.selectSourceLanguageButton);
        await page.click(selectors.selectSourceLanguageButton);
        await sleepMs(defaultDelay);
        await page.click(selectors.sourceLanguageOption(options.sourceLanguage));
    }

    // Configure la langue cible
    await sleepMs(defaultDelay);
    await page.click(selectors.selectTargetLanguageButton);
    await sleepMs(defaultDelay);
    await page.click(selectors.targetLanguageOption(targetLanguage));
    await sleepMs(defaultDelay);

    // Entrez le texte à traduire
    await page.click(selectors.sourceTextarea);
    await sleepMs(defaultDelay);
    await page.evaluate((text, selector) => {
        const textarea = document.querySelector(selector) as HTMLTextAreaElement;
        if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { 'bubbles': true }));
            textarea.dispatchEvent(new Event('change', { 'bubbles': true }));
        }
    }, text, selectors.sourceTextarea);

    // Attends que la traduction soit terminée
    await waitForTranslation();

    // Récupère et renvoie la traduction
    const result = await page.evaluate((selector) => {
        const node = document.querySelector(selector) as HTMLTextAreaElement;
        return node ? node.innerText : '';
    }, selectors.targetTextarea);

    // Ferme la page
    await page.close();

    return result;
}

export default async function translate(texts, options) {
    const browser = await getBrowser();

    // Créer une nouvelle barre de progression
    const progressBar = new cliProgress.SingleBar({
        format: 'Translation progress: ' + chalk.red('{bar}') + ' {percentage}% | ETA: {eta}s | {value}/{total}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    progressBar.start(texts.length, 0);

    try {
        // Traduire tous les textes en parallèle
        const results = await Promise.all(texts.map(async (text, index) => {
            const result = await translatePhrase(text, options);

            // Mettre à jour la barre de progression
            progressBar.update(texts.length - index);

            return result;
        }));

        progressBar.stop();

        return results;
    } catch (error) {
        console.error('An error occurred during translation:', error);
    } finally {
        await kill();
    }
}