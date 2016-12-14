var axon  = require('axon');
var Promise = require('promise');
var expect = require('chai').expect;
var profile = require('../profile');
var xmsg = require('../index');

describe('#index', function(){
    var server, console_error_store = console.error;;

    before(function(done){
        server = xmsg.create_server(3000, {
            fn: function(data, res){res('hello')},
            args: function(data, res){res(data)},
            multi: {
                fn: function(data, res){res(data)}
            }
        });

        xmsg.create_server(3001, {
            fn: function(data, res){res('hello 3001')},
            args: function(data, res){res(data)},
            multi: {
                fn: function(data, res){res(data)}
            }
        });

        // for the sake of wait server start
        setTimeout(function(){done()}, 10);
    });

    after(function(){
        console.error = console_error_store;
    });

    describe('#create_server', function(){
        it('should reply /hello/ when one fn', function(done){
            var socket = axon.socket('req');
            socket.connect(3000);

            var parsed_data = ['fn', ['a'], 1];
            parsed_data.push(function(res){
                socket.close();
                socket = null;

                expect(res).to.be.equal('hello');
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should reply /{a: 1}/ when multi level fn', function(done){
            var socket = axon.socket('req');
            socket.connect(3000);

            var parsed_data = ['multi.fn', ['a'], 1];
            parsed_data.push(function(res){
                socket.close();
                socket = null;
                expect(res).to.be.deep.equal({a: 1});
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should reply /illegal args.(action:, data:{"a":1})/', function(done){
            var socket = axon.socket('req');
            socket.connect(3000);

            var parsed_data = ['', ['a'], 1];
            parsed_data.push(function(res){
                socket.close();
                socket = null;
                expect(res.message).to.be.equal('illegal args.(action:, data:{"a":1})');
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should reply /no action/', function(done){
            var socket = axon.socket('req');
            socket.connect(3000);

            var parsed_data = ['no-fn', ['a'], 1];
            parsed_data.push(function(res){
                socket.close();
                socket = null;
                expect(res.message).to.be.equal('not fount action');
                done();
            });

            socket.send.apply(socket, parsed_data);
        });
    });

    describe('#send_one', function(){
        it('should reply /hello 3001/', function(done){
            Promise.resolve()
            .then(function(){
                return xmsg.send_one('127.0.0.1:3001', 'fn', {a: 1})
            })
            .then(function(r){
                expect(r).to.be.equal('hello 3001');
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should work when use profile', function(done){
            var fakeConsole = console.log;
            console.log = function(msg){
                expect(/Host:/.test(msg)).to.be.true;
            };

            xmsg.set('profile', true);
            // default 1000 when no timeout set
            xmsg.set('q_timeout', 10);
            xmsg.create_server(3002, {
                fn: function(data, res){res('hello 3002')}
            });
            Promise.resolve()
            .then(function(){
                return xmsg.send_one('127.0.0.1:3002', 'fn', {a: 1})
            })
            .then(function(r){
                expect(r).to.be.equal('hello 3002');
                xmsg.reset();
                setTimeout(function(){
                    console.log = fakeConsole;
                    done();
                }, 2);
            })
            .catch(function(e){console.log(e)});
        });

        it('should work when use profile send String', function(done){
            var fakeConsole = console.log;
            console.log = function(msg){
                expect(/Host:/.test(msg)).to.be.true;
            };

            xmsg.set('profile', true);
            xmsg.set('timeout', 1);
            xmsg.create_server(3003, {
                fn: function(data, res){res('hello 3003')}
            });
            xmsg.create_server(3003, {
                fn: function(data, res){res('hello 3003')}
            });
            Promise.resolve()
            .then(function(){
                return xmsg.send_one('127.0.0.1:3003', 'fn', 'hello')
            })
            .then(function(r){
                expect(r).to.be.equal('hello 3003');
                xmsg.reset();
                setTimeout(function(){
                    console.log = fakeConsole;
                    done();
                }, 2);
            })
            .catch(function(e){console.log(e)});
        });

        it('should reply /parse target error.(addr:, action:fn)/', function(done){
            Promise.resolve()
            .then(function(){
                return xmsg.send_one('', 'fn', {a: 1})
            })
            .catch(function(e){
                expect(e.code).to.be.equal('xmsg');
                expect(e.message).to.be.equal('parse target error.(addr:, action:fn)');
                done();
            });
        });

        it('should reply /hello/ when param not a object', function(done){

            Promise.resolve()
            .then(function(){
                return xmsg.send_one('127.0.0.1:3001', 'args', 'hello');
            })
            .then(function(r){
                expect(r).to.be.equal('hello');
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should reply /hello/ when param not a object', function(done){
            Promise.resolve()
            .then(function(){
                return xmsg.send_one('127.0.0.1:3001', 'args', {a: null, b: undefined})
            })
            .then(function(r){
                // b: undefined is ignored by axon
                expect(r).to.be.deep.equal({a: null});
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should rm cache when server emit /socket error/', function(done){
            xmsg.reset();
            xmsg.set('timeout', 1);
            xmsg.create_server(3004, {
                fn: function(data, res){res('hello 3004')}
            });

            setTimeout(function(){
                var servers = xmsg._get('servers');
                expect(servers['3004'] !== undefined).to.be.true;
                var sock = servers['3004'];
                sock.emit('socket error');
                expect(servers['3004'] !== undefined).to.be.false;
                done();
            }, 2);
        });

        it('should rm cache when socket emit /socket error/', function(done){
            xmsg.reset();
            xmsg.send_one('127.0.0.1:3000', 'args', 'hello 30061');
            xmsg.send_one('127.0.0.1:3000', 'args', 'hello 30062');

            process.nextTick(function(){
                var socks = xmsg._get('socks');
                expect(socks['127.0.0.1:3000'].length).to.be.equal(2);
                var sock = socks['127.0.0.1:3000'][0];
                sock.emit('socket error');
                expect(socks['127.0.0.1:3000'].length).to.be.equal(1);
                done();
            });
        });

        it('should use exist connection = 1', function(done){
            xmsg.reset();
            xmsg.set('pool_size', 1);

            Promise.resolve()
            .then(function(){return xmsg.send_one('127.0.0.1:3000', 'fn', 'hello whatever')})
            .then(function(r){
                expect(r).to.be.equal('hello');
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should work when use #Buffer', function(done){
            xmsg.reset();

            Promise.resolve()
            .then(function(){return xmsg.send_one('127.0.0.1:3000', 'args', new Buffer('buffer'))})
            .then(function(r){
                expect(r).to.be.equal('buffer');
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should work when set [sock_timeout]', function(done){
            xmsg.reset();
            xmsg.set('sock_timeout', 1);

            xmsg.create_server(3006, {
                args: function(data, res){
                    setTimeout(() => res(data), 10);
                }
            });

            Promise.resolve()
            .then(function(){return xmsg.send_one('127.0.0.1:3006', 'args', new Buffer('buffer'))})
            .then(function(r){
                expect(r.status).to.be.false;
                expect(r.message).to.be.equal('request socket timeout');
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should use exist connection = 2', function(done){
            xmsg.reset();
            xmsg.set('pool_size', 2);

            xmsg.send_one('127.0.0.1:3000', 'fn', 'hello whatever')
            xmsg.send_one('127.0.0.1:3000', 'fn', 'hello whatever')
            xmsg.send_one('127.0.0.1:3000', 'fn', 'hello whatever')

            process.nextTick(function(){
                var socks = xmsg._get('socks');
                expect(socks['127.0.0.1:3000'].length).to.be.equal(2);
                done();
            });
        });

        it('should drop msg when large than hwm', function(done){
            xmsg.reset();
            xmsg.set('hwm', 5);

            xmsg.send_one('127.0.0.1:3100', 'fn', 'hello whatever1');
            process.nextTick(function(){
                var sock = xmsg._get('socks')['127.0.0.1:3100'][0];
                expect(sock.settings.hwm).to.be.equal(5);
                done();
            });
        });

        it('should return undefined', function(){
            xmsg.reset();

            expect(profile.show()).to.be.undefined;
        });
    });

    describe('#send_bunch', function(){
        it('should reply /[ \'hello\', \'data\' ]/', function(done){
            xmsg.reset();
            var targets = [
                ['127.0.0.1:3001', 'fn'],
                ['127.0.0.1:3000', 'args']
            ];

            Promise.resolve()
            .then(function(){
                return xmsg.send_bunch(targets, 'data')
            })
            .then(function(r){
                expect(r).to.deep.equal([ 'hello 3001', 'data' ]);
                done();
            })
            .catch(function(e){console.log(e)});
        });

        it('should reply /[ \'hello\', \'hello 3001\' ]/', function(done){
            xmsg.reset();
            var targets = ['127.0.0.1:3000', '127.0.0.1:3001'];

            Promise.resolve()
            .then(function(){
                return xmsg.send_bunch2(targets, 'fn', 'data')
            })
            .then(function(r){
                expect(r).to.deep.equal([ 'hello', 'hello 3001' ]);
                done();
            })
            .catch(function(e){console.log(e)});
        });
    });
});