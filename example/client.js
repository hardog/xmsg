var xmsg = require('../');

var targets = [
    // ['127.0.0.1:3001', 'fn'],
    // ['127.0.0.1:3002', 'fn'],
    ['192.168.40.35:3001', 'fn']
];

xmsg.set('profile', true);
// xmsg.send_bunch(targets, 'hello');
var i = 0;
// setInterval(() => {
    xmsg.send_one('192.168.40.35:3001', 'fn', 'hello' + i++);
// }, 100);