const path = require('path');
const statics = require('../util/statics');
const Logger = require('./logger');
const Server = require('./server');

module.exports = class Localizer {
    #languagePackPath = null;
    static languagePack = {
        defaultLanguage: null,
        languages: {},
        strings: {},
    };
    static called = false;
    /**
     * Returns the path from where the Handler was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3].trim();
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/|\\)(\w\.?)+)+\3/g;
        const instancePath = regex.exec(frame)[0].replace(/\\/g, '/');
        return instancePath;
    }
    /**
     * Loads the language pack
     * @return {object} Returns the language pack
     */
    #reload() {
        const old = Localizer.languagePack;
        try {
            delete require.cache[require.resolve(this.#languagePackPath)];
            this.#setLanguagePack(require(this.#languagePackPath));
            return true;
        } catch (e) {
            Localizer.languagePack = old;
            Logger.error('Failed to load language pack');
            return false;
        }
    }
    /**
     * Creates a new Localizer
     * @param {string} languagePackPath The path of the config relative to from where the constructor is called
     */
    constructor(languagePackPath) {
        if (!Localizer.called) {
            Localizer.called = true;
            if (!languagePackPath || typeof languagePackPath !== 'string') throw new Error('Invalid config path');
            const instance = this.#getInstPath();
            this.#languagePackPath = path.join(instance, languagePackPath);
            if (Server.app && Server.app.listen && typeof Server.app.listen === 'function') {
                Server.app.post('/Localizer/reload', (req, res) => {
                    Logger.info(`Reloading Localizer from ${req.ip}`);
                    const success = this.#reload();
                    res.sendStatus(success ? 200 : 500);
                });
            }
            Logger.info('Handler module initialized');
            this.#reload();
        } else throw new Error('Localizer already initialized');
    }
    /**
     * Sets the language pack and validates it
     * @param {object} pack The language pack
     * @param {array} pack.languages The supported languages
     * @param {object} pack.strings The strings
     * @return {boolean} Returns true if the language pack is valid
     * @private
     */
    #setLanguagePack(pack) {
        if (!pack || typeof pack !== 'object') return (Logger.warn('Invalid language pack') && false);
        if (!pack.defaultLanguage || typeof pack.defaultLanguage !== 'string' || !statics.supportedDiscordLanguages.includes(pack.defaultLanguage)) return (Logger.warn('Invalid default language') && false);
        if (!pack.languages || !Array.isArray(pack.languages)) return (Logger.warn('Languages must be of type array') && false);
        if (!pack.strings || typeof pack.strings !== 'object') return (Logger.warn('Strings must be of type object') && false);
        for (const language of pack.languages) {
            if (!statics.supportedDiscordLanguages.includes(language)) return (Logger.warn(`Language ${language} is not supported`) && false);
            if (!pack.strings[language] || typeof pack.strings[language] !== 'object') return (Logger.warn(`${language} misses strings`) && false);
            for (const [key, value] of Object.entries(pack.strings[language])) {
                if (typeof value !== 'string') return (Logger.warn(`Invalid value for ${key} in ${language}. Must be of type string`) && false);
            };
        };
        for (const language of statics.supportedDiscordLanguages) {
            if (!pack.languages.includes(language)) Localizer.languagePack.languages[language] = pack.defaultLanguage;
            else Localizer.languagePack.languages[language] = language;
        };
        Localizer.languagePack.defaultLanguage = pack.defaultLanguage;
        Localizer.languagePack.strings = pack.strings;
        return true;
    }
    /**
     * Returns a string from the language pack and replaces the placeholders
     * @param {string} language The language
     * @param {string} key The key of the string
     * @param {...*} placeholders The placeholders
     * @return {string} The string
     */
    static get(language, key, ...placeholders) {
        if (!language || typeof language !== 'string') throw new Error(`Invalid language ${language}`);
        if (!key || typeof key !== 'string') throw new Error(`Invalid key ${key}`);
        if (!Localizer.languagePack.languages[language]) throw new Error(`Language ${language} is not supported`);
        if (!Localizer.languagePack.strings[Localizer.languagePack.languages[language]][key]) throw new Error(`Key ${key} does not exist in language ${Localizer.languagePack.languages[language]}`);
        let string = Localizer.languagePack.strings[Localizer.languagePack.languages[language]][key];
        for (let i = 0; i < placeholders.length; i++) {
            string = string.replace(`{{${i + 1}}}`, placeholders[i]);
        };
        return string;
    }
    /**
     * Returns a string from the language pack in its default language and replaces the placeholders
     * @param {string} key The key of the string
     * @param {...*} placeholders The placeholders
     * @return {string} The string
     */
    static getDefault(key, ...placeholders) {
        if (Localizer.languagePack.defaultLanguage) return Localizer.get(Localizer.languagePack.defaultLanguage, key, ...placeholders);
        else return Localizer.get('en-US', key, ...placeholders);
    }
    /**
     * Returns all possible strings and replaces the placeholders
     * @param {string} key The key of the string
     * @param {...*} placeholders The placeholders
     * @return {object} The strings
     */
    static getAll(key, ...placeholders) {
        if (!key || typeof key !== 'string') throw new Error(`Invalid key ${key}`);
        const strings = {};
        for (const [peerLanguage, language] of Object.entries(Localizer.languagePack.languages)) {
            if (peerLanguage !== language) continue;
            strings[peerLanguage] = this.get(language, key, ...placeholders);
        }
        return strings;
    }
};
