'use strict';

const axon  = require('axon');
const mm    = require('mm');
const expect = require('chai').expect;
const xmsg = require('../index');

describe('#index', () => {
    let server;

    before((done) => {
        server = xmsg.create_server(3000, {
            fn: (data, res) => res('hello'),
            args: (data, res) => res(data),
            multi: {
                fn: (data, res) => res(data)
            }
        });

        xmsg.create_server(3001, {
            fn: (data, res) => res('hello 3001'),
            args: (data, res) => res(data),
            multi: {
                fn: (data, res) => res(data)
            }
        });

        // for the sake of wait server start
        setTimeout(() => done(), 10);
    });

    after(() => mm.restore());

    describe('#create_server', () => {
        it('should reply /hello/ when one fn', (done) => {
            let socket = axon.socket('req');
            socket.connect(3000);

            let parsed_data = ['fn', ['a'], 1];
            parsed_data.push((res) => {
                socket.close();
                socket = null;

                expect(res).to.be.equal('hello');
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should reply /{a: 1}/ when multi level fn', (done) => {
            let socket = axon.socket('req');
            socket.connect(3000);

            let parsed_data = ['multi.fn', ['a'], 1];
            parsed_data.push((res) => {
                socket.close();
                socket = null;
                expect(res).to.be.deep.equal({a: 1});
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should reply /illegal args.(action:, data:{"a":1})/', (done) => {
            let socket = axon.socket('req');
            socket.connect(3000);

            let parsed_data = ['', ['a'], 1];
            parsed_data.push((res) => {
                socket.close();
                socket = null;
                expect(res.status).to.be.false;
                expect(res.msg).to.be.equal('illegal args.(action:, data:{"a":1})');
                done();
            });

            socket.send.apply(socket, parsed_data);
        });

        it('should console /this is an error/', (done) => {
            mm(console, 'error', (e) => {
                expect(e).to.be.equal('this is an error');
                done();
            })
            server.emit('error', 'this is an error');
        });
    });

    describe('#send_one', () => {
        it('should reply /hello 3001/', (done) => {
            Promise.resolve()
            .then(() => xmsg.send_one('127.0.0.1:3001@fn', {a: 1}))
            .then((r) => {
                expect(r).to.be.equal('hello 3001');
                done();
            })
            .catch((e) => console.log(e));
        });

        it('should reply /parse target error.(addr:, action:fn)/', (done) => {
            Promise.resolve()
            .then(() => xmsg.send_one('@fn', {a: 1}))
            .catch((e) => {
                expect(e.status).to.be.false;
                expect(e.msg).to.be.equal('parse target error.(addr:, action:fn)');
                done();
            });
        });

        it('should reply /hello/ when param not a object', (done) => {
            Promise.resolve()
            .then(() => xmsg.send_one('127.0.0.1:3001@args', 'hello'))
            .then((r) => {
                expect(r).to.be.equal('hello');
                done();
            })
            .catch((e) => console.log(e));
        });

        it('should reply /hello/ when param not a object', (done) => {
            Promise.resolve()
            .then(() => xmsg.send_one('127.0.0.1:3001@args', {a: null, b: undefined}))
            .then((r) => {
                // b: undefined is ignored by axon
                expect(r).to.be.deep.equal({a: null});
                done();
            })
            .catch((e) => console.log(e));
        });

        it('should reply /parse target error.(addr:undefined, action:undefined)/ when no target', (done) => {
            Promise.resolve()
            .then(() => xmsg.send_one('x', 'hello'))
            .catch((e) => {
                expect(e.status).to.be.false;
                expect(e.msg).to.be.equal('parse target error.(addr:undefined, action:undefined)');
                done();
            });
        });
    });

    describe('#send_bunch', () => {
        it(`should reply /[ 'hello 3001', 'hello' ]/`, (done) => {
            let targets = [
                '127.0.0.1:3001@fn',
                '127.0.0.1:3000@fn'
            ];

            Promise.resolve()
            .then(() => xmsg.send_bunch(targets, 'data'))
            .then((r) => {
                expect(r).to.deep.equal([ 'hello 3001', 'hello' ]);
                done();
            })
            .catch((e) => console.log(e));
        });
    });
});