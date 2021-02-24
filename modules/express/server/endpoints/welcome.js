module.exports = (app, bot) => {
    app.get('/', (req, res) => {
        bot.db.db.collection('qnas').countDocuments()
        .then((count) => res.send('Welcome to Youbot endpoints!<br /> We have ' + count + " QnA's"))
        .catch((err) => bot.logger.error('Express', err));
    });
};
