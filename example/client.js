var xmsg = require('../');

var targets = [
    // ['127.0.0.1:3001', 'fn'],
    // ['127.0.0.1:3002', 'fn'],
    ['127.0.0.1:3001', 'fn']
];

xmsg.set('profile', true);
// xmsg.set('sock_timeout', 1);
// xmsg.send_bunch(targets, 'hello');
Promise.resolve()
.then(() => xmsg.send_one('127.0.0.1:3001', 'fn', new Buffer('hello')))
.then((r) => console.log(r));