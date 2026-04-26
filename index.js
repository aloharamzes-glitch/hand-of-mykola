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
const MIKOLA_ID = "380348086532440065";

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

    await channel.send({
      content: `👋 ${member}\n❓ Питання 1`,
      components: [row1],
    });

    setTimeout(async () => {
      if (!member.roles.cache.has(ROLE_ID)) {
        await member.kick('таймер');
        channel.delete().catch(() => {});
      }
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error(err);
  }
});

// --- КОМАНДИ ---
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // verify
  if (message.content === '!verify') {
    return message.channel.send({
      content: 'Мієш мнєцкати?',
      components: [row1],
    });
  }

  // кік
  if (message.content.startsWith('сїбав')) {
    if (message.guild.ownerId !== message.author.id) {
      return message.reply('ти хто такий?');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('кого?');

    if (!member.kickable) {
      return message.reply('❌ не можу вигнати');
    }

    try {
      await member.kick('вигнаний');
      message.channel.send(`${member.user.tag} сїбав`);
    } catch {
      message.reply('❌ помилка');
    }
  }

  // мут
  if (message.author.id === MIKOLA_ID && message.content.startsWith("мут")) {
    const parts = message.content.split(" ");

    if (parts.length < 3) {
      return message.reply("Формат: мут @user 10m");
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply("Треба тегнути 😐");
    }

    const duration = parts[2];
    const timeValue = parseInt(duration.slice(0, -1));
    const unit = duration.slice(-1);

    let ms;

    if (unit === "m") ms = timeValue * 60000;
    else if (unit === "h") ms = timeValue * 3600000;
    else if (unit === "s") ms = timeValue * 1000;
    else return message.reply("Формат: 10m / 1h / 30s");

    try {
      if (!member.moderatable) {
        return message.reply("Не можу 😬");
      }

      await member.timeout(ms, "Мут");
      message.channel.send(`${member.user.tag} мут на ${duration}`);
    } catch (err) {
      console.error(err);
      message.reply("Помилка");
    }
  }
});

// --- КНОПКИ ---
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const member = interaction.member;
  const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

  if (interaction.customId === 'q1_yes') {
    return interaction.update({ content: 'А хулі ти сюда зайшов?', components: [row2] });
  }

  if (interaction.customId === 'q1_no') {
    return interaction.update({ content: 'А хулі ти тут?', components: [confirmRow()] });
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
    return interaction.update({ content: '⚠️ Пиздун?', components: [confirmRow()] });
  }

  if (interaction.customId === 'confirm_kick') {
    await member.kick('відмова');
    logChannel?.send(`❌ ${member.user.tag} кік`);
    await interaction.channel.delete().catch(() => {});
  }

  if (interaction.customId === 'confirm_back') {
    return interaction.update({ content: '🔄 Знову', components: [row1] });
  }
});

// 🔥 ЗАПУСК
client.login(TOKEN);