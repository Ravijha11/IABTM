/**
 * Async Handler - Wraps async functions to handle errors automatically
 * This utility eliminates the need for try-catch blocks in every controller
 */

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler; 