class SteamHelper
{
    /**
     * Constructor
     */
    constructor(){
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
    }



    /**
     * Returns the rank of a steam user
     * @param steam64id
     */
    getUserRank(steam64id) {
        return null;
    }



    /**
     * Event when Steam relationship status changes
     * @param steam64id
     * @param relationshipStatus
     */
    onRelationshipChange (steam64id, relationshipStatus){
        if(relationshipStatus === this.Steam.EFriendRelationship.RequestRecipient)
        {
            if (this.dbhandler.isRegistered(steam64id))
            {
                this.steamFriends.addFriend(steam64id);
                this.dbhandler.setSteamId64Active(steam64id);
            }
            else
            {
                this.steamFriends.removeFriend(steam64id);
            }
        }

        // Benutzer hat den Bot aus der Freundesliste entfernt, auch aus der
        // DB entfernen
        if(relationshipStatus === this.Steam.EFriendRelationship.Invalid)
        {
            if (this.dbhandler.isRegistered(steam64id))
            {
                this.dbhandler.removeUser(steam64id);
                this.steamFriends.removeFriend(steam64id);
            }
        }
    }


    /**
     * Event when Steam receives a friend request
     */
    onFriendRequest(steam64id, relationshipStatus){
        if(relationshipStatus === this.Steam.EFriendRelationship.RequestRecipient)
        {
            if(this.dbhandler.isRegistered(steam64id))
            {
                this.steamFriends.addFriend(steam64id);
                this.dbhandler.setSteamId64Active(steam64id);
            }
            else
            {
                this.steamFriends.removeFriend(steam64id);
            }
        }
    }



    /**
     *  Initializes Steam
     */
    initSteam(){
        var _self = this;
        // if we've saved a server list, use it
        if (this.fs.existsSync('./config/.steamservers')) {
            let steamServers = null;

            try{
                steamServers = JSON.parse(fs.readFileSync('./config/.steamservers'));
            }
            catch (e) {
                console.log("Could not read .steamservers file in config directory. Please delete it!");
                steamServers = JSON.parse(`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`);
            }

            this.Steam.servers = steamServers;
        }
        else {
            this.Steam.servers = JSON.parse(`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`);
        }



        //Verbindung zu Steam herstellen
        this.bot.connect();



        //Server List Update Event
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



        //Freundschaftsanfragen-Event abonnieren
        this.steamFriends.on('friend', (steam64id, relationshipStatus) => {
            this.onFriendRequest(steam64id, relationshipStatus);
        });



        this.steamFriends.on('relationships', (steam64id, relationshipStatus) => {
            this.onRelationshipChange(steam64id, relationshipStatus);
        });



        //Steam LogOn Response
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

            //Auf Online setzen
            _self.steamFriends.setPersonaState(this.Steam.EPersonaState.Online);

            //CSGO starten
            _self.CSGOCli.launch();
            _self.CSGOCli.on('ready', () => {
                console.log("CSGO started");
            });
        });
    };
}

module.exports = SteamHelper;