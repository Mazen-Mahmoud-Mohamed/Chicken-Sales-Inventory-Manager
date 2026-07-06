const formatMessage = (level, args) => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level}]`, ...args];
};

const logger = {
  info: (...args) => console.log(...formatMessage('INFO', args)),
  warn: (...args) => console.warn(...formatMessage('WARN', args)),
  error: (...args) => console.error(...formatMessage('ERROR', args)),
  debug: (...args) => {
    if (process.env.ELECTRON_DEV === 'true') {
      console.debug(...formatMessage('DEBUG', args));
    }
  },
};

export default logger;
