var xmsg = require('../');

var targets = [
    ['127.0.0.1:3001', 'fn'],
    ['127.0.0.1:3002', 'fn'],
    ['127.0.0.1:3003', 'fn']
];

xmsg.set('profile', true);
xmsg.send_bunch(targets, 'hello');