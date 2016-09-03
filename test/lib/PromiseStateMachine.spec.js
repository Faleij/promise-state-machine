'use strict';

const AssertionError = require('assertion-error');
const sinon = require('sinon');
const PromiseStateMachine = require('../../lib/PromiseStateMachine');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function isFunction(v) {
    return typeof v === 'function';
}

describe('PromiseStateMachine', () => {
    const buildFsm = () => {
        return new PromiseStateMachine({
            initial: 'pending',
            events: {
                approve: { from: 'pending', to: 'approved' },
                reject: { from: ['pending', 'approved'], to: 'rejected' },
                pend: { from: ['approved', 'rejected'], to: 'pending' },
            },
        });
    };

    describe('constructor', () => {
        it('builds functions for each event action', () => {
            const fsm = buildFsm();

            assert(isFunction(fsm.approve));
            assert(isFunction(fsm.reject));
            assert(isFunction(fsm.pend));
        });
    });

    describe('should not be able to overwrite methods', () => {
        it('throw error', () => {
            return Promise.resolve()
            .then(() => new PromiseStateMachine({
                events: {
                    is: { from: 'start', to: 'end'},
                }
            }))
            .then(() => Promise.reject(new Error('Resolve not Expected')),
            err => assert.equal(err.message, 'Illegal event name "is"; can\'t overwrite property'));

        });
    });


    describe('event action functions and handlers', () => {
        it('calls bound event handlers', (done) => {
            const fsm = buildFsm();

            let handler = () => Promise.resolve();
            handler = sinon.spy(handler);

            fsm.on('approve', handler);

            fsm.approve().then(() => {
                assert.equal(handler.calledOnce, true);
                done();
            }).catch(done);
        });

        it('resolves with the results of the handlers in order', (done) => {
            const fsm = buildFsm();

            const firstHandler = () => Promise.resolve('first');
            const secondHandler = () => Promise.resolve('second');

            fsm.on('approve', firstHandler);
            fsm.on('approve', secondHandler);

            fsm.approve().then((results) => {
                assert.equal(results[0], 'first');
                assert.equal(results[1], 'second');
                done();
            }).catch(done);
        });

        it('once handler should only be called once', (done) => {
            const fsm = buildFsm();

            let handler = () => Promise.resolve();
            handler = sinon.spy(handler);

            fsm.once('approve', handler);

            Promise.all([fsm.approve(), fsm.approve()]).then(() => {
                assert(handler.calledOnce);
                done();
            }).catch(done);
        });

        it('passes event info through to the handlers', (done) => {
            const fsm = buildFsm();

            let handler = () => Promise.resolve();
            handler = sinon.spy(handler);

            fsm.on('approve', handler);

            fsm.approve().then(() => {
                assert.equal(handler.calledWith('pending', 'approved'), true);
                done();
            }).catch(done);
        });

        it('passes arguments through to the handlers', (done) => {
            const fsm = buildFsm();

            let handler = () => Promise.resolve();
            handler = sinon.spy(handler);

            fsm.on('approve', handler);

            fsm.approve('first arg', 'second arg').then(() => {
                assert.equal(
                    handler.calledWith(
                        'pending', 'approved', 'first arg', 'second arg'
                    ),
                    true
                );
                done();
            }).catch(done);
        });

        it('updates the state to the new state after transition', (done) => {
            const fsm = buildFsm();

            fsm.approve().then(() => {
                assert.equal(fsm.is('approved'), true);
                done();
            }).catch(done);
        });

        context('when the transition is inaccessible', () => {
            it('rejects with a state transition error', (done) => {
                const fsm = buildFsm();

                fsm.pend().then(() => {
                    const message = 'Expected Promise not to resolve successfully';
                    throw new AssertionError(message);
                }, (error) => {
                    assert.equal(error.name, 'StateTransitionError');
                    assert.equal(error.message,
            'Cannot transition from pending via pend'
          );

                    done();
                }).catch(done);
            });
        });
    });

    describe('#is', () => {
        it('is true if given state is the current state', () => {
            const fsm = buildFsm();
            assert.equal(fsm.is('pending'), true);
        });

        it('is false if given state is not the current state', () => {
            const fsm = buildFsm();
            assert.equal(fsm.is('approved'), false);
        });
    });

    describe('#state', () => {
        it('is the current state', (done) => {
            const fsm = buildFsm();

            assert.equal(fsm.state, 'pending');

            fsm.approve().then(() => {
                assert.equal(fsm.state, 'approved');
                done();
            });
        });
    });

    describe('#can', () => {
        it('is true if the given event is accessible', () => {
            const fsm = buildFsm();
            assert.equal(fsm.can('approve'), true);
        });

        it('is false if the given event is not accessible', () => {
            const fsm = buildFsm();
            assert.equal(fsm.can('pend'), false);
        });
    });

    describe('#toDOTsync', () => {
        it('should not have accepting', () => {
            const fsm = new PromiseStateMachine({
                events: {
                    warn: { from: 'green', to: 'yellow' },
                    panic: { from: 'yellow', to: 'red' },
                    calm: { from: 'red', to: 'yellow' },
                    clear: { from: 'yellow', to: 'green' },
                },
            });
            const str = fsm.toDOTsync();
            const filename = path.resolve(__dirname, 'fsm1.dot');
            //fs.writeFileSync(filename, str);
            const fileStr = fs.readFileSync(filename);
            assert.equal(str, fileStr);
        });

        it('should have accepting', () => {
            const fsm = new PromiseStateMachine({
                events: {
                    warn: { from: 'green', to: 'yellow' },
                    panic: { from: 'yellow', to: 'red' },
                    clear: { from: 'yellow', to: 'green' },
                },
            });
            const str = fsm.toDOTsync();
            const filename = path.resolve(__dirname, 'fsm0.dot');
            //fs.writeFileSync(filename, str);
            const fileStr = fs.readFileSync(filename);
            assert.equal(str, fileStr);
        });

        it('no events should return undefined', () => {
            const fsm = new PromiseStateMachine({ events: {} });
            const str = fsm.toDOTsync();
            assert.equal(str, undefined);
        });
    });

    describe('extending a class', () => {
        it('works just fine when using as a class extension', (done) => {
            class MyClass extends PromiseStateMachine {}

            const fsm = new MyClass({
                initial: 'green',
                events: {
                    warn: { from: 'green', to: 'yellow' },
                    panic: { from: 'yellow', to: 'red' },
                    calm: { from: 'red', to: 'yellow' },
                    clear: { from: 'yellow', to: 'green' },
                },
            });

            assert.equal(fsm.is('green'), true);

            fsm.warn().then(() => {
                assert.equal(fsm.is('green'), false);
                done();
            }).catch(done);
        });
    });
});
