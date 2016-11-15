# XMSG

[![Build Status](https://travis-ci.org/hardog/xmsg.svg?branch=master)](https://travis-ci.org/hardog/xmsg)
[![Coverage Status](https://img.shields.io/codecov/c/github/hardog/xmsg.svg)](https://codecov.io/github/hardog/xmsg?branch=master)
[![License](https://img.shields.io/npm/l/xmsg.svg)](https://www.npmjs.com/package/xmsg)
[![npm Version](https://img.shields.io/npm/v/xmsg.svg)](https://www.npmjs.com/package/xmsg)

cluster app msg communication center!


# Install

`$ npm install xmsg -g`


# Benchmark

```
~9000 op/s 2kb!
~5000 op/s 8kb!

// 200000
17403 op/s 2kb!
total 200000ops in 11.492s!

// 2000000
17443 op/s 2kb!
total 2000000ops in 114.658s!

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

## create_server

```
// local machine create a server listen port 3000
// by `reply` return msg to client
xmsg.create_server(3000, {
    fn: (data, reply) => reply('hello'),
    args: (data, reply) => reply(data),
    multi: {
        fn: (data, reply) => reply(data)
    }
}, [cb]);
```

## send_one

```
// send to one of the cluster machine
// machine address: 127.0.0.1:3001
// server fn: fn
// passed data: 'hello'
xmsg.send_one('127.0.0.1:3001', 'fn', 'hello', [cb]))
```

## send_bunch

```
// send to multi machine of the cluster
xmsg.send_bunch([
    ['127.0.0.1:3000', 'fn'],
    ['127.0.0.1:3001', 'fn'],
    ['137.233.222.123:3001', 'fn']
], 'hello', [cb]))
```


# License

[MIT](https://github.com/hardog/xmsg/blob/master/LICENSE)