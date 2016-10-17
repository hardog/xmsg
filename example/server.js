var xmsg = require('../');
var pmid = +process.env.pm_id;

// start by pm2
// $ pm2 start server.js -i 3
xmsg.create_server(3001 + pmid, {
    fn: function(data, res){
       console.log('data', data);
       res('xx');
    }
});

