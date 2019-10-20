exports.tsConfig = {
    host: "localhost",
    queryport: 10011,
    serverport: 9987,
    username: 'serveradmin',
    password: 'secret',
    nickname: 'Alfredo',
    ssh: false,
    ts_welcomechannel_id: 0
};

/**
 * you need to either turn off steam guard or provide the steam guard key
 * which you receive via email or authenticator app
 * start this application once to get an email notification
 */
exports.steamConfig = {

    account_name: "username",
    password: "password",

    //steam guard code from email
    auth_code: ""
};

exports.dbConfig = {
    host: "localhost",
    port: 3306,
    username: "",
    password: "",
    database: ""
};

exports.botConfig = {
    //Supported languages: en, de
    language: "en",
    greetingMessage: "Welcome!",
    //Every n minute check for rank change
    checkIntervalTime: 10
};

exports.tsRankSgids = {
    unranked: 0,
    silver_1: 1,
    silver_2: 2,
    silver_3: 3,
    silver_4: 4,
    silver_elite: 5,
    silver_elite_master: 6,
    gold_nova_1: 7,
    gold_nova_2: 8,
    gold_nova_3: 9,
    gold_nova_master: 10,
    master_guardian_1: 11,
    master_guardian_2: 12,
    master_guardian_elite: 13,
    distinguished_master_guardian: 14,
    legendary_eagle: 15,
    legendary_eagle_master: 16,
    supreme_master: 17,
    global_elite: 18
};

