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
        this.tsRankSgids = [];
        this.logger = require('./LogHelper')(__filename);
        this.steamProfileUrl = null;

        //Build tsRankSgids so we have it ready when needed, because of performance
        for(let value of Object.values(this.config.tsRankSgids))
        {
            this.tsRankSgids.push(value);
        }
    }



    /**
     * Sets the steamProfileUrl
     * @param profileUrl
     */
    setSteamProfileUrl(profileUrl)
    {
        this.steamProfileUrl = profileUrl;
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
                rankGroupId = this.config.tsRankSgids.unranked;
                break;
            case 1:
                rankGroupId = this.config.tsRankSgids.silver_1;
                break;
            case 2:
                rankGroupId = this.config.tsRankSgids.silver_2;
                break;
            case 3:
                rankGroupId = this.config.tsRankSgids.silver_3;
                break;
            case 4:
                rankGroupId = this.config.tsRankSgids.silver_4;
                break;
            case 5:
                rankGroupId = this.config.tsRankSgids.silver_elite;
                break;
            case 6:
                rankGroupId = this.config.tsRankSgids.silver_elite_master;
                break;
            case 7:
                rankGroupId = this.config.tsRankSgids.gold_nova_1;
                break;
            case 8:
                rankGroupId = this.config.tsRankSgids.gold_nova_2;
                break;
            case 9:
                rankGroupId = this.config.tsRankSgids.gold_nova_3;
                break;
            case 10:
                rankGroupId = this.config.tsRankSgids.gold_nova_master;
                break;
            case 11:
                rankGroupId = this.config.tsRankSgids.master_guardian_1;
                break;
            case 12:
                rankGroupId = this.config.tsRankSgids.master_guardian_2;
                break;
            case 13:
                rankGroupId = this.config.tsRankSgids.master_guardian_elite;
                break;
            case 14:
                rankGroupId = this.config.tsRankSgids.distinguished_master_guardian;
                break;
            case 15:
                rankGroupId = this.config.tsRankSgids.legendary_eagle;
                break;
            case 16:
                rankGroupId = this.config.tsRankSgids.legendary_eagle_master;
                break;
            case 17:
                rankGroupId = this.config.tsRankSgids.supreme_master;
                break;
            case 18:
                rankGroupId = this.config.tsRankSgids.global_elite;
                break;
            default:
                rankGroupId = this.config.tsRankSgids.unranked;
                break;
        }


        //Set the rank
        this.ts3.getClientByUID(tsUid).then((tsClient) =>
        {
            this.checkUserRankChanged(rankGroupId, tsClient).then((userRankChanged) =>
            {
                if(userRankChanged)
                {
                    //Remove all ranks
                    tsClient.getInfo().then((info) =>
                    {
                        //Get all sgids which are rank server groups and which are assigned to the ts client
                        let clientGroups = info.client_servergroups;
                        let sgidIntersection = clientGroups.filter(x => this.tsRankSgids.includes(x));


                        //Remove Client from old ranks
                        let intersectionLenght = sgidIntersection.length;
                        for(let i = 0; i < intersectionLenght; i++)
                        {
                            tsClient.serverGroupDel(sgidIntersection[i].toString()).then(() => {})
                            .catch( (err) =>
                            {
                                this.logger.error(`Could not remove user from sgid ${sgidIntersection[i]}`);
                                this.logger.error(err.message);
                            });
                        }


                        //Add new rank
                        this.ts3.getServerGroupByID(rankGroupId).then((serverGroup) =>
                        {
                            serverGroup.addClient( tsClient.getDBID() ).then(() =>
                            {
                                tsClient.message("Your skill group was updated!");
                                this.logger.debug(`Updated skill group of user ${tsClient.getCache().client_nickname}`);
                            })
                            .catch((err) =>
                            {
                                this.logger.error(`An error occured when trying to update ${tsClient.getCache().client_nickname} rank!`);
                                this.logger.error(err);
                            });
                        });
                    })
                    .catch((err) =>
                    {
                        this.logger.error(err);
                    });
                }
                else
                {
                    tsClient.message("Your skill group has not changed!");
                }
            });
        }).catch((err) =>
        {
            this.logger.error(err);
        });
    }



    /**
     * Gets steam64id from community url and then
     * performs database operations to register the user
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
                //steam64id from profile
                let steamId64 = result.profile.steamID64[0];

                //Check if already registered
                this.dbhandler.isRegisteredBySteam64Id(steamId64).then((isRegistered) =>
                {
                    //If not registered, add him to db
                    if(!isRegistered)
                    {
                        this.dbhandler.registerIdentity(tsUid, steamId64);
                        this.logger.debug(`New user ${tsNick} added to database`);
                    }
                    else
                    {
                        this.logger.debug(`${tsNick} tried to register, but already is in database`);
                    }


                    //Message the user
                    this.ts3.getClientByUID(tsUid).then((tsClient) =>
                    {
                        if(isRegistered)
                        {
                            tsClient.message("You are already registered! To update your current rank try !update");
                        }
                        else
                        {
                            tsClient.message("Successfully registered!");
                            if(this.steamProfileUrl !== null)
                            {
                                tsClient.message("You need to add the bot to your friendlist! " +
                                    "Please add [URL]" + this.steamProfileUrl + "/[/URL]!");
                            }
                        }
                    })
                    .catch((err) =>
                    {
                        this.logger.error("An error occurred when trying to get user " + tsUid);
                        this.logger.error(err);
                    });
                })
                .catch((error) =>
                {
                    this.logger.error(error);
                });
            })
        })
        .catch(function (err)
        {
            this.logger.error(err);
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
            ev.invoker.message("!status - Zeigt, ob du bereits verknüpft bist!");
            ev.invoker.message("!update - Überprüft sofort, ob sich dein Rang geändert hat!");
        }


        //Register Befehl
        else if(args[0].toLowerCase() === "!register")
        {
            this.logger.debug(`User ${ev.invoker.getCache().client_nickname} issued register command`);

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
        else if(args[0].toLowerCase() === "!update")
        {
            this.dbhandler.isRegisteredByTsUid(ev.invoker.getUID()).then((isRegistered) =>
            {
                if(!isRegistered)
                {
                    ev.invoker.message("You are not registered yet. Please use !register");
                    return;
                }

                let tsNick = ev.invoker.getCache().client_nickname;

                this.logger.debug(`User ${tsNick} issued update command`);
                if(this.steamHelper != null)
                {
                    this.logger.debug(`Getting steam64id of ${tsNick}`);
                    this.dbhandler.getSteam64Id(ev.invoker.getUID()).then((steam64Id) =>
                    {
                        this.logger.debug(`Updating rank of ${tsNick}`);
                        this.steamHelper.updateUserRank(steam64Id, ev.invoker.getUID());
                    })
                        .catch((err) =>
                        {
                            this.logger.error(`An error occured when trying to get steam64id(${ev.invoker.getUID()}) from db`);
                            this.logger.error(err);
                            ev.invoker.message("An error occured!");
                        });
                }
            })
            .catch((err) => {
                ev.invoker.message("An error occurred!");
                this.logger.error(err);
            });
        }


        //Status Befehl
        else if(args[0].toLowerCase() === "!status")
        {
            this.dbhandler.isRegisteredByTsUid(ev.invoker.getUID()).then((isRegistered) =>
            {
                if(isRegistered)
                {
                    ev.invoker.message("You are already registered!");
                }
                else
                {
                    ev.invoker.message("You are not registered yet!");
                }

            })
            .catch((err) => {
                 ev.invoker.message("An error occurred!");
                 this.logger.error(err);
            });
        }
    }



    /**
     *  Initalizes Teamspeak, connects to server
     */
    initTeamspeak(){
        this.logger.debug("Initializing teamspeak interface");
        this.logger.info("Connecting to teamspeak...");

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
            this.logger.debug(`Client ${client.getCache().client_nickname} just connected`);
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


        this.ts3.on('textmessage', ev => { this.onMessageReceived(ev); });
        this.ts3.on("error", e => this.logger.error(e.message));
        this.ts3.on("close", e => this.logger.error("Connection has been lost! ", e.message) );
    }



    /**
     * Checks if a given teamspeak client is in the given server rank group.
     * @param rankGroupId The Teamspeak sgid of the rank server group
     * @param tsClient The Teamspeak Client to check
     * @returns {Promise<any>}
     */
    checkUserRankChanged(rankGroupId, tsClient)
    {
        return new Promise((resolve,reject) =>
        {
            this.ts3.getServerGroupByID(rankGroupId).then((tsGroup) =>
            {
                tsGroup.clientList().then((clientList) =>
                {
                    //if client has no groups at all, clientList will be null
                    if(clientList === null)
                    {
                        resolve(true);
                        return;
                    }

                    //Iterate through all members of group
                    let clientListLenght = clientList.length;
                    let searchTsClientUID = tsClient.getUID();
                    for(let i = 0; i < clientListLenght; i++)
                    {
                        let clientListEntry = clientList[i];
                        if(clientListEntry.client_unique_identifier === searchTsClientUID)
                        {
                            resolve(false);
                            return;
                        }
                    }
                    resolve(true);
                })
                .catch((err) =>
                {
                    reject(err);
                });
            })
            .catch((err) =>
            {
                reject(err);
            });
        });
    }
}

module.exports = TeamspeakHelper;