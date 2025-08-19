// Middleware to inject socket.io instance into request object
export const injectSocketIO = (io) => {
  return (req, res, next) => {
    req.io = io;
    next();
  };
}; 