'use strict';

const EventEmitter = require('events');
const StateTransitionError = require('./StateTransitionError');

class PromiseStateMachine extends EventEmitter {
    constructor(options) {
        super();

        this._state = options.initial;
        this._stateEvents = options.events;


        for (const event of Object.keys(this._stateEvents)) {
            const transitions = this._stateEvents[event];
            if (!Array.isArray(transitions.from)) {
                transitions.from = [transitions.from];
            }

            this[event] = this._buildEvent(event, transitions);
        }
    }

    is(otherState) {
        return this._state === otherState;
    }

    get state() {
        return this._state;
    }

    can(event) {
        return this._stateEvents[event].from.indexOf(this._state) !== -1;
    }

    // promise based implementation of EventEmitter.emit
    _emit(event, args) {
        return Promise.all(this.listeners(event).map(listener => {
            if (typeof listener.listener === 'function'){
                this.removeListener(event, listener);
            }

            return (listener.listener || listener).apply(this, args);
        }));
    }

    _buildEvent(event, transitions) {
        return function eventFn() {
            const from = this.state;
            const to = transitions.to;

            if (!this.can(event)) return Promise.reject(new StateTransitionError(
                    `Cannot transition from ${from} via ${event}`
                ));

            const args = [from, to].concat(Array.from(arguments));
            return this._emit('transition', [event].concat(args))
                .then(() => this._emit(event, args))
                .then(results => {
                    this._state = to;
                    return results;
                });
        }.bind(this);
    }

    toDOTsync(options) {
        const _options = Object.assign({
            replacer: data => data,
        }, options || {});
        const events = Object.keys(this._stateEvents);
        const rows = [];
        const allFrom = [];
        const allTo = [];
        for (const eventName of events) {
            const event = this._stateEvents[eventName];
            allTo.push(event.to);
            for (const from of event.from) {
                allFrom.push(from);
                const data = _options.replacer({
                    from,
                    to: event.to,
                    label: eventName,
                });

                rows.push(`${data.from} -> ${data.to} [label="${data.label}"]`);
            }
        }

        if (!rows.length) return undefined;

        // determine accepting nodes
        const accepting = Array.from(new Set(allTo
            .filter(to => allFrom.indexOf(to) === -1)))
                .map(to => _options.replacer({ to }).to);

        return `digraph G {
    rankdir=LR;

    node [shape=doublecircle fixedsize=true width=1]; ${accepting.join(' ')}${accepting.length ? ';' : ''}
    node [shape=circle fixedsize=true width=1];

    ${rows.join(';\n    ')};
}`;
    }
}

module.exports = PromiseStateMachine;
