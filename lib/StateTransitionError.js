'use strict';

class StateTransitionError extends Error {
    constructor(from, event) {
        super(`Cannot transition from ${from} via ${event}`);

        this.name = 'StateTransitionError';

        Error.captureStackTrace(this);
    }
}

module.exports = StateTransitionError;
