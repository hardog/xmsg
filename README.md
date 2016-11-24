# XMSG

[![Build Status](https://travis-ci.org/hardog/xmsg.svg?branch=master)](https://travis-ci.org/hardog/xmsg)
[![Coverage Status](https://img.shields.io/codecov/c/github/hardog/xmsg.svg)](https://codecov.io/github/hardog/xmsg?branch=master)
[![License](https://img.shields.io/npm/l/xmsg.svg)](https://www.npmjs.com/package/xmsg)
[![npm Version](https://img.shields.io/npm/v/xmsg.svg)](https://www.npmjs.com/package/xmsg)

cluster app msg communication center!

# Features

- create listen server
- send to one/bunch server
- performance log
- log cache
- connection pool size
- msg queue set when loss connection


# Install

`$ npm install xmsg -g`


# Benchmark

```
// 4C4G  
max: 36432 ops/s
min: 27531 ops/s

```


# Test

run test:
```
$ npm run test
```

run test coverage:
```
$ npm run cover
```


# Usage

## xmsg.set('profile', true), default is false

```
Tag:api Host:v10-2-23-23.hx Target:10.2.21.186:8103@file.get Start:Thu Nov 24 2016 11:57:38 GMT+0800 (CST) Net1:147ms Fn:1ms Net2:6ms Attach:None

Net1: the time from client to server
Fn: server deal through time
Net2: the time from server to client
```

## xmsg.set('pool_size', 100), default is 20

pool size for client connection to prevent lots of request use one connection

## xmsg.set('hwm', 1000), default is Infinity

when client loss connection with server, msg would be store in queue, hwm is the queue size

## xmsg.reset()

this would be clear previous set(profile, pool_size, hwm).

## xmsg.create_server

```
// local machine create a server listen port 3000
// by `reply` return msg to client
xmsg.create_server(3000, {
    fn: (data, reply) => reply('hello'),
    args: (data, reply) => reply(data),
    multi: {
        fn: (data, reply) => reply(data)
    }
});
```

## xmsg.send_one

```
// send to one of the cluster machine
// machine address: 127.0.0.1:3001
// server fn: fn
// passed data: 'hello'
xmsg.send_one('127.0.0.1:3001', 'fn', 'hello'))
```

## xmsg.send_bunch

```
// send to multi machine of the cluster
xmsg.send_bunch([
    ['127.0.0.1:3000', 'fn'],
    ['127.0.0.1:3001', 'fn'],
    ['137.233.222.123:3001', 'fn']
], 'hello'))
```


# License

[MIT](https://github.com/hardog/xmsg/blob/master/LICENSE)