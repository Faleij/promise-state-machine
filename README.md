# Promise State Machine ES6

[![npm version](https://badge.fury.io/js/promise-state-machine-es6.svg)](http://badge.fury.io/js/promise-state-machine-es6)
[![Code Climate](https://codeclimate.com/github/faleij/promise-state-machine/badges/gpa.svg)](https://codeclimate.com/github/faleij/promise-state-machine)
[![Test Coverage](https://codeclimate.com/github/faleij/promise-state-machine/badges/coverage.svg)](https://codeclimate.com/github/faleij/promise-state-machine)

This is a rewritten version of [promise-state-machine](https://github.com/patbenatar/promise-state-machine) but with no dependencies; not bluebird - just native ES6, [DOT](https://en.wikipedia.org/wiki/DOT_(graph_description_language) data generation support for use with [Graphvis](http://www.graphviz.org/) or [vis.js](https://mdaines.github.io/viz.js/), to generate a visual representation of your state machine.

# Class PromiseStateMachine

## Constructor(options)
``state`` - May be any primitive type.
``options.initial`` - Initial ``state``.  
``options.events`` - An Object where key denotes a transition.  
``options.events[transition].from`` - From ``state``, may be an array of ``state``.  
``options.events[transition].to`` - To ``state``  

Each key defined in ``options.events`` is defined as a method on the current instance. Use these methods to request a state transition. These methods returns a Promise that Resolves when transition succeded and Rejects when failed. To intercept a transition listen on the transition name, eg if ``options.events`` has "warn" transition we can intercept it by ``fsm.on('warn', (from, to, ...rest) => Promise.resolve())``. This event would get called when ``fsm.warn(...rest).then()`` is called.

## is(state)
Check if instance is in state.
Returns: Bool.

## can(state)
Check if instance can transition to a specific state.  
Returns: Bool

## state [getter]
Get current state

## toDOTsync(options)
Synchronously create DOT file data as a string.  
``options.replacer`` - Optional synchronous replacer function that takes a ``data`` object and returns a ``data`` object with all values stringified.  

``data.from`` - From ``state``  
``data.to`` - To ``state``  
``data.transition`` - Transition key  

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

fsm.on('warn', (from, to, anyArgs) => {
  return Promise.resolve('result 1');
});

fsm.on('warn', (from, to, anyArgs) => {
  var transaction = anyArgs[0];
  var somethingElse = anyArgs[1];

  return Promise.resolve('result 2');
});

fsm.warn(transaction, somethingElse).then(function(results) {
  // results: ['result 1', 'result 2']
}, function(error) {
  // could receive a StateTransitionError if trying to transition via an
  // inaccessible event.
});

fsm.is('green'); // => false
fsm.is('yellow'); // => true
fsm.state(); // => 'yellow'
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

## TODO

- [ ] streamed version of toDOTsync
