const { createLogger, format, transports } = require('winston');
const path = require('path');
const logDir = "logs";

const logger = caller => {
    return createLogger(
    {
        transports: [
            new transports.Console({level: "debug", colorize: true}),
            new transports.File({
                filename: path.join(logDir, "output.log"),
                level: "debug"
            }),
            new transports.File({
                filename: path.join(logDir, "error.log"),
                level: "error"
            })
        ],
        format: format.combine(
            format.label({label: path.basename(caller)}),
            format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
            format.printf(info => `[${info.timestamp}] [${info.label}] [${info.level}]: ${info.message}`)
        )
    });
};

module.exports = logger;