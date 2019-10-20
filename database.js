const config = require('./config/config.js');
const mysql = require('promise-mysql');

let connection

/**
 * Checks if database server is online by connecting and disconnecting
 * @returns boolean
 */
exports.connect = async function(){
    connection = await mysql.createConnection({
        host: config.dbConfig.host,
        port: config.dbConfig.port,
        user: config.dbConfig.username,
        password: config.dbConfig.password,
        database: config.dbConfig.database
    })
};



/**
 * Returns the steam64id for the connected ts uid
 * @param tsuid
 */
exports.getSteam64Id = function(tsuid) {
    return new Promise((resolve, reject) => {
        let sql = "SELECT steam64id FROM profiles WHERE tsuid = ?";
        let inserts = [tsuid];
        sql = mysql.format(sql, inserts);
    
        connection.query(sql)
        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }
    
            if(result.length > 0){
                if(result[0].hasOwnProperty("steam64id")){
                    resolve(result[0].steam64id);
                }
            }
            resolve(null);
        });
    })
};



/**
 * Returns the Teamspeak UID for the connected steam64id
 * @param steam64id
 */
exports.getTsuid = function(steam64id){
    return new Promise((resolve, reject) => {

        let sql = "SELECT tsuid FROM profiles WHERE steam64id = ?";
        let inserts = [steam64id];
        sql = mysql.format(sql, inserts);

        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }


            if(result.length > 0){
                if(result[0].hasOwnProperty("tsuid")){
                    resolve(result[0].tsuid);
                }
            }
            resolve(null);
        });

    });
};



/**
 * Returns all registered tsUids
 */
exports.getAllActiveTsUids = function(){
    return new Promise((resolve, reject) => {

        let sql = "SELECT tsuid FROM profiles WHERE active = 1";
        //dont needed here
        //sql = mysql.format(sql);

        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }

            let responseArray = [];
            let resultLength = result.length;


            for(let i = 0; i < resultLength; i++)
            {
                responseArray.push(result[i].tsuid);
            }

            resolve(responseArray);
        });

    });
};



/**
 * Adds an new identity to the database
 * @param tsUID
 * @param steam64id
 */
exports.addIdentity = function (tsUID, steam64id){

    let sql = "INSERT INTO profiles(steam64id, tsuid) VALUES (?,?)";
    let inserts = [steam64id, tsUID];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

};







/**
 * Sets the given steam64id active
 * @param steam64id
 */
exports.setSteam64idActive = function (steam64id) {

    let sql = "UPDATE profiles SET active = true WHERE steam64id = ?";
    let inserts = [steam64id];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

};



/**
 *
 * @param steam64id
 */
exports.setSteam64idInactive = function(steam64id){

    let sql = "UPDATE profiles SET active = false WHERE steam64id = ?";
    let inserts = [steam64id];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

};



/**
 * Checks if user is registered by checking given tsuid
 * @param tsuid
 */
exports.isRegisteredByTsUid = function (tsuid) {
    return new Promise((resolve, reject) => {

        let sql = "SELECT COUNT(steam64id) AS 'idCount' FROM profiles WHERE tsuid = ? AND active = 1";
        let inserts = [tsuid];
        sql = mysql.format(sql, inserts);

        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }

            let idCount = result[0].idCount;

            if(idCount === 0){
                return resolve(false);
            }
            else{
                return resolve(true);
            }
        });

    });
};



/**
 * Checks if user is registered by checking given steam64id
 * @param steam64id The steam64id to look for
 * @param inactive Show also inactive
 */
exports.isRegisteredBySteam64Id = function (steam64id, inactive = false) {
    return new Promise((resolve, reject) => {
 
        let sql = "SELECT COUNT(steam64id) AS 'idCount' FROM profiles WHERE steam64id = ?";

        if(!inactive){
            sql += " AND active = 1";
        }

        let inserts = [steam64id];
        sql = mysql.format(sql, inserts);

        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }

            let idCount = result[0].idCount;

            if(idCount === 0){
                return resolve(false);
            }
            else{
                return resolve(true);
            }
        });

    });
};



/**
 * Deletes the identity from the database
 * @param steam64id Steam64Id of the connected Identity
 */
exports.deleteIdentity = function (steam64id) {

    let sql = "DELETE FROM profiles WHERE steam64id = ?";
    let inserts = [steam64id];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

};