var xmsg = require('../');
var size = +process.argv[2];

var targets = [
    ['127.0.0.1:3001', 'fn'],
    ['127.0.0.1:3002', 'fn'],
    ['127.0.0.1:3003', 'fn']
];

xmsg.set('profile', true);
var buf = new Buffer(Array(size * 1024).join('a'));
xmsg.send_one('0.0.0.0:3001', 'fn', buf.toString());