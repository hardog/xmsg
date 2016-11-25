var xmsg = require('../');
var size = process.argv[2];

var n = 0;
var ops = 200000;
var prev = undefined;
var r;

xmsg.set('profile', false);
xmsg.create_server(3001, {
    fn: function(data, res){
        if(!prev){
            prev = Date.now();
        }

        if(++n % ops == 0){
            var ms = Date.now() - prev;
            var s = ms / 1000;
            var persec = parseInt(ops / s || 0);
            if(!r) r = persec;
            else if(r < persec) r = persec;
            console.log(persec + ' op/s ' + size + 'kb!');
            console.log(new Date() + ', total:' + ops + 'ops in ' + s + 's!');
            var mc = process.memoryUsage();
            console.log(mc.rss, mc.heapTotal, mc.heapUsed);
            prev = undefined;
            n = 0;
        }

        res();
    }
});

function done(){
    console.log('max is:', r, ' ops/s, ', size, 'kb');
    process.exit(0);
}

process.on('SIGINT', done);