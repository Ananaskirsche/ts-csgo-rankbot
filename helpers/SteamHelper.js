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
        this.CSGOCli = new this.csgo.CSGOClient(this.steamUser, this.steamGC, true);
        this.fs = require('fs');
        this.config = require('../config/config');
        this.dbhandler = require('./database.js');
        this.tsHandler = tsHandler;
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
            .catch((e) =>
            {
                console.log(e);
                console.log("Steam ID:" + steam64id);
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

        this.CSGOCli.on('playerProfile', function (profile)
        {
            let rank = profile.account_profiles[0].ranking.rank_id;
            _self.tsHandler.setRank(tsUid, rank);
        });

        this.CSGOCli.playerProfileRequest(this.CSGOCli.ToAccountID(steam64id));
    }



    /**
     * Event when Steam relationship status changes
     * @param steam64id
     * @param relationshipStatus
     */
    onRelationshipChange (steam64id, relationshipStatus){
        if(relationshipStatus === this.Steam.EFriendRelationship.RequestRecipient)
        {
            this.dbhandler.isRegisteredBySteam64Id(steam64id).then((isRegistered) =>
            {
                    if(isRegistered)
                    {
                        this.steamFriends.addFriend(steam64id);
                        this.dbhandler.setSteamId64Active(steam64id);
                        this.updateUserRank(steam64id, undefined);
                    }
                    else
                    {
                        this.steamFriends.removeFriend(steam64id);
                    }
            })
            .catch((error) =>
            {
                    throw error;
            });
        }

        // Benutzer hat den Bot aus der Freundesliste entfernt, auch aus der
        // DB entfernen
        if(relationshipStatus === this.Steam.EFriendRelationship.Invalid)
        {
            this.dbhandler.isRegisteredBySteam64Id(steam64id).then((isRegistered) =>
            {
                if(isRegistered)
                {
                    this.dbhandler.removeUser(steam64id);
                    this.steamFriends.removeFriend(steam64id);
                }
            })
            .catch((error) => {
                throw error;
            });
        }
    }



    /**
     * Event when Steam receives a friend request
     * @param steam64id Steam ID of the user that sent the friend request
     * @param relationshipStatus The resulting relationship status
     */
    onFriendRequest(steam64id, relationshipStatus)
    {
        if(relationshipStatus === this.Steam.EFriendRelationship.RequestRecipient)
        {
            this.dbhandler.isRegisteredBySteam64Id(steam64id).then((isRegistered) =>
            {
                if(isRegistered)
                {
                    this.steamFriends.addFriend(steam64id);
                    this.dbhandler.setSteamId64Active(steam64id);
                    this.updateUserRank(steam64id, undefined);
                }
                else
                {
                    //Anfrage ablehnen
                    this.steamFriends.removeFriend(steam64id);
                }
            })
            .catch((error) =>
            {
                throw error;
            });
        }

        // Benutzer hat den Bot aus der Freundesliste entfernt, auch aus der
        // DB entfernen
        if(relationshipStatus === this.Steam.EFriendRelationship.None)
        {
            this.dbhandler.isRegisteredBySteam64Id(steam64id).then((isRegistered) =>
            {
                if(isRegistered)
                {
                    this.dbhandler.removeUser(steam64id);
                    this.steamFriends.removeFriend(steam64id);
                }
            })
            .catch((error) => {
                throw error;
            });
        }
    }



    /**
     *  Initializes Steam
     */
    initSteam()
    {
        var _self = this;
        // Try to use saved server list, else use precompiled
        if (this.fs.existsSync('./config/.steamservers'))
        {
            let steamServers = null;

            try
            {
                steamServers = JSON.parse(fs.readFileSync('./config/.steamservers'));
            }
            catch (e)
            {
                console.log("Could not read .steamservers file in config directory. Please delete it!");
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
                _self.fs.writeFile('./config/.steamservers');
            }
            catch (e) {
                console.log('Could not write down new steam servers!');
                console.log(e.message);
            }

            _self.Steam.servers = servers;
        });



        //Steam Connected Event
        this.bot.on('connected', function ()
        {
            _self.steamUser.logOn(_self.config.steamConfig);
        });


        //TODO: Friendrequest-Event and Relationship-Event do the same stuff, put them in one method
        //Friendrequest event
        this.steamFriends.on('friend', (steam64id, relationshipStatus) => {
            this.onFriendRequest(steam64id, relationshipStatus);
        });


        //Relationship event
        this.steamFriends.on('relationships', (steam64id, relationshipStatus) => {
            this.onRelationshipChange(steam64id, relationshipStatus);
        });


        //Steam Login Event
        this.bot.on('logOnResponse', (response) => {
            if(response.eresult === _self.Steam.EResult.OK)
            {
                console.log("Steam Logged On!");
            }
            else
            {
                console.log("Steam Failed!");
                process.exit(1);
            }

            //Set online
            _self.steamFriends.setPersonaState(this.Steam.EPersonaState.Online);

            //Start CSGO interface
            _self.CSGOCli.launch();
            _self.CSGOCli.on('ready', () =>
            {
                console.log("CSGO interface ready!");
            });
        });
    };
}

module.exports = SteamHelper;