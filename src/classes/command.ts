import { ChatInputApplicationCommandData, MessageApplicationCommandData, UserApplicationCommandData } from 'discord.js';

type SlashCommand = {
    data: (...args: any[]) => ChatInputApplicationCommandData;
    autocomplete?: (...args: any[]) => Promise<any> | any;
    callback: (...args: any[]) => Promise<any> | any;
};

type BetaSlashCommand = {
    data: (...args: any[]) => ChatInputApplicationCommandData;
    autocomplete?: (...args: any[]) => Promise<any> | any;
    callback: (...args: any[]) => Promise<any> | any;
};

type ContextMenuCommand = {
    data: (...args: any[]) => UserApplicationCommandData | MessageApplicationCommandData;
    callback: (...args: any[]) => Promise<any> | any;
};

type TextCommandData = {
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
    [key: string]: any;
};

type TextCommand = {
    data: (...options: any[]) => TextCommandData;
    callback: (...args: any[]) => Promise<any> | any;
};

type HydratedSlashCommand = {
    data: ChatInputApplicationCommandData;
    autocomplete?: (...args: any[]) => Promise<any> | any;
    callback: (...args: any[]) => Promise<any> | any;
};

type HydratedBetaSlashCommand = {
    data: ChatInputApplicationCommandData;
    autocomplete?: (...args: any[]) => Promise<any> | any;
    callback: (...args: any[]) => Promise<any> | any;
};

type HydratedContextMenuCommand = {
    data: UserApplicationCommandData | MessageApplicationCommandData;
    callback: (...args: any[]) => Promise<any> | any;
};

type HydratedTextCommand = {
    data: TextCommandData;
    callback: (...args: any[]) => Promise<any> | any;
};

export default class CommandBuilder {
    private _slash: SlashCommand | HydratedSlashCommand | undefined;
    private _betaSlash: BetaSlashCommand | HydratedBetaSlashCommand | undefined;
    private _contextMenu: ContextMenuCommand | HydratedContextMenuCommand | undefined;
    private _text: TextCommand | HydratedTextCommand | undefined;

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
        slash?: SlashCommand;
        betaSlash?: BetaSlashCommand;
        contextMenu?: ContextMenuCommand;
        text?: TextCommand;
    }) {
        this._slash = slash;
        this._betaSlash = betaSlash;
        this._contextMenu = contextMenu;
        this._text = text;
    }

    /**
     * @description Hydrates the slash command builder. Must be called before the command is registered
     */
    hydrate(...options: any[]) {
        if (this._slash?.data) {
            if (typeof this._slash.data === 'function') this._slash.data = this._slash.data(...options);
            if (this._slash.autocomplete) this._slash.autocomplete = this._slash.autocomplete.bind(null, ...options);
            this._slash.callback = this._slash.callback.bind(null, ...options);
        }
        if (this._betaSlash?.data) {
            if (typeof this._betaSlash.data === 'function') this._betaSlash.data = this._betaSlash.data(...options);
            if (this._betaSlash.autocomplete)
                this._betaSlash.autocomplete = this._betaSlash.autocomplete.bind(null, ...options);
            this._betaSlash.callback = this._betaSlash.callback.bind(null, ...options);
        }
        if (this._contextMenu?.data) {
            if (typeof this._contextMenu.data === 'function')
                this._contextMenu.data = this._contextMenu.data(...options);
            this._contextMenu.callback = this._contextMenu.callback.bind(null, ...options);
        }
        if (this._text?.data) {
            if (typeof this._text.data === 'function') this._text.data = this._text.data(...options);
            this._text.callback = this._text.callback.bind(null, ...options);
        }
    }

    /**
     * @description Returns the name associated with the slash command
     */
    get slashName(): string | undefined {
        return this._slash?.data?.name;
    }

    /**
     * @description Returns the name associated with the beta slash command
     */
    get betaSlashName(): string | undefined {
        return this._betaSlash?.data?.name;
    }

    /**
     * @description Returns the name associated with the context menu command
     */
    get contextMenuName(): string | undefined {
        return this._contextMenu?.data?.name;
    }

    /**
     * @description Returns the name associated with the command
     */
    get name(): string | undefined {
        return this._text?.data?.name;
    }

    /**
     * @description Returns the aliases associated with the command
     */
    get aliases(): string[] | undefined {
        return (this._text?.data as TextCommandData)?.aliases;
    }

    get slash(): HydratedSlashCommand | undefined {
        return (this._slash as HydratedSlashCommand) ?? undefined;
    }

    get betaSlash(): HydratedBetaSlashCommand | undefined {
        return (this._betaSlash as HydratedBetaSlashCommand) ?? undefined;
    }

    get contextMenu(): HydratedContextMenuCommand | undefined {
        return (this._contextMenu as HydratedContextMenuCommand) ?? undefined;
    }

    get text(): HydratedTextCommand | undefined {
        return (this._text as HydratedTextCommand) ?? undefined;
    }
}

// prettier-ignore
export {
    HydratedSlashCommand,
    HydratedBetaSlashCommand,
    HydratedContextMenuCommand,
    HydratedTextCommand,
};
