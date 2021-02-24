const express = require('express');
const helmet = require('helmet');
const https = require('https');
const http = require('http');
const cors = require('cors');
const fs = require('fs');

class ExpressServer {
    constructor(bot) {
        this.app = express();
        this.bot = bot;

        if (process.env.EXPRESS_CORS === 'true') {
            const origins = (process.env.EXPRESS_CORS_ORIGIN || []).split(',');
            const corsOptions = {
                origin: (origin, callback) => {
                    if (origins.indexOf(origin) !== -1 || origins.indexOf('*') !== -1) {
                      callback(null, true)
                    } else {
                      callback(null, false)
                    }
                  },
                methods: process.env.EXPRESS_CORS_METHODS || '*',
                optionsSuccessStatus: 200
            };

            this.app.use(cors(corsOptions));
            bot.logger.info('Express', 'CORS enabled');
        }
        else {
            bot.logger.info('Express', 'CORS DISABLED');
        }

        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
        this.app.use(helmet());

        require('./endpoints')(this.app, bot);
    }

    start() {
        try {
            if (process.env.SECURITY_SSL === 'true' && process.env.SECURITY_CERT && process.env.SECURITY_KEY)
            {
                https.createServer({
                    cert: fs.readFileSync(process.env.SECURITY_CERT),
                    key: fs.readFileSync(process.env.SECURITY_KEY)
                }, this.app)
                .listen(process.env.EXPRESS_PORT);

                this.bot.logger.info('Express', 'HTTPS Listening on port ' + process.env.EXPRESS_PORT);
            }
            else {
                http.createServer(this.app).listen(process.env.EXPRESS_PORT);

                this.bot.logger.info('Express', 'HTTP Listening on port ' + process.env.EXPRESS_PORT);
            }
        }
        catch (err) {
            this.bot.logger.error('Express', err);
        }
    }
}

module.exports = (bot) => new ExpressServer(bot);
