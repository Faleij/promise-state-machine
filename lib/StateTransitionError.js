'use strict';

class StateTransitionError extends Error {
    constructor(message) {
        super(message);

        this.name = 'StateTransitionError';

        Error.captureStackTrace(this);
    }
}

module.exports = StateTransitionError;
