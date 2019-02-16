const SteamHelper = require('./helpers/SteamHelper');
const TeamspeakHelper = require('./helpers/TeamspeakHelper');

let steamHelper = new SteamHelper();
let teamspeakHelper = new TeamspeakHelper(steamHelper);

steamHelper.initSteam();
teamspeakHelper.initTeamspeak();