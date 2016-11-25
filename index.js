var Promise = require('promise');
var axon  = require('axon');
var _  = require('lodash');
var profile = require('./profile');
var parse = require('./parse');

var settings = {
    profile: false,
    hwm: Infinity,
    keep_alive: false,
    sock_timeout: 1000,
    pool_size: 20,
    socks: [],
    servers: {}
};

// for test
exports._get = function(k){
    return settings[k];
};

exports.set = function(k, v){
    if(k === 'q_timeout'){
        return profile.set('timeout', v);
    }

    settings[k] = v;
};

exports.reset = function(){
    settings.profile = false;
    settings.hwm = Infinity;
    settings.socks = {};
    settings.servers = {};
    settings.pool_size = 20;
    settings.keep_alive = false;
    settings.sock_timeout = 1000;
    profile.set('timeout', 1000);
};

var respond_msg = function(args, action){
    action = action || {};
    var parsed = parse.parse_args(args);
    var reply = parsed[0];
    var fn_names = parsed[1];
    var data = parsed[2];

    if(settings.profile){
        var p = profile.land(data);
        data = p[1];
        reply = profile.wrap_reply(p[0], reply);
    }

    if(!reply || !fn_names || !fn_names[0]){
        var actionstr = fn_names.join('.');
        var datastr = JSON.stringify(data);
        reply({
            message: 'illegal args.(action:'+ actionstr +', data:'+ datastr +')',
            code: 'xmsg',
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
            message: 'no action',
            code: 'xmsg',
            stack: __filename
        });
    }
};

exports.create_server = function(port, action){
    var server = settings.servers[port];

    if(!server){
        server = axon.socket('rep');
        server.bind(port);
        settings.servers[port] = server;
        server.on('socket error', function(){
            server.close();
            settings.servers[port] = undefined;
        });
    }

    server.on('message', function(){
        respond_msg(_.toArray(arguments), action);
    });

    return server;
};

var req_server = function(addr, parsed_data, resolve){
    parsed_data = parsed_data || [];

    var socket = settings.socks[addr];
    if(!socket || socket.length < settings.pool_size){
        settings.socks[addr] = (!socket ? [] : socket);
        socket = axon.socket('req');

        var index = settings.socks[addr].push(socket);
        settings.socks[addr].cnt = 0;
        socket.set('hwm', settings.hwm);
        socket.connect('tcp://'+ addr);
        socket.on('connect', function(sock){sock.setKeepAlive(settings.keep_alive);});
        socket.on('socket error', function(e){
            socket.close();
            settings.socks[addr].splice(index - 1, 1);
        });
    }else{
        // like pool size
        var len = socket.length;
        socket = socket[socket.cnt++ % len];
    }

    var timeout_handle = setTimeout(function(){
        clearTimeout(timeout_handle);
        resolve({
            message: 'sock timeout',
            code: 'xmsg',
            stack: __filename
        });
    }, settings.sock_timeout);

    parsed_data.push(function(res){
        clearTimeout(timeout_handle);
        if(settings.profile){
            profile.show(res[0]);
            return resolve(res[1]);
        }
        resolve(res);
    });
    socket.send.apply(socket, parsed_data);
};

// addr like 127.0.0.1:3000, action like: create
var send_one = function(addr, action, data){
    if(!addr || !action){
        return Promise.reject({
            message: 'parse target error.(addr:'+ addr +', action:'+ action +')',
            code: 'xmsg',
            stack: __filename
        });
    }

    if(settings.profile){
        data = profile.start(addr + '@' + action, data);
    }

    var pair_data = parse.kv_pair(data);
    var parsed_data = [action, pair_data[0]];

    parsed_data = parsed_data.concat(pair_data[1]);

    return new Promise(function(resolve){
        req_server(addr, parsed_data, resolve);
    });
};
exports.send_one = send_one;

// targets like [['127.0.0.1:3000', 'create'], ['127.0.0.1:3001', 'create']]
exports.send_bunch = function(targets, data){
    var bunch_promises = [];

    _.each(targets, function(target){
        bunch_promises.push(send_one(target[0], target[1], data));
    });

    return Promise.all(bunch_promises);
};

// targets like ['127.0.0.1:3000', '127.0.0.1:3001']
exports.send_bunch2 = function(targets, action,  data){
    var bunch_promises = [];

    _.each(targets, function(target){
        bunch_promises.push(send_one(target, action, data));
    });

    return Promise.all(bunch_promises);
};