const https = require("https");
const logger = require('./logger')(__filename);
const xmldoc = require("xmldoc");
const rp = require('request-promise');

class Steam {

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