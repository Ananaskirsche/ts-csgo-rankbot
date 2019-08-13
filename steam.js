const https = require("https");
const logger = require('./logger')(__filename);
const xmldoc = require("xmldoc");
const rp = require('request-promise');
const steamApi = require("steam");
const csgo = require("csgo");
const fs = require('fs');
const config = require('./config/config');
module.exports.steamProfileUrl = null;


class Steam {

    /**
     * Constructor
     */
    constructor(){
        this.SteamClient = new steamApi.SteamClient();
        this.SteamUser = new steamApi.SteamUser(this.SteamClient);
        this.SteamGC = new steamApi.SteamGameCoordinator(this.SteamClient, 730);
        this.SteamFriends = new steamApi.SteamFriends(this.SteamClient);
        this.CSGOCli = new csgo.CSGOClient(this.SteamUser, this.SteamGC, true);
    }



    /**
     * Returns the profile URL of the bot
     */
    getSteamProfileUrl() {
        return this.SteamProfileUrl;
    };



    /**
     *
     */
    startSteam() {
        logger.info("Starting steam interface");
        let _self = this;


        // Try to use saved server list, else use precompiled
        if (fs.existsSync('./config/.steamservers'))
        {
            let steamServers = null;

            try
            {
                logger.debug("Found .steamservers file, trying to use it");
                steamServers = JSON.parse(fs.readFileSync("./config/.steamservers") );
            }
            catch (e)
            {
                logger.warn("Could not read .steamservers file in config directory. Please delete it!");
                steamServers = JSON.parse(`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`);
            }

            steamApi.servers = steamServers;
        }
        else
        {
            steamApi.servers = JSON.parse(`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`);
        }


        //Connect to Steam
        this.SteamClient.connect();


        //Server list update event
        this.SteamClient.on('servers', function (servers)
        {
            try
            {
                fs.writeFile('./config/.steamservers', JSON.stringify(servers));
                logger.info("Updated .steamservers file!");
            }
            catch (e) {
                logger.warn('Could not write new steam servers file!');
                logger.warn(e.message);
            }

            steamApi.servers = servers;
        });



        //Steam Connected Event
        this.SteamClient.on('connected', function ()
        {
            _self.SteamUser.logOn(config.steamConfig);
        });


        //Friendrequest event
        this.SteamFriends.on('friend', (steam64id, relationshipStatus) => {
            //_self.onRelationshipChange(steam64id, relationshipStatus);
        });


        //Relationship event
        this.SteamFriends.on('relationships', (steam64id, relationshipStatus) => {
            //_self.onRelationshipChange(steam64id, relationshipStatus);
        });


        //Steam Login Event
        this.SteamClient.on('logOnResponse', (response) => {
            if(response.eresult === steamApi.EResult.OK)
            {
                logger.info("Steam interface logged in successful");

                //Set profile url
                module.exports.steamProfileUrl = "https://steamcommunity.com/profiles/" + response.client_supplied_steamid;
            }
            else
            {
                logger.error("Steam interface could not log in!");
                process.exit(1);
            }

            //Set online
            _self.SteamFriends.setPersonaState(steamApi.EPersonaState.Online);

            //Start CSGO interface
            logger.info("Starting CSGO interface");
            _self.CSGOCli.launch();
            _self.CSGOCli.on('ready', () =>
            {
                logger.info("CSGO interface ready!");
            });
        });
    };



    /**
     * Returns the steam64id of the steam profile
     * @param communityUrl URL of the steam profile
     */
    static async getSteamIdFromProfile(communityUrl) {

        let id = null;
        let data = await rp(communityUrl);

        //Parse XML
        let document = new xmldoc.XmlDocument(data);
        let child = document.childNamed("steamID64");

        if(child !== undefined){
            return child.val;
        }
        return null;
    };
}

module.exports = Steam;