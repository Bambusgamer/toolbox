const Command = require('../../src/classes/Command.js');

module.exports = new Command({
    slash: {
        global: {
            data: (Builder, client, supportClasses) => new Builder().setName('test').setDescription('Test command'),
            callback: async (client, interaction) => {
                await interaction.reply('Test');
            },
        },
    },
});
