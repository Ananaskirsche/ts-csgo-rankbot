const config = require('../config/config.js');
const mysql = require('mysql');

/**
 *
 * @param tsUID
 * @param steamID64
 */
exports.registerIdentity = function (tsUID, steamID64)
{
    let connection = mysql.createConnection({
        host: config.dbConfig.host,
        port: config.dbConfig.port,
        user: config.dbConfig.username,
        password: config.dbConfig.password,
        database: config.dbConfig.database
    });

    connection.connect();

    let sql = "INSERT INTO profiles(steamid64, tsuid) VALUES (?,?);";
    let inserts = [steamID64, tsUID];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

    connection.commit();
    connection.end();
};



/**
 *
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

    let sql = "UPDATE profiles SET active = true WHERE steamid64 = ?;";
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

    let sql = "UPDATE profiles SET active = false WHERE steamid64 = ?;";
    let inserts = [steamID64];
    sql = mysql.format(sql, inserts);

    connection.query(sql);

    connection.commit();
    connection.end();
};



/**
 * Checks if user is registered
 * @param steam64id
 */
exports.isRegistered = function (steam64id) {
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



exports.removeUser = function (steam64id)
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

    connection.commit();
    connection.end();
};