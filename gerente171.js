require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages
    ] 
});

function createMetaModal() {
    const modal = new ModalBuilder()
        .setCustomId('modal-meta')
        .setTitle('🎯 Meta Diária ou Semanal');

    const row1 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('meta_aluminio')
            .setLabel('Aluminio:')
            .setPlaceholder('Somente número...')
            .setStyle(TextInputStyle.Short)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('meta_cobre')
            .setLabel('Cobre:')
            .setPlaceholder('Somente número...')
            .setStyle(TextInputStyle.Short)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('meta_carvao')
            .setLabel('Carvão:')
            .setPlaceholder('Somente número...')
            .setStyle(TextInputStyle.Short)
    );

    const row4 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('meta_dinheiro_sujo')
            .setLabel('Dinheiro Sujo:')
            .setPlaceholder('Somente número...')
            .setStyle(TextInputStyle.Short)
    );

    modal.addComponents(row1, row2, row3, row4);
    return modal;
}

function createRetiradaModal() {
    const modal = new ModalBuilder()
        .setCustomId('modal-retirada')
        .setTitle('📤 Retirada do Baú');

    const row1 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('retirada_item')
            .setLabel('Qual foi o item retirado?')
            .setStyle(TextInputStyle.Short)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('retirada_quantidade')
            .setLabel('Quantidade?')
            .setPlaceholder('Somente número...')
            .setStyle(TextInputStyle.Short)
    );

    modal.addComponents(row1, row2);
    return modal;
}

function createColocouModal() {
    const modal = new ModalBuilder()
        .setCustomId('modal-colocou')
        .setTitle('📥 Colocado no Baú');

    const row1 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('colocou_item')
            .setLabel('Qual foi o item colocado?')
            .setStyle(TextInputStyle.Short)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('colocou_quantidade')
            .setLabel('Quantidade?')
            .setPlaceholder('Somente número...')
            .setStyle(TextInputStyle.Short)
    );

    modal.addComponents(row1, row2);
    return modal;
}

async function findMenuMessage(channel, customId) {
    let messages = await channel.messages.fetch({ limit: 10 });
    return messages.find(m =>
        m.components.length > 0 &&
        m.components[0].components[0].customId === customId
    );
}

async function sendMenuMessage(channel) {
    const infoEmbed = new EmbedBuilder()
        .setColor('#003366')
        .setTitle('Registro Menu')
        .setDescription('Aqui você vai interagir com as opções abaixo para registrar itens e metas.');

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select')
                .setPlaceholder('📋 Escolha uma opção')
                .addOptions([
                    {
                        label: '🎯 Meta',
                        description: 'Registrar meta diária ou semanal.',
                        value: 'meta',
                    },
                    {
                        label: '📤 Retirada do baú',
                        description: 'Registrar item retirado do baú.',
                        value: 'retirada_bau',
                    },
                    {
                        label: '📥 Colocou no baú',
                        description: 'Registrar item colocado no baú.',
                        value: 'colocou_bau',
                    },
                ]),
        );

    let menuMessage = await findMenuMessage(channel, 'select');
    if (menuMessage) {
        await menuMessage.edit({ components: [row], embeds: [infoEmbed] });
    } else {
        await channel.send({ components: [row], embeds: [infoEmbed] });
    }
}

async function findOrCreateUserLogChannel(guild, interaction) {
    if (!interaction || !interaction.user) {
        console.log("Erro: Objeto de interação inválido ou usuário não encontrado na interação.");
        return null;
    }

    const userId = interaction.user.id;
    const userChannelName = `log-${userId}`;
    let userLogChannel = guild.channels.cache.find(channel => channel.name === userChannelName && channel.type === ChannelType.GuildText);

    if (!userLogChannel) {
        try {
            userLogChannel = await guild.channels.create({
                name: userChannelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: userId,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    }
                ]
            });
            console.log(`Canal de log criado para o usuário com ID ${userId}`);
        } catch (error) {
            console.log(`Erro ao criar o canal de log para o usuário com ID ${userId}: ${error}`);
        }
    }

    return userLogChannel;
}

