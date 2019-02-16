class TeamspeakHelper {
    /**
     * Constructor
     */
    constructor(steamHelper) {
        this.rp = require('request-promise');
        this.xml = require('xml2js');
        this.dbhandler = require('./database.js');
        this.TeamSpeak = require("ts3-nodejs-library");
        this.config = require('../config/config.js');
        this.steamHelper = steamHelper;
    }


    /**
     * Registers user
     * @param communityUrl
     * @param tsUid
     * @param tsNick
     */
    collectUserData(communityUrl, tsUid, tsNick) {
        this.rp(communityUrl)
            .then((data) => {
                //Daten erhalten!
                let parser = new this.xml.Parser();
                parser.parseString(data, (err, result) => {
                    let steamId64 = result.profile.steamID64[0];

                    this.dbhandler.isRegistered(steamId64)
                        .then((isRegistered) => {
                            if(!isRegistered)
                            {
                                this.dbhandler.registerIdentity(tsUid, steamId64);
                                console.log("User " + tsNick + " hat sich registriert!");
                            }
                            else
                            {
                                console.log("User " + tsNick + " war bereits registriert!");
                            }
                        })
                        .catch((error) => {
                            throw error;
                        });
                })
            })
            .catch(function (err) {
                console.log(err);
                return null;
            });
    };


    /**
     * Event handler, when message was received
     * @param ev
     * @returns {null}
     */
    onMessageReceived(ev){
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

            this.collectUserData(communityUrl, ev.invoker.getUID(), ev.invoker.getCache().client_nickname)
        }
    }


    /**
     *  Initalizes Teamspeak
     */
    initTeamspeak(){
        console.log("Starting Teamspeak Bot");

        //Create a new Connection
        let ts3 = new this.TeamSpeak({
            protocol: 'ssh',
            host: this.config.tsConfig.host,
            queryport: this.config.tsConfig.queryport,
            serverport: this.config.tsConfig.serverport,
            username: this.config.tsConfig.username,
            password: this.config.tsConfig.password,
            nickname: this.config.tsConfig.nickname,
            keepalive: true
        });



        //The clientconnect event gets fired when a new Client joins the selected TeamSpeak Server
        ts3.on("clientconnect", ev => {
            const client = ev.client;
            console.log(`Client ${client.getCache().client_nickname} just connected`);
            client.message(this.config.botConfig.greetingMessage);
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


        ts3.on('textmessage', ev => { this.onMessageReceived(ev); });
        ts3.on("error", e => console.log("Error", e.message));
        ts3.on("close", e => console.log("Connection has been closed!", e));
    }
}

module.exports = TeamspeakHelper;