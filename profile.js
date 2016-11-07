var _     = require('lodash');

var start = function(tag, args){
    var ts = Date.now();
    var hr = process.hrtime();
    var profile = {
        _tag: tag + '-' + ts + '-' + hr[1],
        _time: ts
    };

    // data
    if(!_.isObject(args)){
        profile._un = args;
        return profile;
    }

    return _.assignIn(args, profile);
};

var land = function(args){
    var ts = Date.now();
    var profile = {
        _tag: args._tag || 'NONE',
        _network1: ts - args._time || 0,
        _fn: ts
    };

    if(args._un !== undefined){
        return [profile, args._un];
    }

    delete args._tag;
    delete args._time;

    return [profile, args];
};

var wrap_reply = function(p, reply){
    return function(data){
        var ts = Date.now();
        p._fn = ts - p._fn || 0;
        p._network2 = ts;

        reply([p, data]);
    };
};

var show = function(p){
    p._network2 = Date.now() - p._network2 || 0;
    console.log('Tag: ' + p._tag + 
                ', Network1: ' + p._network1 + 
                'ms, Fn: ' + p._fn + 
                'ms, Network2: ' + p._network2 + 
                'ms');
};

exports.start = start;
exports.land = land;
exports.wrap_reply = wrap_reply;
exports.show = show;