# Toolbox

# Package

## Content

### Classes

#### CommandBuilder

```JS
const { CommandBuilder } = require('@bambusgamer/toolbox');

module.exports = new CommandBuilder({
    slash: {
        data: (client, modules) => ({
            name: '',
            name_localizations: {},
            type: 1,
            description: '',
            description_localizations: {},
            options: [],
            default_member_permissions: [],
            dm_permission: false,
            nsfw: false,
        }),
        async autocomplete(client, modules, interaction) { },
        async callback(client, modules, interaction) { },
    },
    text: {
        data: (client, modules) => ({
            name: '',
            aliases: [],
            category: '',
            permissions: [],
            description: '',
            usage: '',
            example: [],
            dm_permission: false,
        }),
	async callback(client, modules, message) {},
    },
})
```

#### EventBuilder

```JS
const { EventBuilder } = require('@bambusgamer/toolbox');

module.exports = new EventBuilder({
    name: 'ready',
    once: true,
    listener: '',
    async callback(client, modules) { },
    ...keys,
});
```

#### InteractionBuilder

```JS
const { InteractionBuilder } = require('@bambusgamer/toolbox');

module.exports = new InteractionBuilder({
    customId: '',
    async callback(client, modules, interaction) { },
    ...keys,
});
```

### Modules

#### AntiCrash

```JS
const { Anticrash } = require('@bambusgamer/toolbox');

Anticrash.init();
```

#### Config

Loads a .js or .json file

```JS
const { Config } = require('@bambusgamer/toolbox');

const config = new Config('');

// reload
config.reload();
```

#### Handler

```JS
const { Handler } = require('@bambusgamer/toolbox');

const handler = new Handler({
	client,
	paths: {
		commands: '',
		events: '',
		interactions: '',
	},
	restToken: '',
});

// reload
handler.reload();
// register all slashs
handler.register();
// register a beta slash ([commandData], guildId)
handler.register([], '');
// delete any slash (commandId, guildId)
handler.deleteSlash('', '')
```

#### Localizer

```JS
const { Localizer } = require('@bambusgamer/toolbox');

const localizer = new Localizer('');

// get key in default Language
localizer.getDefault('key', ...placeholders);
// get key in all Languages
localizer.getAll('key', ...placeholders);
// get key in Language
localizer.get('en-US', 'key', ...placeholders);
```

**Localizationpack:**

```JS
module.exports = {
    defaultLanguage: 'en-US',
    languages: ['en-US'],
    strings: {
        'en-US': {
		'key': 'value {{1}}',
        },
    },
};
```

#### Logger

```JS
const { Logger } = require('@bambusgamer/toolbox');

new Logger('');
```

#### Mongoose

```JS
const { Mongoose } = require('@bambusgamer/toolbox');

Mongoose.init('');
```

# Discord

## Message structure

```JS
{
  "reactions": [
    {
      "count": 1,
      "me": false,
      "emoji": {
        "id": null,
        "name": "🔥"
      }
    }
  ],
  "attachments": [],
  "tts": false,
  "embeds": [],
  "timestamp": "2017-07-11T17:27:07.299000+00:00",
  "mention_everyone": false,
  "id": "334385199974967042",
  "pinned": false,
  "edited_timestamp": null,
  "author": {
    "username": "Mason",
    "discriminator": "9999",
    "id": "53908099506183680",
    "avatar": "a_bab14f271d565501444b2ca3be944b25"
  },
  "mention_roles": [],
  "content": "Supa Hot",
  "channel_id": "290926798999357250",
  "mentions": [],
  "type": 0
}
```

## Interactions

### Commands

**Types:**

1. Chat_input
2. User
3. Message

**Localization:**

```JS
{
	"locale": "localized"
}
```

**Option types:**

1. Sub_Command
2. Sub_Command_Group
3. String
4. Integer (Any integer between -2^53 and 2^53)
5. Boolean
6. User
7. Channel (Includes all channel types + categories)
8. Role
9. Mentionable (Includes users and roles)
10. Number (Any double between -2^53 and 2^53)
11. Attachment

**Example:**

