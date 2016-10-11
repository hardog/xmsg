'use strict';

const _ = require('lodash');

//----------- before send data -------------//
let dereal_args = (data) => {
    switch(data){
        case null: return '$null$';
        case undefined: return '$undefined$';
        default: return data;
    }
};
exports.dereal_args = dereal_args;

exports.kv_pair = (data) => {
    if(!_.isObject(data)){ 
        return [false, dereal_args(data)]; 
    }

    let keys = [], values = [];
    for(let k in data) {
        keys.push(k);
        values.push(dereal_args(data[k]));
    }

    return [keys, values];
};

//--------- after received data ----------//
let real_args = (data) => {
    switch(data){
        case '$null$': return null;
        case '$undefined$': return undefined;
        default: return data;
    }
};
exports.real_args = real_args;

let compose_kv = (keys, values) => {
    if(!keys){ 
        return real_args(values); 
    }

    let data = {};
    _.each(keys, (v, k) => {
        data[v] = real_args(values[k]);
    });

    return data;
};

// args like [action, keys:[], ...values, reply-cb]
// action like: a.b which a.b = () => {}
exports.parse_args = (args) => {
    args = args || [];

    let reply = args.pop();
    let fn_name = (args.shift() || '');
    let fn_names = fn_name.split('.');
    let keys = args.shift();
    let values = (!keys ? args[0] : args);
    let data = compose_kv(keys, values);

    return [reply, fn_names, data];
};