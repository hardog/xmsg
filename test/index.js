var axon  = require('axon');
var Promise = require('promise');
var expect = require('chai').expect;
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
                expect(res.status).to.be.false;
                expect(res.msg).to.be.equal('illegal args.(action:, data:{"a":1})');
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should console /this is an error/', function(done){
            console.error = function(e){
                expect(e).to.be.equal('this is an error');
                done();
            };
            server.emit('error', 'this is an error');
        });

        it('should reply /no action found/', function(done){
            var socket = axon.socket('req');
            socket.connect(3000);

            var parsed_data = ['no-fn', ['a'], 1];
            parsed_data.push(function(res){
                socket.close();
                socket = null;
                expect(res.status).to.be.false;
                expect(res.msg).to.be.equal('no action found');
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

        it('should reply /parse target error.(addr:, action:fn)/', function(done){
            Promise.resolve()
            .then(function(){
                return xmsg.send_one('', 'fn', {a: 1})
            })
            .catch(function(e){
                expect(e.status).to.be.false;
                expect(e.msg).to.be.equal('parse target error.(addr:, action:fn)');
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
    });

    describe('#send_bunch', function(){
        it('should reply /[ \'hello 3001\', \'hello\' ]/', function(done){
            var targets = [
                ['127.0.0.1:3001', 'fn'],
                ['127.0.0.1:3000', 'fn']
            ];

            Promise.resolve()
            .then(function(){
                return xmsg.send_bunch(targets, 'data')
            })
            .then(function(r){
                expect(r).to.deep.equal([ 'hello 3001', 'hello' ]);
                done();
            })
            .catch(function(e){console.log(e)});
        });
    });
});