interface SlashCommandObject {
    data: (...options: any[]) => any;
    autocomplete?: (...options: any[]) => Promise<any> | any;
    callback: (...options: any[]) => Promise<any> | any;
}

interface BetaSlashCommandObject {
    data: (...options: any[]) => any;
    autocomplete?: (...options: any[]) => Promise<any> | any;
    callback: (...options: any[]) => Promise<any> | any;
}

interface ContextMenuCommandObject {
    data: (...options: any[]) => any;
    callback: (...options: any[]) => Promise<any> | any;
}

interface TextCommandData {
    name: string;
    aliases?: string[];
    category?: string;
    permissions?: any[];
    description?: string;
    usage?: string;
    examples?: string[];
    guildOnly?: boolean;
    dmOnly?: boolean;
    requiredPermissions?: any[];
}

interface TextCommandObject {
    data: ((...options: any[]) => TextCommandData) | TextCommandData;
    callback: (...options: any[]) => Promise<any> | any;
}

export default class CommandBuilder {
    slash: SlashCommandObject | undefined;
    betaSlash: BetaSlashCommandObject | undefined;
    contextMenu: ContextMenuCommandObject | undefined;
    text: TextCommandObject | undefined;

    /**
     * @description Creates a new Command and hydrates the command data
     * @example
     * const { CommandBuilder } = require('@bambusgamer/toolbox');
     *
     * module.exports = new CommandBuilder({
     *    slash: {
     *       data: () => ({
     *         name: 'ping',
     *         description: 'Ping! Pong!'
     *      }),
     *      async callback(client, modules, interaction) {
     *        await interaction.reply('Pong!');
     *      }
     *    },
     * });
     */
    constructor({
        slash,
        betaSlash,
        contextMenu,
        text,
    }: {
        slash?: SlashCommandObject;
        betaSlash?: BetaSlashCommandObject;
        contextMenu?: ContextMenuCommandObject;
        text?: TextCommandObject;
    }) {
        if (slash && typeof slash !== 'object') throw new Error('Invalid slash command data');
        if (betaSlash && typeof betaSlash !== 'object') throw new Error('Invalid beta slash command data');
        if (text && typeof text !== 'object') throw new Error('Invalid text command data');
        if (slash && (!slash?.data || typeof slash?.data !== 'function'))
            throw new Error('Slash command data must have a data function');
        if (slash && slash?.autocomplete && typeof slash?.autocomplete !== 'function')
            throw new Error('Slash command autocomplete must be of type function');
        if (slash && (!slash?.callback || typeof slash?.callback !== 'function'))
            throw new Error('Slash command data must have a callback function');
        if (betaSlash && (!betaSlash?.data || typeof betaSlash?.data !== 'function'))
            throw new Error('Beta slash command data must have a data function');
        if (betaSlash && betaSlash?.autocomplete && typeof betaSlash?.autocomplete !== 'function')
            throw new Error('Beta slash command autocomplete must be of type function');
        if (betaSlash && (!betaSlash?.callback || typeof betaSlash?.callback !== 'function'))
            throw new Error('Beta slash command data must have a callback function');
        if (contextMenu && (!contextMenu?.data || typeof contextMenu?.data !== 'function'))
            throw new Error('Context menu command data must have a data function');
        if (contextMenu && (!contextMenu?.callback || typeof contextMenu?.callback !== 'function'))
            throw new Error('Context menu command data must have a callback function');
        if (text && (!text?.data || typeof text?.data !== 'function'))
            throw new Error('Text command data must have a data function');
        if (text && (!text?.callback || typeof text?.callback !== 'function'))
            throw new Error('Text command data must have a callback function');
        this.slash = slash;
        this.betaSlash = betaSlash;
        this.contextMenu = contextMenu;
        this.text = text;
    }

    /**
     * @description Hydrates the slash command builder. Must be called before the command is registered
     */
    hydrate(...options: any[]) {
        if (this.slash?.data) {
            if (typeof this.slash.data === 'function') this.slash.data = this.slash.data(...options);
            if (this.slash.autocomplete) this.slash.autocomplete = this.slash.autocomplete.bind(null, ...options);
            this.slash.callback = this.slash.callback.bind(null, ...options);
        }
        if (this.betaSlash?.data) {
            if (typeof this.betaSlash.data === 'function') this.betaSlash.data = this.betaSlash.data(...options);
            if (this.betaSlash.autocomplete)
                this.betaSlash.autocomplete = this.betaSlash.autocomplete.bind(null, ...options);
            this.betaSlash.callback = this.betaSlash.callback.bind(null, ...options);
        }
        if (this.contextMenu?.data) {
            if (typeof this.contextMenu.data === 'function') this.contextMenu.data = this.contextMenu.data(...options);
            this.contextMenu.callback = this.contextMenu.callback.bind(null, ...options);
        }
        if (this.text?.data) {
            if (typeof this.text.data === 'function') this.text.data = this.text.data(...options);
            this.text.callback = this.text.callback.bind(null, ...options);
        }
    }

    /**
     * @description Returns the name associated with the slash command
     */
    get slashName(): string | undefined {
        return this.slash?.data?.name;
    }

    /**
     * @description Returns the name associated with the beta slash command
     */
    get betaSlashName(): string | undefined {
        return this.betaSlash?.data?.name;
    }

    /**
     * @description Returns the name associated with the context menu command
     */
    get contextMenuName(): string | undefined {
        return this.contextMenu?.data?.name;
    }

    /**
     * @description Returns the name associated with the command
     */
    get name(): string | undefined {
        return this.text?.data?.name;
    }

    /**
     * @description Returns the aliases associated with the command
     */
    get aliases(): string[] | undefined {
        return (this.text?.data as TextCommandData)?.aliases;
    }
}

type TextCommand = {
    data: ((...options: any[]) => TextCommandData) | TextCommandData;
    callback: (...args: any[]) => Promise<any> | any;
};

type SlashCommand = {
    data: (...args: any[]) => any;
    autocomplete?: (...args: any[]) => Promise<any> | any;
    callback: (...args: any[]) => Promise<any> | any;
};

type BetaSlashCommand = {
    data: (...args: any[]) => any;
    autocomplete?: (...args: any[]) => Promise<any> | any;
    callback: (...args: any[]) => Promise<any> | any;
};

type ContextMenuCommand = {
    data: (...args: any[]) => any;
    callback: (...args: any[]) => Promise<any> | any;
};

export { TextCommand, SlashCommand, BetaSlashCommand, ContextMenuCommand };
