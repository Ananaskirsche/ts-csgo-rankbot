class TeamspeakHelper
{
    /**
     * Constructor
     * Registers all necessary node modules
     */
    constructor()
    {
        this.rp = require('request-promise');
        this.xml = require('xml2js');
        this.dbhandler = require('./database.js');
        this.TeamSpeak = require("ts3-nodejs-library");
        this.config = require('../config/config.js');
        this.steamHelper = null;
        this.URL = require('url');
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
            let url = this.URL.parse(urlString);
            return !(url.hostname === null || url.hostname !== "steamcommunity.com");
        }
        catch (e) {
            return false;
        }
    }



    /**
     * Sets Rank in Teamspeak depending von given CS:GO Rank
     * @param tsUid
     * @param csRank
     */
    setRank(tsUid, csRank)
    {
        let rankGroupId = null;

        switch (csRank)
        {
            case 0:
                rankGroupId = this.config.tsRankIds.unranked;
                break;
            case 1:
                rankGroupId = this.config.tsRankIds.silver_1;
                break;
            case 2:
                rankGroupId = this.config.tsRankIds.silver_2;
                break;
            case 3:
                rankGroupId = this.config.tsRankIds.silver_3;
                break;
            case 4:
                rankGroupId = this.config.tsRankIds.silver_4;
                break;
            case 5:
                rankGroupId = this.config.tsRankIds.silver_elite;
                break;
            case 6:
                rankGroupId = this.config.tsRankIds.silver_elite_master;
                break;
            case 7:
                rankGroupId = this.config.tsRankIds.gold_nova_1;
                break;
            case 8:
                rankGroupId = this.config.tsRankIds.gold_nova_2;
                break;
            case 9:
                rankGroupId = this.config.tsRankIds.gold_nova_3;
                break;
            case 10:
                rankGroupId = this.config.tsRankIds.gold_nova_master;
                break;
            case 11:
                rankGroupId = this.config.tsRankIds.master_guardian_1;
                break;
            case 12:
                rankGroupId = this.config.tsRankIds.master_guardian_2;
                break;
            case 13:
                rankGroupId = this.config.tsRankIds.master_guardian_elite;
                break;
            case 14:
                rankGroupId = this.config.tsRankIds.distinguished_master_guardian;
                break;
            case 15:
                rankGroupId = this.config.tsRankIds.legendary_eagle;
                break;
            case 16:
                rankGroupId = this.config.tsRankIds.legendary_eagle_master;
                break;
            case 17:
                rankGroupId = this.config.tsRankIds.supreme_master;
                break;
            case 18:
                rankGroupId = this.config.tsRankIds.global_elite;
                break;
            default:
                rankGroupId = this.config.tsRankIds.unranked;
                break;
        }

        this.ts3.getServerGroupByID(this.rankGroupId).then((serverGroup) =>
        {
            this.ts3.getClientByUID(tsUid).then((tsClient) =>
            {
                serverGroup.addClient( tsClient.getDBID() ).catch(() =>
                {
                    console.log("An error occured when trying to update user ranks!");
                });
            });
        });
    }



    /**
     * TODO: RENAME METHOD TO SOMETHING MORE UNDERSTANDABLE
     * Registers user
     * @param communityUrl
     * @param tsUid
     * @param tsNick
     */
    getSteamIdFromProfile(communityUrl, tsUid, tsNick)
    {
        this.rp(communityUrl).then((data) =>
        {
            let parser = new this.xml.Parser();
            parser.parseString(data, (err, result) =>
            {
                let steamId64 = result.profile.steamID64[0];

                this.dbhandler.isRegistered(steamId64).then((isRegistered) =>
                {
                    if(!isRegistered)
                    {
                        this.dbhandler.registerIdentity(tsUid, steamId64);
                        console.log("Registered new user " + tsNick + "!");
                    }
                    else
                    {
                        console.log("User " + tsNick + " was already registered!");
                    }
                })
                .catch((error) =>
                {
                    console.log(error);
                });
            })
        })
        .catch(function (err)
        {
            console.log(err);
        });
    };



    /**
     * Executed when a message is received
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

        let args = ev.msg.split(" ");


        //Help Befehl
        if(args[0].toLowerCase() === "!help")
        {
            ev.invoker.message("!register - Verknüpft deine TS-Identität mit deinem Steamprofil!");
            ev.invoker.message("!unregister - Entfernt deine Verknüpfung");
            ev.invoker.message("!status - Zeigt, ob du bereits verknüpft bist!");
            ev.invoker.message("!update - Überprüft sofort, ob sich dein Rang geändert hat!");
        }


        //Register Befehl
        if(args[0].toLowerCase() === "!register")
        {
            console.log("User " + ev.invoker.getCache().client_nickname + " registriert sich");

            //Parameter holen
            let msg = ev.msg;
            let args = msg.split(" ");

            //URL bauen & validieren
            let communityUrl = args[1];
            communityUrl = communityUrl.replace("[URL]", "");
            communityUrl = communityUrl.replace("[/URL]", "");

            if(this.isValidUrl(communityUrl)){
                communityUrl += "/?xml=1"; //Profil als XML
                this.getSteamIdFromProfile(communityUrl, ev.invoker.getUID(), ev.invoker.getCache().client_nickname);
            }
            else
            {
                ev.invoker.message("Deine Profil-URL scheint nicht richtig zu sein!");
            }
        }


        //Instant update
        if(args[0].toLowerCase() === "!update")
        {
            let tsNick = ev.invoker.getCache().client_nickname;

            console.log("Update Befehl von " + tsNick);
            if(this.steamHelper != null)
            {
                console.log("Getting Steam64Id of " + tsNick);
                this.dbhandler.getSteam64Id(ev.invoker.getUID()).then((steam64Id) => {
                    console.log("Updating Rank of " + tsNick);
                    this.steamHelper.updateUserRank(steam64Id, ev.invoker.getUID());
                })
                .catch((err) => {
                    console.log(err);
                    ev.invoker.message("An error occured!");
                });
            }
        }


        //Status Befehl
        if(args[0].toLowerCase() === "!status")
        {

        }
    }



    /**
     *  Initalizes Teamspeak, connects to server
     */
    initTeamspeak(){
        console.log("Starting AK CS:GO Bot...");
        console.log("Connecting to Teamspeak");

        //Create a new Connection
        this.ts3 = new this.TeamSpeak({
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
        this.ts3.on("clientconnect", ev => {
            const client = ev.client;
            console.log(`Client ${client.getCache().client_nickname} just connected`);
            client.message(this.config.botConfig.greetingMessage);
        });


        //What to do, when Bot has finished connecting
        this.ts3.on("ready", () => {
            Promise.all([
                this.ts3.registerEvent("server"),
                this.ts3.registerEvent("channel", this.config.tsConfig.ts_welcomechannel_id),
                this.ts3.registerEvent("textprivate")
            ]).then(() => {
                console.log("Teamspeak ready and connected!")
            }).catch(e => {
                console.log("Could not register event handlers! Bot will not work properly!");
                console.log(e.message);

                process.exit(1);
            });
        });


        this.ts3.on('textmessage', ev => { this.onMessageReceived(ev); });
        this.ts3.on("error", e => console.log("Error", e.message));
        this.ts3.on("close", e => console.log("Connection has been closed!", e));
    }
}

module.exports = TeamspeakHelper;