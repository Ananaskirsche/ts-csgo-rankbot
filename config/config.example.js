exports.tsConfig = {
    host: "localhost",
    queryport: 10022,
    serverport: 9987,
    username: 'serveradmin',
    password: 'secret',
    nickname: 'Alfredo',
    ssh: false,
    ts_welcomechannel_id: 0
};

exports.steamConfig = {
    //Steam Guard is not supported, you need to turn it off
    account_name: "username",
    password: "secret"
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

