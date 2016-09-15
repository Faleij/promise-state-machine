# Promise State Machine ES6

[![NPM version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![License][license-image]](LICENSE) [![Gratipay][gratipay-image]][gratipay-url]

This is a rewritten version of [promise-state-machine](https://github.com/patbenatar/promise-state-machine) but with no dependencies; not bluebird - just native ES6, [DOT](https://en.wikipedia.org/wiki/DOT_(graph_description_language)) data generation support for use with [Graphvis](http://www.graphviz.org/) or [vis.js](https://mdaines.github.io/viz.js/), to generate a visual representation of your state machine.

## Installation
```
npm install promise-state-machine-es6 --save
```

# Class PromiseStateMachine

## Constructor(options)
``state`` - May be any primitive type.
``options.initial`` - Initial ``state``.  
``options.events`` - An Object where key denotes a transition.  
``options.events[transition].from`` - From ``state``, may be an array of ``state``.  
``options.events[transition].to`` - To ``state``  

Each key defined in ``options.events`` is defined as a method on the current instance. Use these methods to request a state transition. These methods returns a Promise that Resolves when transition succeded and Rejects when failed. To intercept a transition listen on the transition name, eg if ``options.events`` has "warn" transition we can intercept it by ``fsm.on('warn', (from, to, ...rest) => Promise.resolve())``. This event would get called when ``fsm.warn(...rest).then()`` is called.

## is(...states) : Bool
Check if instance is in any state. Argument may be one or many states or an array of states.

## can(...events) : Bool
Check if instance can transition to a specific state. Argument may be one or many events or an array of events.

## state [getter] : state
Get current state

## toDOTsync(options) : String
Synchronously create DOT file data as a string.  
``options.replacer`` - Optional synchronous replacer function that takes a ``data`` object and returns a ``data`` object with all values stringified.  

``data.from`` - From ``state``  
``data.to`` - To ``state``  
``data.transition`` - Transition key  

## # Events

### `[eventsKey]` (from, to, ...arguments)
A transition event for each key of ``options.events`` passed to the constructor may be emitted when calling any method as defined by ``options.events``.

### transition (transitionKey, from, to, ...arguments)
This event is emitted before [transitionKey] event is emitted, returning a Promise that rejects will abort the transition and [eventsKey] event will not be emitted.

# Examples

### Complete Example
```javascript
const fsm = new PromiseStateMachine({
  initial: 'green',
  events: {
    warn: { from: 'green', to: 'yellow' },
    panic: { from: ['green', 'yellow'], to: 'red' },
    calm: { from: 'red', to: 'yellow' },
    clear: { from: ['yellow', 'red'], to: 'green' }
  }
});

fsm.on('warn', (from, to) => {
  return Promise.resolve('result 1');
});

fsm.on('warn', (from, to, transaction, somethingElse) => {
  return Promise.resolve('result 2');
});

fsm.on('transaction', (transition, from, to, ...rest) => {
    transition; // => 'warn'
});

fsm.warn(transaction, somethingElse).then(function(results) {
  // results: ['result 1', 'result 2']
}, function(error) {
  // could receive a StateTransitionError if trying to transition via an
  // inaccessible event.
});

fsm.is('green'); // => false
fsm.is('yellow'); // => true
fsm.state; // => 'yellow'
fsm.can('calm'); // => false
fsm.can('panic'); // => true
```

### toDOTsync
```javascript
const dotDataString = new PromiseStateMachine({
    events: {
        approve: { from: 'pending', to: 'approved' },
        reject: { from: ['pending', 'approved'], to: 'rejected' },
        pend: { from: ['approved', 'rejected'], to: 'pending' },
    }
}).toDOTsync();
```
![Alt text](https://rawgithub.com/Faleij/0f8598c786446510a6f158d7f66a8ee4/raw/0752d0b81a194db51c7eecd28da728efef5bb230/fsm0.svg)

### toDOTsync

```javascript
const dotDataString = new PromiseStateMachine({
    events: {
        doWork: { from: ['Working', 'Starting'], to: 'Working' },
        handleError: { from: ['Working', 'Starting'], to: 'Error' },
        end: { from: ['Working', 'Starting'], to: 'End' }
    }
}).toDOTsync();
```
![Alt text](https://rawgithub.com/Faleij/0f8598c786446510a6f158d7f66a8ee4/raw/6f3a47c11ffa8b5160ca037554237bdddd3f56c6/fsm1.svg)

### Inheritance

```javascript
class MyClass extends PromiseStateMachine {
    constructor(options) {    
        super(options);
    }
}

const fsm = new MyClass({
    initial: 'green',
    events: {
        warn: { from: 'green', to: 'yellow' },
        panic: { from: 'yellow', to: 'red' },
        calm: { from: 'red', to: 'yellow' },
        clear: { from: 'yellow', to: 'green' }
    }
});
fsm.is('green'); // => true
fsm.warn().then(() => {
  fsm.is('green'); // => false
});
```

# TODO

- [ ] streamed version of toDOTsync

# License
MIT

[npm-image]: http://img.shields.io/npm/v/promise-state-machine-es6.svg
[npm-url]: https://npmjs.org/package/promise-state-machine-es6
[downloads-image]: https://img.shields.io/npm/dm/promise-state-machine-es6.svg
[downloads-url]: https://npmjs.org/package/promise-state-machine-es6
[travis-image]: https://travis-ci.org/Faleij/promise-state-machine.svg?branch=master
[travis-url]: https://travis-ci.org/Faleij/promise-state-machine
[coveralls-image]: https://coveralls.io/repos/Faleij/promise-state-machine/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/Faleij/promise-state-machine?branch=master
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[gratipay-image]: https://img.shields.io/gratipay/faleij.svg
[gratipay-url]: https://gratipay.com/faleij/
