var xmsg = require('../');
var pmid = +process.env.pm_id || 0;

// start by pm2
// $ pm2 start server.js -i 3
xmsg.set('profile', true);
xmsg.create_server(3001 + pmid, {
    fn: function(data, res){
        console.log('GET DATA:', data);
        res('xx');
    }
});