var xmsg = require('../');
var size = process.argv[2];
var en = process.argv[3];

xmsg.set('profile', false);

// 目前已知centos 6 由于不会及时清除内存，请求量大到一定程度会导致内存暴涨
// 4C4G  41800ops/s
size = size || 8;
var mc;
var cnt = 1000;
var buf = new Buffer(Array(size * 1024).join('a'));
var startCount = (en !== undefined ? true : false);
function more(){
    // mc = process.memoryUsage();
    // console.log(mc.rss, mc.heapTotal, mc.heapUsed);
    for(var i = 0; i < cnt; i++){
        xmsg.send_one('0.0.0.0:3001', 'fn', buf.toString());
    }

    if(startCount && !en--){process.exit(0);}

    setImmediate(more);
}

more();
