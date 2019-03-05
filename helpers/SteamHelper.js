class SteamHelper
{
    /**
     * Constructor
     */
    constructor(tsHandler)
    {
        this.Steam = require('steam');
        this.csgo = require('csgo');
        this.bot = new this.Steam.SteamClient();
        this.steamUser = new this.Steam.SteamUser(this.bot);
        this.steamFriends = new this.Steam.SteamFriends(this.bot);
        this.steamGC = new this.Steam.SteamGameCoordinator(this.bot, 730);
        this.CSGOCli = new this.csgo.CSGOClient(this.steamUser, this.steamGC, false);
        this.fs = require('fs');
        this.config = require('../config/config');
        this.dbhandler = require('./database.js');
        this.tsHandler = tsHandler;
        this.logger = require('./LogHelper')(__filename);
        this.steamProfileUrl = null;
    }



    /**
     * Returns the rank of a steam user
     * @param steam64id
     * @param tsUid Die tsUid vom Benutzer. Wenn gleich undefined, dann wird die tsUid aus der DB geholt
     */
    updateUserRank(steam64id, tsUid)
    {
        //TS UID ist undefinied, manuell aus der Datenbank holen
        if(tsUid === undefined)
        {
            this.dbhandler.getTsuid(steam64id).then((tsUid) =>
            {
                this.requestPlayerProfile(steam64id, tsUid);
            })
            .catch((err) =>
            {
                this.logger.error(`Could not get tsuid from steam64id (${steam64id}`);
                this.logger.error(err);
            });
        }
        else
        {
            this.requestPlayerProfile(steam64id, tsUid);
        }
    }



    /**
     * Requests Player Profile from CSGO and sets Rank in TS
     * @param steam64id
     * @param tsUid
     */
    requestPlayerProfile(steam64id, tsUid)
    {
        let _self = this;
        this.logger.debug(`Getting player Profile of steam64id ${steam64id}`);

        //Check if event handler has already added
        if(this.CSGOCli._events.playerProfile === undefined)
        {
            this.CSGOCli.on('playerProfile', function (profile)
            {
                let ranking = profile.account_profiles[0].ranking;

                //rank = null if user has not added the bot to friendlist. We need to check that first!
                if(ranking !== null)
                {
                    _self.logger.debug(`Got rank ${ranking.rank_id} for steam64id ${steam64id}`);
                    _self.tsHandler.setRank(tsUid, ranking.rank_id);
                }
                else
                {
                    //tell user that we haven't found his rank
                    _self.logger.debug(`Could not get a rank for ${steam64id}`);
                    _self.tsHandler.ts3.getClientByUID(tsUid).then((tsClient) =>
                    {
                        tsClient.message("I could not find your rank! Did you added me to your friend list?");
                    })
                    .catch((err) =>
                    {
                        _self.logger.error(`Could not get ts client by uid (${tsUid})`);
                        _self.logger.error(err);
                    });
                }
            });
        }

        this.CSGOCli.playerProfileRequest(this.CSGOCli.ToAccountID(steam64id));
    }



    /**
     * Event when Steam relationship status changes
     * @param steam64id
     * @param relationshipStatus
     */
    onRelationshipChange (steam64id, relationshipStatus){
        this.logger.debug(`Ǹew relationship event from ${steam64id} (relationship=${relationshipStatus})`);
        //Null check
        if(steam64id === undefined || relationshipStatus === undefined)
        {
            return;
        }

        if(relationshipStatus === this.Steam.EFriendRelationship.RequestRecipient)
        {
            this.logger.debug(`Relationship event from ${steam64id}, status=${relationshipStatus}`);
            this.dbhandler.isRegisteredBySteam64Id(steam64id).then((isRegistered) =>
            {
                    if(isRegistered)
                    {
                        this.steamFriends.addFriend(steam64id);
                        this.dbhandler.setSteamId64Active(steam64id);
                        this.updateUserRank(steam64id, undefined);
                        this.logger.debug(`Relationship event from ${steam64id} is ok, added to friendlist`);
                    }
                    else
                    {
                        this.logger.debug(`Relationship event from ${steam64id}, but is not in db. removing...`);
                        this.steamFriends.removeFriend(steam64id);
                    }
            })
            .catch((err) =>
            {
                 this.logger.error(err);
            });
        }

        // Benutzer hat den Bot aus der Freundesliste entfernt, auch aus der
        // DB entfernen
        if(relationshipStatus === this.Steam.EFriendRelationship.None)
        {
            this.logger.debug(`Got removed from ${steam64id} friendlist, removing too...`);
            this.dbhandler.isRegisteredBySteam64Id(steam64id).then((isRegistered) =>
            {
                if(isRegistered)
                {
                    this.dbhandler.removeUser(steam64id);
                    this.steamFriends.removeFriend(steam64id);
                }
            })
            .catch((err) => {
                this.logger.error(err);
            });
        }
    }



    /**
     *  Initializes Steam
     */
    initSteam()
    {
        this.logger.info("Starting steam interface");
        var _self = this;
        // Try to use saved server list, else use precompiled
        if (this.fs.existsSync('./config/.steamservers'))
        {
            let steamServers = null;

            try
            {
                this.logger.debug("Found .steamservers file, trying to use it");
                steamServers = JSON.parse(fs.readFileSync('./config/.steamservers'));
            }
            catch (e)
            {
                this.logger.warn("Could not read .steamservers file in config directory. Please delete it!");
                steamServers = JSON.parse(`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`);
            }

            this.Steam.servers = steamServers;
        }
        else
        {
            this.Steam.servers = JSON.parse(`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`);
        }

        //Connect to Steam
        this.bot.connect();


        //Server list update event
        this.bot.on('servers', function (servers)
        {
            try
            {
                _self.fs.writeFile('./config/.steamservers', JSON.stringify(servers));
                _self.logger.debug("Updated .steamservers file!");
            }
            catch (e) {
                _self.logger.warn('Could not write down new steam servers!');
                _self.logger.warn(e.message);
            }

            _self.Steam.servers = servers;
        });



        //Steam Connected Event
        this.bot.on('connected', function ()
        {
            _self.steamUser.logOn(_self.config.steamConfig);
        });


        //Friendrequest event
        this.steamFriends.on('friend', (steam64id, relationshipStatus) => {
            _self.onRelationshipChange(steam64id, relationshipStatus);
        });


        //Relationship event
        this.steamFriends.on('relationships', (steam64id, relationshipStatus) => {
            _self.onRelationshipChange(steam64id, relationshipStatus);
        });


        //Steam Login Event
        this.bot.on('logOnResponse', (response) => {
            if(response.eresult === _self.Steam.EResult.OK)
            {
                _self.logger.info("Steam interface logged in successful");

                //Set profile url
                _self.tsHandler.setSteamProfileUrl("https://steamcommunity.com/profiles/" + response.client_supplied_steamid);
            }
            else
            {
                _self.logger.error("Steam interface could not log in!");
                process.exit(1);
            }

            //Set online
            _self.steamFriends.setPersonaState(this.Steam.EPersonaState.Online);

            //Start CSGO interface
            _self.logger.info("Starting CSGO interface");
            _self.CSGOCli.launch();
            _self.CSGOCli.on('ready', () =>
            {
                _self.logger.info("CSGO interface ready!");
            });
        });
    };
}

module.exports = SteamHelper;