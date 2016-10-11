'use strict';
const axon  = require('axon');
const _     = require('lodash');
const parse = require('./parse');

let respond_msg = (args, action) => {
    action = action || {};
    let parsed = parse.parse_args(args);
    let reply = parsed[0];
    let fn_names = parsed[1];
    let data = parsed[2];

    if(!reply || !fn_names || !fn_names[0]){
        let actionstr = fn_names.join('.');
        let datastr = JSON.stringify(data);
        reply({
            msg: `illegal args.(action:${actionstr}, data:${datastr})`, 
            status: false
        });
        return;
    }

    let first_fn = action[fn_names[0]];
    let exec_fn = first_fn;
    if(fn_names.length > 1 && _.isObject(first_fn)){
        exec_fn = first_fn[fn_names[1]];
    }

    if(_.isFunction(exec_fn)){
        exec_fn(data, reply);
    }
};

let empty_fn = (e) => console.error(e);
exports.create_server = (port, action, cb) => {
    let socket = axon.socket('rep');
    cb = cb || empty_fn;

    socket.bind(port);
    socket.on('error', cb);
    socket.on('message', function(){
        respond_msg(_.toArray(arguments), action);
    });

    return socket;
};

let req_server = (addr, parsed_data, resolve, cb) => {
    cb = cb || empty_fn;
    parsed_data = parsed_data || [];

    let socket = axon.socket('req');
    socket.connect(`tcp://${addr}`);
    socket.on('error', cb);
    parsed_data.push((res) => {
        socket.close();
        socket = null;
        resolve(res);
    });

    socket.send.apply(socket, parsed_data);
};

// target like 127.0.0.1@create
let send_one = (target, data, cb) => {
    let parsed = parse.parse_target(target);
    let addr = parsed[0];
    let action = parsed[1];

    if(!addr || !action){
        cb({
            msg: `parse target error.(addr:${addr}, action:${action})`,
            status: false,
            stack: __filename
        });
        return;
    }

    let pair_data = parse.kv_pair(data);
    let parsed_data = [action, pair_data[0]];

    parsed_data = parsed_data.concat(pair_data[1]);

    return new Promise((resolve) => {
        req_server(addr, parsed_data, resolve, cb);
    });
};
exports.send_one = send_one;

exports.send_bunch = (targets, data, cb) => {
    let bunch_promises = [];

    _.each(targets, (target) => {
        bunch_promises.push(send_one(target, data, cb));
    });

    return Promise.all(bunch_promises);
};