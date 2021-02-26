module.exports = (app, bot) => {
    require('./hello')(app, bot);
    require('./welcome')(app, bot);
    require('./test')(app, bot);
};
