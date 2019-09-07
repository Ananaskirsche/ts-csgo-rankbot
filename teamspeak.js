const {TeamSpeak} = require("ts3-nodejs-library");
const SteamHandler = require("./steam");
const URL = require("url");
const database = require("./database");
const config = require("./config/config");
const logger = require('./logger')(__filename);
const BroadcastChannel = require('broadcast-channel');
const exchangeChannel = new BroadcastChannel('exchange');



class Teamspeak {

    /**
     * Checks if a given URL string is valid
     * @param urlString
     * @returns {boolean}
     */
    static isValidUrl(urlString)
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



    /**
     * Sends a message to the provided tsUid
     * @param tsUid
     * @param message
     * @return Returns if successful
     */
    async messageUser(tsUid, message){
        //We first need to get the TeamspeakClient
        let tsClientList = await this.ts3.clientList({client_type: 0, client_unique_identifier: tsUid});

        //Check if tsClientList contains at least one client
        if(tsClientList.length > 0)
        {
            let tsClient = tsClientList[0];
            tsClient.message(message)
                .then(() => {return true;})
                .catch(() => {return false;});
        }
    }



    async setRank(tsUid, csgoRankId){
        //We first need to get the TeamspeakClient
        let tsClientList = await this.ts3.clientList({client_type: 0, client_unique_identifier: tsUid});


        //Check if tsClientList contains at least one client
        if(tsClientList.length > 0)
        {
            let tsClient = tsClientList[0];
            let newCsgoRankSgid = null;

            //Get the ranks sgid
            switch (csgoRankId)
            {
                case "0":
                    newCsgoRankSgid = config.tsRankSgids.unranked;
                    break;
                case "1":
                    newCsgoRankSgid = config.tsRankSgids.silver_1;
                    break;
                case "2":
                    newCsgoRankSgid = config.tsRankSgids.silver_2;
                    break;
                case "3":
                    newCsgoRankSgid = config.tsRankSgids.silver_3;
                    break;
                case "4":
                    newCsgoRankSgid = config.tsRankSgids.silver_4;
                    break;
                case "5":
                    newCsgoRankSgid = config.tsRankSgids.silver_elite;
                    break;
                case "6":
                    newCsgoRankSgid = config.tsRankSgids.silver_elite_master;
                    break;
                case "7":
                    newCsgoRankSgid = config.tsRankSgids.gold_nova_1;
                    break;
                case "8":
                    newCsgoRankSgid = config.tsRankSgids.gold_nova_2;
                    break;
                case "9":
                    newCsgoRankSgid = config.tsRankSgids.gold_nova_3;
                    break;
                case "10":
                    newCsgoRankSgid = config.tsRankSgids.gold_nova_master;
                    break;
                case "11":
                    newCsgoRankSgid = config.tsRankSgids.master_guardian_1;
                    break;
                case "12":
                    newCsgoRankSgid = config.tsRankSgids.master_guardian_2;
                    break;
                case "13":
                    newCsgoRankSgid = config.tsRankSgids.master_guardian_elite;
                    break;
                case "14":
                    newCsgoRankSgid = config.tsRankSgids.distinguished_master_guardian;
                    break;
                case "15":
                    newCsgoRankSgid = config.tsRankSgids.legendary_eagle;
                    break;
                case "16":
                    newCsgoRankSgid = config.tsRankSgids.legendary_eagle_master;
                    break;
                case "17":
                    newCsgoRankSgid = config.tsRankSgids.supreme_master;
                    break;
                case "18":
                    newCsgoRankSgid = config.tsRankSgids.global_elite;
                    break;
                default:
                    newCsgoRankSgid = config.tsRankSgids.unranked;
                    break;
            }


            //Remove the user from all previous ranks
            let clientInfo = await tsClient.getInfo();
            let clientGroups = clientInfo.client_servergroups;
            let serverRankSgids = [];

            //Load all sgids from config into array
            for(let value of Object.values(config.tsRankSgids))
            {
                serverRankSgids.push(value);
            }

            // Filter the list of ranks which are included in the server configuration and are assigned to the client
            // This will give us a list of ranks we have to remove
            let sgidIntersection = clientGroups.filter(x => serverRankSgids.includes(x));

            // Iterate through sgidIntersection and remove each group from the server client
            for(let i = 0; i < sgidIntersection.length; i++)
            {
                await tsClient.delGroups(sgidIntersection[i].toString());
            }

            // Assign the new rank to the client
            await tsClient.addGroups(newCsgoRankSgid);
            //await tsClient.addGroups(6);

            logger.debug(`Updated skill group of user ${tsClient.nickname}`);
        }
    }




