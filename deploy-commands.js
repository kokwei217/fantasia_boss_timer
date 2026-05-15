const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const bosses = require('./data/bosses.json');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const bossChoices = Object.entries(bosses).map(([key, boss]) => ({
  name: boss.name,
  value: key
}));

const channelChoices = [{
  name: 'CH1',
  value: '1',
},{
  name: 'CH2',
  value: '2',
},{
  name: 'CH3',
  value: '3',
},{
  name: 'CH4',
  value: '4',
}];

const bfMapChoices = bosses.bigfoot.maps.map(map => ({
  name: map.name,
  value: map.id
}));

const hhMapChoices = bosses.headless_horseman.maps.map(map => ({
  name: map.name,
  value: map.id
}));

const commands = [
  new SlashCommandBuilder()
    .setName('bosstimer')
    .setDescription('Manage MapleStory boss spawn timers')
    .addSubcommand(sub =>
      sub.setName('add-anego')
        .setDescription('Add an anego spawn timer')
        .addStringOption(opt =>
          opt.setName('channel')
            .setDescription('Select the channel')
            .setRequired(true)
            .addChoices(...channelChoices)
        )
        .addStringOption(opt =>
          opt.setName('killed_time')
            .setDescription('Optional: Specify date/time as MM/DD HH:MM')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('add-bf')
        .setDescription('Add a Bigfoot spawn timer')
        .addStringOption(opt =>
          opt.setName('map')
            .setDescription('Select the map')
            .setRequired(true)
            .addChoices(...bfMapChoices)
        )
        .addStringOption(opt =>
          opt.setName('channel')
            .setDescription('Select the channel')
            .setRequired(true)
            .addChoices(...channelChoices)
        )
        .addStringOption(opt =>
          opt.setName('killed_time')
            .setDescription('Optional: Specify date/time as MM/DD HH:MM, default = current time')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('add-hh')
        .setDescription('Add a Headless Horseman spawn timer')
        .addStringOption(opt =>
          opt.setName('map')
            .setDescription('Select the map')
            .setRequired(true)
            .addChoices(...hhMapChoices)
        )
        .addStringOption(opt =>
          opt.setName('channel')
            .setDescription('Select the channel')
            .setRequired(true)
            .addChoices(...channelChoices)
        )
        .addStringOption(opt =>
          opt.setName('killed_time')
            .setDescription('Optional: Specify date/time as MM/DD HH:MM, default = current time')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List boss spawn timers')
        .addStringOption(opt =>
          opt.setName('boss')
            .setDescription('Select the boss to list')
            .setRequired(true)
            .addChoices(...bossChoices)
        )
        .addBooleanOption(opt =>
          opt.setName('group_by_map')
            .setDescription('Group timers by map instead of spawn time')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a boss timer')
        .addStringOption(opt =>
          opt.setName('boss')
            .setDescription('Select the boss')
            .setRequired(true)
            .addChoices(...bossChoices)
        )
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Deploying slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Commands deployed successfully!');
  } catch (error) {
    console.error(error);
  }
})();
