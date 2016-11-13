var _ = require('lodash');

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
    var ts = Date.now();
    var profile = {
        _target: args._target || 'NONE',
        _net1: ts - args._time || 0,
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
        p._fn = ts - p._fn || 0;
        p._net2 = ts;

        reply([p, data]);
    };
};

var show = function(p){
    p._net2 = Date.now() - p._net2 || 0;
    console.log('Tag:' + (process.title || 'None') +
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