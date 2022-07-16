const winston = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf, colorize, json } = winston.format;

const options = {
    level: 'debug',
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: '[on] MM-DD-YYYY [at] HH:mm:ss'
        }),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
};

const errorFilter = winston.format((info, opts) => {
    return info.level === 'error' ? info : false;
});

const infoFilter = winston.format((info, opts) => {
    return info.level === 'info' ? info : false;
});

const combinedFileRotateTransport = new winston.transports.DailyRotateFile({
    filename: './logs/%DATE%/combined.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d',
    level: 'info',
    format: combine(
        timestamp({
            format: '[on] MM-DD-YYYY [at] HH:mm:ss'
        }),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    )
});
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
    filename: './logs/%DATE%/errors.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    level: 'error',
    format: combine(
        errorFilter(),
        timestamp({
            format: '[on] MM-DD-YYYY [at] HH:mm'
        }),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    )
});
const infoFileRotateTransport = new winston.transports.DailyRotateFile({
    filename: './logs/%DATE%/info.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    level: 'info',
    format: combine(
        infoFilter(),
        timestamp({
            format: '[on] MM-DD-YYYY [at] HH:mm'
        }),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    )
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.Console(options),
        combinedFileRotateTransport,
        errorFileRotateTransport,
        infoFileRotateTransport
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './logs/exception.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: './logs/rejections.log' }),
    ],
});


module.exports = logger