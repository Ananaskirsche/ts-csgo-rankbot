const SteamHelper = require('./helpers/SteamHelper');
const TeamspeakHelper = require('./helpers/TeamspeakHelper');

let teamspeakHelper = new TeamspeakHelper();
let steamHelper = new SteamHelper(teamspeakHelper);
teamspeakHelper.steamHelper = steamHelper;

steamHelper.initSteam();
teamspeakHelper.initTeamspeak();
