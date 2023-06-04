import path from 'path';
import Logger from './logger';
import { Languages } from '../util/statics';

interface LanguagePack {
    defaultLanguage: string;
    languages: {
        [key: string]: string;
    };
    strings: {
        [key: string]: {
            [key: string]: string;
        };
    };
}

interface LocalizedStrings {
    [key: string]: string;
}

export default class Localizer {
    #languagePackPath: string = '';
    #languagePack: LanguagePack = {
        defaultLanguage: '',
        languages: {},
        strings: {},
    };

    /**
     * @description Returns the path from where the Handler was called
     */
    #getInstPath(): string {
        const stack = new Error().stack as string;
        const frame = stack.split('\n')[3].trim().replace(/\\/g, '/');
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/)([a-zA-Z0-9_ ]\.?)+)+\3/g;
        return (regex.exec(frame) as string[])[0];
    }

    /**
     * @description Loads the language pack
     */
    reload() {
        const old = this.#languagePack;
        try {
            delete require.cache[require.resolve(this.#languagePackPath)];
            this.#setLanguagePack(require(this.#languagePackPath));
            return true;
        } catch (e) {
            this.#languagePack = old;
            Logger.error('Failed to load language pack');
            return false;
        }
    }

    constructor(languagePackPath: string) {
        if (!languagePackPath || typeof languagePackPath !== 'string')
            throw new Error('languagePackPath must be of type string');
        this.#languagePackPath = path.join(this.#getInstPath(), languagePackPath);
        Logger.info('Localizer initialized');
        this.reload();
    }

    /**
     * @description Sets the language pack and validates it. Returns true if successful
     */
    #setLanguagePack(pack: LanguagePack): boolean {
        if (!pack || typeof pack !== 'object') {
            Logger.warn('Invalid language pack');
            return false;
        }
        if (
            !pack.defaultLanguage ||
            typeof pack.defaultLanguage !== 'string' ||
            !Languages.includes(pack.defaultLanguage)
        ) {
            Logger.warn('Invalid default language');
            return false;
        }
        if (!pack.languages || !Array.isArray(pack.languages)) {
            Logger.warn('Languages must be of type array');
            return false;
        }
        if (!pack.strings || typeof pack.strings !== 'object') {
            Logger.warn('Strings must be of type object');
            return false;
        }
        for (const language of pack.languages) {
            if (!Languages.includes(language)) {
                Logger.warn(`Language ${language} is not supported`);
                return false;
            }
            if (!pack.strings[language] || typeof pack.strings[language] !== 'object') {
                Logger.warn(`${language} misses strings`);
                return false;
            }
            for (const [key, value] of Object.entries(pack.strings[language])) {
                if (typeof value !== 'string') {
                    Logger.warn(`Invalid value for ${key} in ${language}. Must be of type string`);
                    return false;
                }
            }
        }
        for (const language of Languages) {
            if (!pack.languages.includes(language)) this.#languagePack.languages[language] = pack.defaultLanguage;
            else this.#languagePack.languages[language] = language;
        }
        this.#languagePack.defaultLanguage = pack.defaultLanguage;
        this.#languagePack.strings = pack.strings;
        return true;
    }

    /**
     * @description Returns a string from the language pack and replaces the placeholders
     */
    get(language: string, key: string, ...placeholders: (string | number)[]): string {
        if (!language || typeof language !== 'string') throw new Error(`Invalid language ${language}`);
        if (!key || typeof key !== 'string') throw new Error(`Invalid key ${key}`);
        if (!this.#languagePack.languages[language]) throw new Error(`Language ${language} is not supported`);
        if (!this.#languagePack.strings[this.#languagePack.languages[language]][key])
            throw new Error(`Key ${key} does not exist in language ${this.#languagePack.languages[language]}`);
        let translation = this.#languagePack.strings[this.#languagePack.languages[language]][key];
        for (let i = 0; i < placeholders.length; i++) {
            translation = translation.replace(`{{${i + 1}}}`, String(placeholders[i]));
        }
        return translation;
    }

    /**
     * @description Returns a string from the language pack in its default language and replaces the placeholders
     */
    getDefault(key: string, ...placeholders: (string | number)[]): string {
        return this.get(this.#languagePack.defaultLanguage, key, ...placeholders);
    }

    /**
     * @description Returns all possible strings and replaces the placeholders
     */
    getAll(key: string, ...placeholders: (string | number)[]): LocalizedStrings {
        if (!key || typeof key !== 'string') throw new Error(`Invalid key ${key}`);
        const strings: LocalizedStrings = {};
        for (const [peerLanguage, language] of Object.entries(this.#languagePack.languages)) {
            if (peerLanguage !== language) continue;
            strings[peerLanguage] = this.get(language, key, ...placeholders);
        }
        return strings;
    }
}