    static async onMessageReceived(ev) {
        //The Targetmode (1 = Client, 2 = Channel, 3 = Virtual Server)
        if (ev.targetmode !== 1 || ev.invoker.isQuery() === true) {
            //Nachricht wird verworfen, wenn sie nicht direkt an den Bot geht
            return null;
        }

        let client = ev.invoker;
        let cmd = ev.msg.split(" ");


        logger.debug(`Received new message from ${client.nickname}`);


        switch (cmd[0].toLocaleLowerCase()) {
            //Help command
            case "!help": {
                ev.invoker.message("!register - Verknüpft deine TS-Identität mit deinem Steamprofil!");
                ev.invoker.message("!status - Zeigt, ob du bereits verknüpft bist!");
                ev.invoker.message("!update - Überprüft sofort, ob sich dein Rang geändert hat!");
            }
            break;


            //Register command
            case "!register": {
                //Args lenght checke B
                if (cmd.length !== 2) {
                    client.message("!register <your steam profile url>");
                    return null;
                }

                logger.debug(`User ${client.nickname} issued register command`);

                //Build community URL from parameter
                let communityUrl = cmd[1];
                communityUrl = communityUrl.replace("[URL]", "");
                communityUrl = communityUrl.replace("[/URL]", "");

                if (Teamspeak.isValidUrl(communityUrl)) {
                    communityUrl += "/?xml=1"; //Get profile data as XML
                    let steam64id = await SteamHandler.getSteamIdFromProfile(communityUrl);
                    let tsUid = client.uniqueIdentifier;

                    //Save Identity to database
                    database.addIdentity(tsUid, steam64id);

                    //Message the user to add the bot account
                    await client.message("Bitte füge [url=" + SteamHandler.steamProfileUrl +"]den Bot[/url] zu deiner Steam Freundesliste hinzu!");

                } else {
                    await ev.invoker.message("Deine Profil-URL scheint nicht richtig zu sein!");
                }
            }
            break;


            //update command
            case "!update": {

                //TODO: CHECK IF USER IS REGISTERED

                exchangeChannel.postMessage(`request_update ${ev.invoker.uniqueIdentifier}`);
                //TODO: IMPLEMENT
            }
            break;
        }
    }



    async exchangeChannelMessageReceived(msg) {
        let cmd = msg.split(" ");

        switch (cmd[0]) {
            case "update_rank": {
                let tsUid = cmd[1];
                let csgoRankId = cmd[2];

                await this.setRank(tsUid, csgoRankId)
                    .catch((err) => {console.log(err)});
            }
            break;
        }
    }



    startTeamspeak() {
        //Logging
        logger.debug("Initializing teamspeak interface");
        logger.info("Connecting to teamspeak...");


        //Create a new Connection
        this.ts3 = new TeamSpeak({
            protocol: (config.tsConfig.ssh) ? 'ssh' : 'raw',
            host: config.tsConfig.host,
            queryport: config.tsConfig.queryport,
            serverport: config.tsConfig.serverport,
            username: config.tsConfig.username,
            password: config.tsConfig.password,
            nickname: config.tsConfig.nickname,
            keepalive: true
        });


        //The clientconnect event gets fired when a new Client joins the TeamSpeak Server
        this.ts3.on("clientconnect", ev => {
            let client = ev.client;
            logger.debug(`Client ${client.nickname} just connected`);
            client.message(config.botConfig.greetingMessage);
        });


        //What to do, when Bot has finished connecting
        this.ts3.on("ready", () => {
            Promise.all([
                this.ts3.registerEvent("server"),
                this.ts3.registerEvent("channel", config.tsConfig.ts_welcomechannel_id),
                this.ts3.registerEvent("textprivate")
            ]).then(() => {
                logger.info("Teamspeak interface connected and ready!");
            }).catch(e => {
                logger.error("Could not register event handlers!");
                logger.error(e.message);
                process.exit(1);
            });
        });


        this.ts3.on('textmessage', ev => {
            Teamspeak.onMessageReceived(ev).catch(err => {
                console.log(err);
            });
        });
        this.ts3.on("error", e => console.log(e.message));
        this.ts3.on("close", e => {
            if(e != null){
                logger.error("Connection has been lost! ", e.message);
            }
        });


        //Registering exchangeChannelListener
        exchangeChannel.addEventListener('message', (msg) => {this.exchangeChannelMessageReceived(msg).catch((err) => {console.log(err)})});
    }


}

module.exports = Teamspeak;