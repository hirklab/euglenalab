import httpStatus from 'http-status';

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class ApiError extends Error {
	constructor(message, status = httpStatus.INTERNAL_SERVER_ERROR, isPublic = true) {
		super(message);
		this.name = this.constructor.name;
		this.message = message;
		this.status = status;
		this.isPublic = isPublic;
		this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
		Error.captureStackTrace(this, this.constructor.name);
	}
}

export default ApiError;