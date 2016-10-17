var Promise = require('promise');
var axon  = require('axon');
var _     = require('lodash');
var parse = require('./parse');

var respond_msg = function(args, action){
    action = action || {};
    var parsed = parse.parse_args(args);
    var reply = parsed[0];
    var fn_names = parsed[1];
    var data = parsed[2];

    if(!reply || !fn_names || !fn_names[0]){
        var actionstr = fn_names.join('.');
        var datastr = JSON.stringify(data);
        reply({
            msg: 'illegal args.(action:'+ actionstr +', data:'+ datastr +')', 
            status: false,
            stack: __filename
        });
        return;
    }

    var first_fn = action[fn_names[0]];
    var exec_fn = first_fn;
    if(fn_names.length > 1 && _.isObject(first_fn)){
        exec_fn = first_fn[fn_names[1]];
    }

    if(_.isFunction(exec_fn)){
        exec_fn(data, reply);
    }else{
        reply({
            msg: 'no action found',
            status: false,
            stack: __filename
        });
    }
};

var empty_fn = function(e){console.error(e)};
exports.create_server = function(port, action, cb){
    var socket = axon.socket('rep');
    cb = cb || empty_fn;

    socket.bind(port);
    socket.on('error', cb);
    socket.on('message', function(){
        respond_msg(_.toArray(arguments), action);
    });

    return socket;
};

var req_server = function(addr, parsed_data, resolve, cb){
    cb = cb || empty_fn;
    parsed_data = parsed_data || [];

    var socket = axon.socket('req');
    socket.connect('tcp://'+ addr);
    socket.on('error', cb);
    parsed_data.push(function(res){
        socket.close();
        socket = null;
        resolve(res);
    });

    socket.send.apply(socket, parsed_data);
};

// ip like 127.0.0.1:3000, action like: create
var send_one = function(addr, action, data, cb){
    if(!addr || !action){
        return Promise.reject({
            msg: 'parse target error.(addr:'+ addr +', action:'+ action +')',
            status: false,
            stack: __filename
        });
    }

    var pair_data = parse.kv_pair(data);
    var parsed_data = [action, pair_data[0]];

    parsed_data = parsed_data.concat(pair_data[1]);

    return new Promise(function(resolve){
        req_server(addr, parsed_data, resolve, cb);
    });
};
exports.send_one = send_one;

// targets like [['127.0.0.1:3000', 'create'], ['127.0.0.1:3001', 'create']]
exports.send_bunch = function(targets, data, cb){
    var bunch_promises = [];

    _.each(targets, function(target){
        bunch_promises.push(send_one(target[0], target[1], data, cb));
    });

    return Promise.all(bunch_promises);
};