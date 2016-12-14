var _ = require('lodash');
var os = require('os');

var settings = {
    timeout: 1000
};
exports.set = function(k, v){
    settings[k] = v || 1000;
};

var start = function(tag, args){
    var profile = {
        _target: tag,
        _start: (new Date()).toString(),
        _time: Date.now()
    };

    // data
    if(!_.isObject(args)){
        profile._un = args;
        return profile;
    }

    return _.assignIn(args, profile);
};

var land = function(args){
    args = args || {};
    var ts = Date.now();
    var dura = ts - args._time;
    var profile = {
        _target: args._target || 'NONE',
        _net1: (dura < 0 ? 0 : dura),
        _fn: ts,
        _start: args._start,
        _attach: args._attach || ''
    };

    if(args._un !== undefined){
        return [profile, args._un];
    }

    delete args._target;
    delete args._time;
    delete args._start;
    delete args._attach;

    return [profile, args];
};

var wrap_reply = function(p, reply){
    return function(data){
        var ts = Date.now();
        var dura = ts - p._fn;
        p._fn = (dura < 0 ? 0 : dura);
        p._net2 = ts;

        reply([p, data]);
    };
};

var buf = [];
var timer = null;
// flush function
var flush = function(){
    timer = null;
    console.log(buf.join('\n'));
    buf.length = 0;
}

// write function
var write = function(str){
    if(timer === null){
      timer = setTimeout(flush, settings.timeout);
    }

    buf.push(str);
}

var show = function(p){
    if(!p){return;}
    var dura = Date.now() - p._net2;
    p._net2 = (dura < 0 ? 0 : dura);
    write('Tag:' + (process.title || 'None') +
                ' Host:' + os.hostname() +
                ' Target:' + p._target + 
                ' Start:' + p._start +
                ' Net1:' + p._net1 + 
                'ms Fn:' + p._fn + 
                'ms Net2:' + p._net2 + 
                'ms Attach:' + (p._attach || 'None'));
};

exports.start = start;
exports.land = land;
exports.wrap_reply = wrap_reply;
exports.show = show;