var xmsg = require('../');
var size = process.argv[2];

xmsg.set('profile', false);

size = size || 8;
var cnt = 1000;
var buf = new Buffer(Array(size * 1024).join('a'));
function more(){
    for(var i = 0; i < cnt; i++){
        xmsg.send_one('0.0.0.0:3001', 'fn', buf.toString());
    }

    setImmediate(more);
}

more();
