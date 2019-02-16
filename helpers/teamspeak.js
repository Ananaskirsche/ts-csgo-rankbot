const rp = require('request-promise');
const xml = require('xml2js');
const dbhandler = require('./database.js');
const TeamSpeak = require("ts3-nodejs-library");
const config = require('../config/config.js');
let steamhandler = null;


/**
 * Registers user
 * @param communityUrl
 * @param tsUid
 * @param tsNick
 */
var collectUserData = function (communityUrl, tsUid, tsNick) {
    rp(communityUrl)
        .then((data) => {
            //Daten erhalten!
            let parser = new xml.Parser();
            parser.parseString(data, (err, result) => {
                let steamId64 = result.profile.steamID64[0];
                dbhandler.registerIdentity(tsUid, steamId64);
                console.log("User " + tsNick + " hat sich registriert!");
                //TODO: Steamhandler Referenz aus index.js übergeben
                steamhandler.sendFriendRequest(steamId64);
            })
        })
        .catch(function (err) {
            console.log(err);
            return null;
        });
};


/**
 * Event handler, when message was received
 * @param ev Event variable
 * @return null|string
 */
var onMessageReceived = function (ev) {

    //The Targetmode (1 = Client, 2 = Channel, 3 = Virtual Server)
    if(ev.targetmode !== 1 || ev.invoker.isQuery() === true)
    {
        //Nachricht wird verworfen, wenn sie nicht direkt an den Bot geht
        return null;
    }


    //Help Befehl
    if(ev.msg.startsWith("!help"))
    {
        ev.invoker.message("!register - Verknüpft deine TS-Identität mit deinem Steamprofil!");
        ev.invoker.message("!unregister - Entfernt deine Verknüpfung");
        ev.invoker.message("!status - Zeigt, ob du bereits verknüpft bist!");
        return null;
    }


    //Register Befehl
    if(ev.msg.startsWith("!register"))
    {
        console.log("User " + ev.invoker.getCache().client_nickname + " registriert sich");

        //Parameter holen
        let msg = ev.msg;
        let args = msg.split(" ");

        //URL bauen
        let communityUrl = args[1] + "/?xml=1";
        communityUrl = communityUrl.replace("[URL]", "");
        communityUrl = communityUrl.replace("[/URL]", "");

        collectUserData(communityUrl, ev.invoker.getUID(), ev.invoker.getCache().client_nickname)
    }
};






/**
 * Constructor
 * @param steamhelper
 */
module.exports = function TsHandler(steamhelper){
    console.log("Starting Teamspeak Bot");
    steamhelper = steamhandler;

    //Create a new Connection
    const ts3 = new TeamSpeak({
        protocol: 'ssh',
        host: config.tsConfig.host,
        queryport: config.tsConfig.queryport,
        serverport: config.tsConfig.serverport,
        username: config.tsConfig.username,
        password: config.tsConfig.password,
        nickname: config.tsConfig.nickname,
        keepalive: true
    });



    //The clientconnect event gets fired when a new Client joins the selected TeamSpeak Server
    ts3.on("clientconnect", ev => {
        const client = ev.client;
        console.log(`Client ${client.getCache().client_nickname} just connected`);
        client.message(config.botConfig.greetingMessage);
    });



    /*
      Ready gets fired when the Bot has connected to the TeamSpeak Query and
      issued login commands (if username and password has been given)
      selected the appropriate Server (also if given in the config)
      and set the nickname
    */
    ts3.on("ready", () => {
        Promise.all([
            ts3.registerEvent("server"),
            ts3.registerEvent("channel", 0),
            ts3.registerEvent("textprivate")
        ]).then(() => {
            console.log("Teamspeak ready and connected!")
        }).catch(e => {
            console.log("Konnte keine Teamspeak-Events abonnieren!");
            console.log(e.message);
            process.exit(1);
        });
    });


    ts3.on('textmessage', ev => { onMessageReceived(ev); });
    ts3.on("error", e => console.log("Error", e.message));
    ts3.on("close", e => console.log("Connection has been closed!", e));
};