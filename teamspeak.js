const {TeamSpeak} = require("ts3-nodejs-library");
const SteamHandler = require("./steam");
const URL = require("url");
const database = require("./database");
const config = require("./config/config");
const logger = require('./logger')(__filename);
const BroadcastChannel = require('broadcast-channel');
const exchangeChannel = new BroadcastChannel('exchange');
const i18n = require("i18n");


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
     * @return Promise{boolean}
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



    //Returns the Channel ID for a given CSGO Rank ID
    static getRankGroupFromRankId(rankId){
        switch (rankId)
        {
            case "0":
                return config.tsRankSgids.unranked;
            case "1":
                return config.tsRankSgids.silver_1;
            case "2":
                return config.tsRankSgids.silver_2;
            case "3":
                return config.tsRankSgids.silver_3;
            case "4":
                return config.tsRankSgids.silver_4;
            case "5":
                return config.tsRankSgids.silver_elite;
            case "6":
                return config.tsRankSgids.silver_elite_master;
            case "7":
                return config.tsRankSgids.gold_nova_1;
            case "8":
                return config.tsRankSgids.gold_nova_2;
            case "9":
                return config.tsRankSgids.gold_nova_3;
            case "10":
                return config.tsRankSgids.gold_nova_master;
            case "11":
                return config.tsRankSgids.master_guardian_1;
            case "12":
                return config.tsRankSgids.master_guardian_2;
            case "13":
                return config.tsRankSgids.master_guardian_elite;
            case "14":
                return config.tsRankSgids.distinguished_master_guardian;
            case "15":
                return config.tsRankSgids.legendary_eagle;
            case "16":
                return config.tsRankSgids.legendary_eagle_master;
            case "17":
                return config.tsRankSgids.supreme_master;
            case "18":
                return config.tsRankSgids.global_elite;
            default:
                return config.tsRankSgids.unranked;
        }
    }



    async setRank(tsUid, csgoRankId){
        //We first need to get the TeamspeakClient
        let tsClientList = await this.ts3.clientList({client_type: 0, client_unique_identifier: tsUid});


        //Check if tsClientList contains at least one client
        if(tsClientList.length > 0)
        {
            let tsClient = tsClientList[0];
            let newCsgoRankSgid = Teamspeak.getRankGroupFromRankId(csgoRankId);

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
                await client.message(i18n.__("register_command_help_text"));
                await client.message(i18n.__("status_command_help_text"));
                await client.message(i18n.__("update_command_help_text"));
            }
            break;


            //Register command
            case "!register": {
                //Check if user is already registered
                if(await database.isRegisteredByTsUid(client.uniqueIdentifier))
                {
                    await client.message(i18n.__("already_registered"));
                    return;
                }

                //Args lenght checke B
                if (cmd.length !== 2) {
                    await client.message(i18n.__("register_command_help_usage"));
                    return;
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
                    await client.message(i18n.__("add_bot", SteamHandler.steamProfileUrl ));

                } else {
                    await ev.invoker.message(i18n.__("wrong_profile_url"));
                }
            }
            break;


            //update command
            case "!update": {
                let isRegistered = await database.isRegisteredByTsUid(client.uniqueIdentifier);

                if(isRegistered){
                    await exchangeChannel.postMessage(`request_update ${ev.invoker.uniqueIdentifier}`);
                }
                else{
                    await client.message(i18n.__("not_registered"));
                }
            }
            break;


            //status command
            case "!status": {
                let isRegistered = await database.isRegisteredByTsUid(client.uniqueIdentifier);

                if(isRegistered){
                    await client.message(i18n.__("registered"));
                }
                else{
                    await client.message(i18n.__("not_registered"));
                }
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
            case "update_tick_update_rank": {
                let tsUid = cmd[1];
                let csgoRankId = cmd[2];
                let rankChannelId = Teamspeak.getRankGroupFromRankId(csgoRankId);
                let client = await this.ts3.getClientByUID(tsUid);
                let clientGroups = client.servergroups;

                let clientIsInGroup = false;

                // Iterate through server groups and check if the client is in the server group for his rank
                // If he is not clientIsInGroup will be false and the update process will be triggered
                for(let i = 0; i < clientGroups.length; i++){
                    let group = clientGroups[i].toString();
                    if(group === rankChannelId.toString()){
                        clientIsInGroup = true;
                    }
                }

                // Trigger update process
                if(!clientIsInGroup){
                    this.setRank(tsUid, csgoRankId);
                }
            }
            break;
        }
    }



    startTeamspeak() {
        //Init i18n
        i18n.configure({
           locales: ['en', 'de'],
           directory: __dirname + "/locales"
        });

        i18n.setLocale(config.botConfig.language);


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

        //Start the update tick
        setInterval(() => {
            this.updateTick().catch( () => {
                logger.error("An error occurred during update tick!");
            });
        }, config.botConfig.checkIntervalTime * 1000 * 60);
    }




    /**
     * Updates the rank of all registered players currently online
     */
    async updateTick() {
        //get all clients online
        let onlineClients = await this.ts3.clientList({client_type: 0});

        for(let i = 0; i < onlineClients.length; i++){
            let client = onlineClients[i];

            //check if client is registered
            if(!await database.isRegisteredByTsUid(client.uniqueIdentifier)){
                return;
            }

            await exchangeChannel.postMessage(`update_tick_get_rank ${client.uniqueIdentifier}`);
        }
    }
}

module.exports = Teamspeak;