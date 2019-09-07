const Teamspeak = require('./teamspeak');
const Steam = require('./steam');

const fs = require('fs');
const logDir = "logs";

//Check if logs dir exists
if(!fs.existsSync(logDir))
{
    fs.mkdirSync(logDir);
}

//Check if config exists
if(!fs.existsSync("config/config.js")){
    if(fs.existsSync("config/config.js.example")){
        fs.copyFileSync("config/config.js.example", "config/config.js");
    }

    console.log("The bot was not configured! Please configure it properly and then try again!");
    return;
}

let ts = new Teamspeak();
let steam = new Steam(ts);

steam.startSteam();
ts.startTeamspeak();