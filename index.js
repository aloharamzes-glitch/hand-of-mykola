require('dotenv').config(); // 🔥 ВАЖЛИВО

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔐 CONFIG
const TOKEN = process.env.TOKEN;
const ROLE_ID = '1497743227548209242';
const VERIFY_CATEGORY_ID = '1497944849024811048';
const LOG_CHANNEL_ID = '1497946515036045454';
const MIKOLA_ID = "303580298703142913";

// --- КНОПКИ ---
const row1 = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('q1_yes').setLabel('Так').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId('q1_no').setLabel('Ні').setStyle(ButtonStyle.Danger),
);

const row2 = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('q2_yes').setLabel('Бо захтів').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId('q2_no').setLabel('Я не знаю').setStyle(ButtonStyle.Danger),
);

const row3 = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('q3_yes').setLabel('Так').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId('q3_no').setLabel('Ні').setStyle(ButtonStyle.Danger),
);

function confirmRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('confirm_back').setLabel('добре подумати').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('confirm_kick').setLabel('зїбати з позором').setStyle(ButtonStyle.Danger),
  );
}

// --- READY ---
client.on('clientReady', () => {
  console.log(`✅ Бот запущений як ${client.user.tag}`);
});

// --- ВХІД ---
client.on('guildMemberAdd', async (member) => {
  console.log("ЗАЙШОВ:", member.user.tag);

  try {
    const channel = await member.guild.channels.create({
      name: `verify-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: VERIFY_CATEGORY_ID,
      permissionOverwrites: [
        {
          id: member.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    setTimeout(async () => {
  try {
    const freshMember = await member.guild.members.fetch(member.id).catch(() => null);
    if (!freshMember) return;

    if (!freshMember.roles.cache.has(ROLE_ID)) {
      if (freshMember.kickable) {
        await freshMember.kick('таймер');
      }
    }

    if (channel && channel.deletable) {
      await channel.delete().catch(() => {});
    }
  } catch (e) {
    console.error('Timeout error:', e);
  }
}, 5 * 60 * 1000);

  } catch (err) {
    console.error(err);
  }
});

// --- КОМАНДИ ---
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const member = interaction.member;
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    if (interaction.customId === 'q1_yes') {
        return interaction.update({ content: '🔒 хулі ти сюда зайшов?', components: [row2] });
    }

    if (interaction.customId === 'q1_no') {
        return interaction.update({ content: '🔒 хулі ти тут?', components: [confirmRow()] });
    }

    if (interaction.customId === 'q2_yes') {
        return interaction.update({ content: 'Будеш мнєцкав мені?', components: [row3] });
    }

    if (interaction.customId === 'q2_no') {
        return interaction.update({ content: 'Добре думай', components: [confirmRow()] });
    }

    if (interaction.customId === 'q3_yes') {
        const role = interaction.guild.roles.cache.get(ROLE_ID);
        if (role) await member.roles.add(role);

        logChannel?.send(`✅ ${member.user.tag} пройшов`);
        await interaction.channel.delete().catch(() => {});
    }

    if (interaction.customId === 'q3_no') {
        return interaction.update({ content: '⚠️ Пиздун', components: [confirmRow()] });
    }

    if (interaction.customId === 'confirm_kick') {
        await member.kick('відмова');
        logChannel?.send(`❌ ${member.user.tag} кік`);
        await interaction.channel.delete().catch(() => {});
    }
});
// 🔥 ЗАПУСК
client.login(TOKEN);