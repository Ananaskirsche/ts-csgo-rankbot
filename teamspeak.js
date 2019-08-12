const {TeamSpeak} = require("ts3-nodejs-library");
const SteamHandler = require("./steam");
const URL = require("url");


class Teamspeak {

    constructor(){
        this.config = require("./config/config.js");
        this.logger = require('./logger')(__filename);
    }



    /**
     * Checks if a given URL string is valid
     * @param urlString
     * @returns {boolean}
     */
    isValidUrl(urlString)
    {
        try
        {
            let url = URL.parse(urlString);
            return !(url.hostname === null || url.hostname !== "steamcommunity.com");
        }
        catch (e) {
            return false;
        }
    }



    async onMessageReceived(ev) {
        //The Targetmode (1 = Client, 2 = Channel, 3 = Virtual Server)
        if (ev.targetmode !== 1 || ev.invoker.isQuery() === true) {
            //Nachricht wird verworfen, wenn sie nicht direkt an den Bot geht
            return null;
        }

        let client = ev.invoker;
        let cmd = ev.msg.split(" ");


        this.logger.debug(`Received new message from ${client.nickname}`);


        //Help command
        if (cmd[0].toLowerCase() === "!help") {
            ev.invoker.message("!register - Verknüpft deine TS-Identität mit deinem Steamprofil!");
            ev.invoker.message("!status - Zeigt, ob du bereits verknüpft bist!");
            ev.invoker.message("!update - Überprüft sofort, ob sich dein Rang geändert hat!");
        }


        //Register command
        else if (cmd[0].toLowerCase() === "!register") {
            //Args lenght check
            if (cmd.length !== 2) {
                client.message("!register <your steam profile url>");
                return null;
            }

            this.logger.debug(`User ${client.nickname} issued register command`);

            //Build community URL from parameter
            let communityUrl = cmd[1];
            communityUrl = communityUrl.replace("[URL]", "");
            communityUrl = communityUrl.replace("[/URL]", "");

            if (this.isValidUrl(communityUrl)) {
                communityUrl += "/?xml=1"; //Get profile data as XML
                let steam64id = await SteamHandler.getSteamIdFromProfile(communityUrl);
                let tsUid = client.uniqueIdentifier;




            } else {
                ev.invoker.message("Deine Profil-URL scheint nicht richtig zu sein!");
            }
        }
    }



    startTeamspeak() {
        //Logging
        this.logger.debug("Initializing teamspeak interface");
        this.logger.info("Connecting to teamspeak...");


        //Create a new Connection
        this.ts3 = new TeamSpeak({
            protocol: (this.config.tsConfig.ssh) ? 'ssh' : 'raw',
            host: this.config.tsConfig.host,
            queryport: this.config.tsConfig.queryport,
            serverport: this.config.tsConfig.serverport,
            username: this.config.tsConfig.username,
            password: this.config.tsConfig.password,
            nickname: this.config.tsConfig.nickname,
            keepalive: true
        });


        //The clientconnect event gets fired when a new Client joins the TeamSpeak Server
        this.ts3.on("clientconnect", ev => {
            let client = ev.client;
            this.logger.debug(`Client ${client.nickname} just connected`);
            client.message(this.config.botConfig.greetingMessage);
        });


        //What to do, when Bot has finished connecting
        this.ts3.on("ready", () => {
            Promise.all([
                this.ts3.registerEvent("server"),
                this.ts3.registerEvent("channel", this.config.tsConfig.ts_welcomechannel_id),
                this.ts3.registerEvent("textprivate")
            ]).then(() => {
                this.logger.info("Teamspeak interface connected and ready!");
            }).catch(e => {
                this.logger.error("Could not register event handlers!");
                this.logger.error(e.message);
                process.exit(1);
            });
        });


        this.ts3.on('textmessage', ev => {
            this.onMessageReceived(ev);
        });
        this.ts3.on("error", e => console.log(e.message));
        this.ts3.on("close", e => {
            if(e != null){
                this.logger.error("Connection has been lost! ", e.message);
            }
        });
    }
}

module.exports = Teamspeak;