module.exports = (app, bot) => {
    app.get('/test', async (req, res) => {
        try {
            const count = await bot.db.db.collection('qnas').countDocuments();
            res.json({
                questions: count
            });
        }
        catch (err) {
            res.json({
                error: 'Something went wrong...'
            });
            bot.logger.error('Express', err);
        }
    });

    app.post('/test', async (req, res) => {
        try {
            const adapter = bot.getAdapter('RocketChat');

            await adapter.sendMessage('We have ' + req.body.questions + ' questions (n8n -> youbot)', { channel: 'GENERAL' });

            res.json({
                success: true
            });
        }
        catch (err) {
            res.json({
                error: 'Something went wrong...',
                success: false
            });
            bot.logger.error('Express', err);
        }
    });
};