async function processModalSubmit(interaction) {
    let logChannelId;
    let userLogChannel;
    let logEmbed = new EmbedBuilder().setTimestamp();
    let userName = interaction.user.username;
    let userId = interaction.user.id;

    switch (interaction.customId) {
        case 'modal-meta':
            logChannelId = process.env.META_LOG_ID;
            const metaAluminio = interaction.fields.getTextInputValue('meta_aluminio');
            const metaCobre = interaction.fields.getTextInputValue('meta_cobre');
            const metaCarvao = interaction.fields.getTextInputValue('meta_carvao');
            const metaDinheiroSujo = interaction.fields.getTextInputValue('meta_dinheiro_sujo');

            logEmbed
                .setColor('#ffff00')
                .setTitle('Meta')
                .addFields(
                    { name: 'Membro', value: `<@${userId}>` },
                    { name: 'Aluminio:', value: metaAluminio, inline: true },
                    { name: 'Cobre:', value: metaCobre, inline: true },
                    { name: 'Carvão:', value: metaCarvao, inline: true },
                    { name: 'Dinheiro Sujo:', value: metaDinheiroSujo }
                );
            break;
        case 'modal-retirada':
            logChannelId = process.env.RETIRADA_LOG_ID;
            const retiradaItem = interaction.fields.getTextInputValue('retirada_item');
            const retiradaQuantidade = interaction.fields.getTextInputValue('retirada_quantidade');
            logEmbed
                .setColor('#ff3300')
                .setTitle('Retirada do baú')
                .addFields(
                    { name: 'Membro', value: `<@${userId}>` },
                    { name: 'Item Retirado', value: retiradaItem, inline: true },
                    { name: 'Quantidade', value: retiradaQuantidade, inline: true }
                );
            break;
        case 'modal-colocou':
            logChannelId = process.env.COLOCOU_LOG_ID;
            const colocouItem = interaction.fields.getTextInputValue('colocou_item');
            const colocouQuantidade = interaction.fields.getTextInputValue('colocou_quantidade');
            logEmbed
                .setColor('#33cc33')
                .setTitle('Colocou no baú')
                .addFields(
                    { name: 'Membro', value: `<@${userId}>` },
                    { name: 'Item Colocado', value: colocouItem, inline: true },
                    { name: 'Quantidade', value: colocouQuantidade, inline: true }
                );
            break;
    }

    userLogChannel = await findOrCreateUserLogChannel(interaction.guild, interaction);
    if (userLogChannel) {
        await userLogChannel.send({ embeds: [logEmbed] });
    }

    if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });

            const replyMessage = await interaction.reply({ content: 'Foi enviado com sucesso!', ephemeral: true });
            setTimeout(() => replyMessage.delete(), 5000);
        } else {
            console.log(`Canal de log com ID "${logChannelId}" não encontrado.`);
            const errorMessage = await interaction.reply({ content: `Erro: Canal de log com ID "${logChannelId}" não encontrado.`, ephemeral: true });
            setTimeout(() => errorMessage.delete(), 5000);
        }
    }

}

client.once('ready', async () => {
    console.log(`${client.user.tag} estou ONLINE!`);

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.log('Guild not found');

    let menuChannel = guild.channels.cache.find(channel => channel.name === 'menu' && channel.type === ChannelType.GuildText);
    if (!menuChannel) {
        menuChannel = await guild.channels.create({ name: 'menu', type: ChannelType.GuildText });
    }

    let menuMessage = await findMenuMessage(menuChannel, 'select');
    if (!menuMessage) {
        await sendMenuMessage(menuChannel);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu()) {
        let modal;
        switch (interaction.values[0]) {
            case 'meta':
                modal = createMetaModal();
                break;
            case 'retirada_bau':
                modal = createRetiradaModal();
                break;
            case 'colocou_bau':
                modal = createColocouModal();
                break;
        }
        if (modal) {
            const channel = interaction.channel;

            await sendMenuMessage(channel);
            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        await processModalSubmit(interaction);
    }
});

client.login(process.env.DISCORD_API_TOKEN);