```JS
{
	type: 1,
	name: "command",
	name_localizations: {"de-DE": "befehl"},
	description: "Does stuff",
	description_localizations: {"de-DE": "Macht Dinge"},
    	options: [
        {
            type: 2,
            name: "subcommandGroup",
            name_localizations: {"de-DE": "unterbefehlgruppe"},
            description: "Does stuff",
            description_localizations: {"de-DE": "Macht Dinge"},
            options: [
                {
                    type: 1,
                    name: "subcommand",
                    name_localizations: {"de-DE": "unterbefehl"},
                    description: "Does stuff",
                    description_localizations: {"de-DE": "Macht Dinge"},
                    options: [
                        {
                            type: 3,
                            name: "string",
                            name_localizations: {"de-DE": "zeichenkette"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            min_length: 0,
                            max_length: 100,
                            required: true,
                        },
                        {
                            type: 3,
                            name: "stringSelect",
                            name_localizations: {"de-DE": "zeichenketteauswahl"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            choices: [
                                {
                                    name: "choice",
                                    name_localizations: {"de-DE": "auswahl"},
                                    value: "value",
                                },
                            ],
                            required: true,
                        },
                        {
                            type: 4,
                            name: "integer",
                            name_localizations: {"de-DE": "ganzzahl"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            min_value: 0,
                            max_value: 100,
                            required: true,
                        },
                        {
                            type: 5,
                            name: "boolean",
                            name_localizations: {"de-DE": "logisch"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            required: true,
                        },
                        {
                            type: 6,
                            name: "user",
                            name_localizations: {"de-DE": "benutzer"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            required: true,
                        },
                        {
                            type: 7,
                            name: "channel",
                            name_localizations: {"de-DE": "kanal"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            required: true,
                        },
                        {
                            type: 8,
                            name: "role",
                            name_localizations: {"de-DE": "rolle"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            required: true,
                        },
                        {
                            type: 9,
                            name: "mentionable",
                            name_localizations: {"de-DE": "erwähnbar"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            required: true,
                        },
                        {
                            type: 10,
                            name: "number",
                            name_localizations: {"de-DE": "zahl"},
                            description: "Does stuff",
                            description_localizations: {"de-DE": "Macht Dinge"},
                            min_value: 0,
                            max_value: 100,
                            required: true,
                        },
        }
    ],
    default_member_permissions: [],
    dm_permission: false,
    nsfw: false,
}
```

## Message Components

**Types:**

1. Action Row
2. Button
3. String Select
4. Text Input
5. User Select
6. Role Select
7. Mentionable Select
8. Channel Select

**Button Styles:**

1. Primary
2. Secondary
3. Success
4. Danger
5. Link

**Button emojis:**

```JS
{
    name: "emoji",
    id: "emoji_id",
    animated: true,
}
```

**Example:**

```JS
[
    {
        type: 1,
        components: [
            {
                type: 2,
                label: "Button",
                label_localizations: {"de-DE": "Knopf"},
                style: 1,
                custom_id: "button",
            },
            {
                type: 2,
                label: "Link",
                label_localizations: {"de-DE": "Link"},
                style: 5,
                url: "https://google.com",
            },
            {
                type: 2,
                label: "Emoji",
                label_localizations: {"de-DE": "Emoji"},
                style: 1,
                custom_id: "emoji",
                emoji: {
                    name: "emoji",
                    id: "emoji_id",
                    animated: true,
                },
            }
        ]
    },
    {
        type: 1,
        components: [
            {
                type: 3,
                placeholder: "Select",
                placeholder_localizations: {"de-DE": "Auswählen"},
                custom_id: "select",
                options: [
                    {
                        label: "Option",
                        label_localizations: {"de-DE": "Auswahl"},
                        value: "value",
                        description: "Description",
                        description_localizations: {"de-DE": "Beschreibung"},
                        emoji: {
                            name: "emoji",
                            id: "emoji_id",
                            animated: true,
                        },
                    },
                ],
            },
        ]
    },
    {
        type: 1,
        components: [
            {
                type: 5,
                placeholder: "User",
                placeholder_localizations: {"de-DE": "Benutzer"},
                custom_id: "user",
            },
        ]
    },
]
```

## Modals

**Text Input Types:**

1. Short
2. Paragraph

**Example:**

```JS
{
    title: "Modal",
    title_localizations: {"de-DE": "Modal"},
    description: "Description",
    description_localizations: {"de-DE": "Beschreibung"},
    components: [
        {
            type: 1,
            components: [
                {
                    type: 4,
                    label: "Input",
                    placeholder: "Placeholder",
                    value: "Default Value",
                    custom_id: "input",
                    min_length: 0,
                    max_length: 100,
                    type: 1,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 3,
                    placeholder: "Select",
                    placeholder_localizations: {"de-DE": "Auswählen"},
                    custom_id: "select",
                    options: [
                        {
                            label: "Option",
                            label_localizations: {"de-DE": "Auswahl"},
                            value: "value",
                            description: "Description",
                            description_localizations: {"de-DE": "Beschreibung"},
                            emoji: {
                                name: "emoji",
                                id: "emoji_id",
                                animated: true,
                            },
                        },
                    ],
                },
            ],
        }
    ],
}
```
