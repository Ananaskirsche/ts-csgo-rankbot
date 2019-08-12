const config = require('../config/config.js');
const mysql = require('mysql');

/**
 * Returns the steam64id for the connected ts uid
 * @param tsuid
 */
exports.getSteam64Id = function(tsuid){
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection({
            host: config.dbConfig.host,
            port: config.dbConfig.port,
            user: config.dbConfig.username,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        connection.connect();

        let sql = "SELECT steamid64 FROM profiles WHERE tsuid = ?";
        let inserts = [tsuid];
        sql = mysql.format(sql, inserts);

        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }

            resolve(result[0].steamid64);
        });

        connection.commit();
        connection.end();
    });
};



/**
 * Returns the Teamspeak UID for the connected steam64id
 * @param steam64id
 */
exports.getTsuid = function(steam64id){
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection({
            host: config.dbConfig.host,
            port: config.dbConfig.port,
            user: config.dbConfig.username,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        connection.connect();

        let sql = "SELECT tsuid FROM profiles WHERE steamid64 = ?";
        let inserts = [steam64id];
        sql = mysql.format(sql, inserts);

        connection.query(sql, (err, result) => {
            if (err){
                return reject(err);
            }

            resolve(result[0].tsuid);
        });

        connection.commit();
        connection.end();
    });
};



/**
 * Returns all registered tsUids
 */
exports.getAllActiveTsUids = function(){
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection({
            host: config.dbConfig.host,
            port: config.dbConfig.port,
            user: config.dbConfig.username,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        connection.connect();

        let sql = "SELECT tsuid FROM profiles WHERE active = 1";
        sql = mysql.format(sql);

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

        connection.commit();
        connection.end();
    });
};



/**
 * Adds an new identity to the database
 * @param tsUID
 * @param steamID64
 */
exports.addIdentity = function (tsUID, steamID64)
{
    let connection = mysql.createConnection({
        host: config.dbConfig.host,
        port: config.dbConfig.port,
        user: config.dbConfig.username,
        password: config.dbConfig.password,
        database: config.dbConfig.database
    });

    connection.connect();

    let sql = "INSERT INTO profiles(steamid64, tsuid) VALUES (?,?)";
    let inserts = [steamID64, tsUID];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

    connection.commit();
    connection.end();
};







/**
 * Sets the given steam64id active
 * @param steamID64
 */
exports.setSteamId64Active = function (steamID64) {
    let connection = mysql.createConnection({
        host: config.dbConfig.host,
        port: config.dbConfig.port,
        user: config.dbConfig.username,
        password: config.dbConfig.password,
        database: config.dbConfig.database
    });

    connection.connect();

    let sql = "UPDATE profiles SET active = true WHERE steamid64 = ?";
    let inserts = [steamID64];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

    connection.commit();
    connection.end();
};



/**
 *
 * @param steam64id
 */
exports.setSteamId64Inactive = function(steam64id){
    let connection = mysql.createConnection({
        host: config.dbConfig.host,
        port: config.dbConfig.port,
        user: config.dbConfig.username,
        password: config.dbConfig.password,
        database: config.dbConfig.database
    });

    connection.connect();

    let sql = "UPDATE profiles SET active = false WHERE steamid64 = ?";
    let inserts = [steam64id];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

    connection.commit();
    connection.end();
};



/**
 * Checks if user is registered by checking given tsuid
 * @param tsuid
 */
exports.isRegisteredByTsUid = function (tsuid) {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection({
            host: config.dbConfig.host,
            port: config.dbConfig.port,
            user: config.dbConfig.username,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        connection.connect();

        let sql = "SELECT COUNT(steamid64) AS 'idCount' FROM profiles WHERE tsuid = ?";
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

        connection.commit();
        connection.end();
    });
};



/**
 * Checks if user is registered by checking given steam64id
 * @param steam64id
 */
exports.isRegisteredBySteam64Id = function (steam64id) {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection({
            host: config.dbConfig.host,
            port: config.dbConfig.port,
            user: config.dbConfig.username,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        connection.connect();

        let sql = "SELECT COUNT(steamid64) AS 'idCount' FROM profiles WHERE steamid64 = ?";
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

        connection.commit();
        connection.end();
    });
};



/**
 * Deletes the identity from the database
 * @param steam64id Steam64Id of the connected Identity
 */
exports.deleteIdentity = function (steam64id)
{
    let connection = mysql.createConnection({
        host: config.dbConfig.host,
        port: config.dbConfig.port,
        user: config.dbConfig.username,
        password: config.dbConfig.password,
        database: config.dbConfig.database
    });

    connection.connect();

    let sql = "DELETE FROM profiles WHERE steamid64 = ?";
    let inserts = [steam64id];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

    connection.commit();
    connection.end();
};