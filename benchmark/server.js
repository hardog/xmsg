var xmsg = require('../');

var n = 0;
var ops = 10000;
var prev = undefined;

xmsg.create_server(3001, {
    fn: function(data, res){

        if(!prev){
            prev = Date.now();
        }

        if(++n % ops == 0){
            var ms = Date.now() - prev;
            var s = ms / 1000;
            var persec = parseInt(ops / s || 0);
            console.log(persec + ' op/s 8kb!');
            console.log('total ' + ops + 'ops  in ' + s + 's!');
            prev = Date.now();
            process.exit(0);
        }

        res();
    }
});