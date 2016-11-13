var xmsg = require('../');
var size = process.argv[2];

size = size || 8;
var cnt = 1000;

var buf = new Buffer(Array(size * 1024).join('a'));
function more(){
    for(var i = 0; i < cnt; i++){
        xmsg.send_one('192.168.40.35:3001', 'fn', buf.toString());
    }
}

more();
