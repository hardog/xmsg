var _ = require('lodash');

//----------- before send data -------------//
var dereal_args = function(data){
    switch(data){
        case null: return '$null$';
        case undefined: return '$undefined$';
        default: return data;
    }
};
exports.dereal_args = dereal_args;

exports.kv_pair = function(data){
    if(!_.isObject(data)){ 
        return [false, dereal_args(data)]; 
    }

    var keys = [], values = [];

    for(var k in data) {
        keys.push(k);
        values.push(dereal_args(data[k]));
    }

    return [keys, values];
};

//--------- after received data ----------//
var real_args = function(data){
    switch(data){
        case '$null$': return null;
        case '$undefined$': return undefined;
        default: return data;
    }
};
exports.real_args = real_args;

var compose_kv = function(keys, values){
    if(!keys){ 
        return real_args(values); 
    }
    
    var data = {};
    _.each(keys, function(v, k){
        data[v] = real_args(values[k]);
    });

    return data;
};

// args like [action, keys:[], ...values, reply-cb]
// action like: a.b which a.b = () => {}
exports.parse_args = function(args){
    args = args || [];

    var reply = args.pop();
    var fn_name = (args.shift() || '');
    var fn_names = fn_name.split('.');
    var keys = args.shift();
    var values = (!keys ? args[0] : args);
    var data = compose_kv(keys, values);

    return [reply, fn_names, data];
};