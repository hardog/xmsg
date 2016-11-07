var xmsg = require('../');

// 8kb
var buf = new Buffer(Array(8 * 1024).join('a'));

function more(){
    for(var i = 0; i < 1; i++){
        xmsg.send_one('127.0.0.1:3001', 'fn', buf.toString());
    }

    setImmediate(more);
}

more();