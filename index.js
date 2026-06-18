const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  time,
  TimestampStyles
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const TOKEN = process.env.TOKEN;
const TIMERS_FILE = path.join(__dirname, 'timers.json');
const bosses = require('./data/bosses.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// --- Timer Storage ---
function loadTimers() {
  if (!fs.existsSync(TIMERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(TIMERS_FILE, 'utf8'));
}

function saveTimers(timers) {
  fs.writeFileSync(TIMERS_FILE, JSON.stringify(timers, null, 2));
}

// Structure: { guildId: { "bossKey_mapId_channel": { spawnTime, bossKey, mapId, channel } } }
let timers = loadTimers();

// --- Utility Functions ---
function generateTimerId(guildId, bossKey, mapId, channel) {
  return `${guildId}_${bossKey}_${mapId}_ch${channel}`;
}

function getGuildTimers(guildId) {
  return timers[guildId] || {};
}

function parseKilledTime(input) {
  if (!input) return null;

  const match = input.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const hour = Number(match[3]);
  const minute = Number(match[4]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const now = new Date();
  const year = now.getFullYear();
  const killedAt = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    killedAt.getFullYear() !== year ||
    killedAt.getMonth() !== month - 1 ||
    killedAt.getDate() !== day ||
    killedAt.getHours() !== hour ||
    killedAt.getMinutes() !== minute
  ) {
    return null;
  }

  return killedAt.getTime();
}

function addTimer(guildId, bossKey, mapId, channel, referenceTime = Date.now()) {
  const boss = bosses[bossKey];
  const spawnTime = referenceTime + boss.respawnMinutes * 60 * 1000;
  
  if (!timers[guildId]) timers[guildId] = {};
  
  const timerId = generateTimerId(guildId, bossKey, mapId, channel);
  timers[guildId][timerId] = {
    bossKey,
    mapId,
    channel,
    spawnTime,
    createdAt: Date.now()
  };
  
  saveTimers(timers);
  return { timerId, spawnTime };
}

function removeTimer(guildId, timerId) {
  if (timers[guildId] && timers[guildId][timerId]) {
    delete timers[guildId][timerId];
    saveTimers(timers);
    return true;
  }
  return false;
}

// --- Interaction Handlers ---
client.on('interactionCreate', async interaction => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== 'bosstimer') return;
    
    const subcommand = interaction.options.getSubcommand();
    
    // --- /bosstimer add-anego ---
    if (subcommand === 'add-anego') {
      const bossKey = 'anego';
      const boss = bosses[bossKey];
      const channel = interaction.options.getString('channel');
      const killedAtInput = interaction.options.getString('killed_time');
      const referenceTime = killedAtInput ? parseKilledTime(killedAtInput) : Date.now();

      if (killedAtInput && referenceTime === null) {
        return interaction.reply({
          content: 'Invalid date format. Please use MM/DD HH:MM, for example: 05/11 20:30.',
          ephemeral: true
        });
      }

      const mapId = boss.maps[0]?.id;
      const { spawnTime } = addTimer(interaction.guildId, bossKey, mapId, channel, referenceTime);
      const map = boss.maps.find(m => m.id === mapId);

      const fields = [
        { name: 'Boss', value: boss.name, inline: true },
        { name: 'Map', value: map && map.name ? map.name : 'N/A', inline: true },
        { name: 'Channel', value: `cc${channel}`, inline: true }
      ];

      if (killedAtInput) {
        fields.push({
          name: 'Killed At',
          value: `${time(Math.floor(referenceTime / 1000), TimestampStyles.ShortDateTime)}`,
          inline: false
        });
      }

      fields.push({
        name: 'Earliest Spawn Time',
        value: `${time(Math.floor(spawnTime / 1000), TimestampStyles.ShortTime)} (${time(Math.floor(spawnTime / 1000), TimestampStyles.RelativeTime)})`,
        inline: false
      });

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Boss Timer Added')
        .addFields(fields)
        .setTimestamp();

      return interaction.reply({
        content: null,
        embeds: [embed]
      });
    }
    
    // --- /bosstimer add-bf ---
    else if (subcommand === 'add-bf') {
      const bossKey = 'bigfoot';
      const boss = bosses[bossKey];
      const mapId = interaction.options.getString('map');
      const channel = interaction.options.getString('channel');
      const killedAtInput = interaction.options.getString('killed_time');
      const referenceTime = killedAtInput ? parseKilledTime(killedAtInput) : Date.now();

      if (killedAtInput && referenceTime === null) {
        return interaction.reply({
          content: 'Invalid date format. Please use MM/DD HH:MM, for example: 05/11 20:30.',
          ephemeral: true
        });
      }

      const { spawnTime } = addTimer(interaction.guildId, bossKey, mapId, channel, referenceTime);
      const map = boss.maps.find(m => m.id === mapId);

      const fields = [
        { name: 'Boss', value: boss.name, inline: true },
        { name: 'Map', value: map && map.name ? map.name : 'N/A', inline: true },
        { name: 'Channel', value: `cc${channel}`, inline: true }
      ];

      if (killedAtInput) {
        fields.push({
          name: 'Killed At',
          value: `${time(Math.floor(referenceTime / 1000), TimestampStyles.ShortDateTime)}`,
          inline: false
        });
      }

      fields.push({
        name: 'Earliest Spawn Time',
        value: `${time(Math.floor(spawnTime / 1000), TimestampStyles.ShortTime)} (${time(Math.floor(spawnTime / 1000), TimestampStyles.RelativeTime)})`,
        inline: false
      });

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Boss Timer Added')
        .addFields(fields)
        .setTimestamp();

      return interaction.reply({
        content: null,
        embeds: [embed]
      });
    }
    
    // --- /bosstimer add-hh ---
    else if (subcommand === 'add-hh') {
      const bossKey = 'headless_horseman';
      const boss = bosses[bossKey];
      const mapId = interaction.options.getString('map');
      const channel = interaction.options.getString('channel');
      const killedAtInput = interaction.options.getString('killed_time');
      const referenceTime = killedAtInput ? parseKilledTime(killedAtInput) : Date.now();

      if (killedAtInput && referenceTime === null) {
        return interaction.reply({
          content: 'Invalid date format. Please use MM/DD HH:MM, for example: 05/11 20:30.',
          ephemeral: true
        });
      }

      const { spawnTime } = addTimer(interaction.guildId, bossKey, mapId, channel, referenceTime);
      const map = boss.maps.find(m => m.id === mapId);

      const fields = [
        { name: 'Boss', value: boss.name, inline: true },
        { name: 'Map', value: map && map.name ? map.name : 'N/A', inline: true },
        { name: 'Channel', value: `cc${channel}`, inline: true }
      ];

      if (killedAtInput) {
        fields.push({
          name: 'Killed At',
          value: `${time(Math.floor(referenceTime / 1000), TimestampStyles.ShortDateTime)}`,
          inline: false
        });
      }

      fields.push({
        name: 'Earliest Spawn Time',
        value: `${time(Math.floor(spawnTime / 1000), TimestampStyles.ShortTime)} (${time(Math.floor(spawnTime / 1000), TimestampStyles.RelativeTime)})`,
        inline: false
      });

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Boss Timer Added')
        .addFields(fields)
        .setTimestamp();

      return interaction.reply({
        content: null,
        embeds: [embed]
      });
    }
    
    // --- /bosstimer list ---
    else if (subcommand === 'list') {
      const bossKey = interaction.options.getString('boss');
      const groupByMap = interaction.options.getBoolean('group_by_map') || false;
      const boss = bosses[bossKey];

      if (!boss) {
        return interaction.reply({
          content: 'Invalid boss selection. Please use `/bosstimer list <boss>`.'
        });
      }

      const guildTimers = getGuildTimers(interaction.guildId);
      const filteredTimers = Object.entries(guildTimers)
        .filter(([_, t]) => t.bossKey === bossKey);

      if (filteredTimers.length === 0) {
        return interaction.reply({
          content: `No active timers found for **${boss.name}**.`
        });
      }

      boss.maps = boss.maps || [];
      let finalDescription;

      if (groupByMap) {
        // Group by map and include spawn times using boss-specific map order
        const timersByMap = {};
        filteredTimers.forEach(([_, t]) => {
          if (!timersByMap[t.mapId]) {
            timersByMap[t.mapId] = [];
          }
          timersByMap[t.mapId].push(t);
        });

        const mapGroups = [];
        boss.maps.forEach(({ id: mapId }) => {
          const timers = timersByMap[mapId];
          if (!timers) return;

          timers.sort((a, b) => Number(a.channel) - Number(b.channel));

          const map = boss.maps.find(m => m.id === mapId);
          const mapName = (map && map.name) ? map.name : mapId;
          const lines = timers.map(t => {
            const spawnTimestamp = Math.floor(t.spawnTime / 1000);
            const timeStr = `${time(spawnTimestamp, TimestampStyles.ShortTime)} (${time(spawnTimestamp, TimestampStyles.RelativeTime)})`;
            const mapPart = boss.maps.length > 1 ? `${mapName.padEnd(5)} — ` : '';
            return `**• ${mapPart}cc${t.channel} — Earliest spawn time ${timeStr}**`;
          });
          mapGroups.push(lines.join('\n'));
        });

        finalDescription = mapGroups.join('\n\n');
      } else {
        // Sort by spawn time (default behavior)
        const sortedTimers = filteredTimers.sort((a, b) => a[1].spawnTime - b[1].spawnTime);
        const description = sortedTimers.map(([_, t]) => {
          const spawnTimestamp = Math.floor(t.spawnTime / 1000);
          const timeStr = `${time(spawnTimestamp, TimestampStyles.ShortTime)} (${time(spawnTimestamp, TimestampStyles.RelativeTime)})`;
          const map = boss.maps.find(m => m.id === t.mapId);
          const mapName = (map && map.name) ? map.name : '';
          const mapPart = boss.maps.length > 1 ? `${mapName.padEnd(5)} — ` : '';
          return `**• ${mapPart}cc${t.channel} — Earliest spawn time ${timeStr}**`;
        });

        // Group into chunks of 5
        const chunks = [];
        for (let i = 0; i < description.length; i += 5) {
          chunks.push(description.slice(i, i + 5).join('\n'));
        }
        finalDescription = chunks.join('\n\n');
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`⏰ Current ${boss.name} Timers`)
        .setDescription(finalDescription)
        .setTimestamp();

      await interaction.reply({
        content: null,
        embeds: [embed]
      });
    }
    
    // --- /bosstimer remove ---
    else if (subcommand === 'remove') {
      const bossKey = interaction.options.getString('boss');
      const boss = bosses[bossKey];

      if (!boss) {
        return interaction.reply({
          content: 'Invalid boss selection. Please use `/bosstimer remove <boss>`.'
        });
      }

      const guildTimers = getGuildTimers(interaction.guildId);
      
      const bossTimers = Object.entries(guildTimers)
        .filter(([_, t]) => t.bossKey === bossKey);
      
      if (bossTimers.length === 0) {
        return interaction.reply({
          content: `No active timers for **${boss.name}**.`
        });
      }
      
      const removeSelect = new StringSelectMenuBuilder()
        .setCustomId('select_remove_timer')
        .setPlaceholder('Select timer to remove')
        .addOptions(bossTimers.map(([id, t]) => {
          const boss = bosses[t.bossKey];
          boss.maps = boss.maps || [];
          const map = boss.maps.find(m => m.id === t.mapId);
          const label = map && map.name ? `cc${t.channel} - ${map.name}` : `cc${t.channel}`;
          return {
            label,
            description: `Earliest Spawn time ${time(Math.floor(t.spawnTime / 1000), TimestampStyles.RelativeTime)}`,
            value: id
          };
        }));
      
      const row = new ActionRowBuilder().addComponents(removeSelect);
      
      await interaction.reply({
        content: `Select a **${boss.name}** timer to remove:`,
        components: [row]
      });
    }
  }
  
  // Handle select menus
  else if (interaction.isStringSelectMenu()) {
    // Timer removal
    if (interaction.customId === 'select_remove_timer') {
      const timerId = interaction.values[0];
      const success = removeTimer(interaction.guildId, timerId);
      
      await interaction.update({
        content: success ? '✅ Timer removed successfully.' : '❌ Timer not found.',
        components: [],
        embeds: []
      });
    }
  }
});

function onceClientReady() {
  console.log(`Logged in as ${client.user.tag}`);
}

client.once('ready', onceClientReady);
client.once('clientReady', onceClientReady);

client.login(TOKEN);
