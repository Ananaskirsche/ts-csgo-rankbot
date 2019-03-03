const SteamHelper = require('./helpers/SteamHelper');
const TeamspeakHelper = require('./helpers/TeamspeakHelper');
const fs = require('fs');
const logDir = "logs";

//Check if logs dir exists
if(!fs.existsSync(logDir))
{
    fs.mkdirSync(logDir);
}

//Initialize teamspeak and steam
let teamspeakHelper = new TeamspeakHelper();
let steamHelper = new SteamHelper(teamspeakHelper);
teamspeakHelper.steamHelper = steamHelper;

steamHelper.initSteam();
teamspeakHelper.initTeamspeak();
