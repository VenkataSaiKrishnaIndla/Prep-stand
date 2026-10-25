const mongoose = require("mongoose");
const dns = require("node:dns");

dns.setServers(["10.70.39.126"]);

const dbConnection = async () => {
    return mongoose.connect(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 15000
    });
};

module.exports = dbConnection;