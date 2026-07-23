const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

const log = (level, message, extra = {}) => {
  const entry = {
    level: levels[level] || level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
};

module.exports = {
  info: (msg, extra) => log('info', msg, extra),
  warn: (msg, extra) => log('warn', msg, extra),
  error: (msg, extra) => log('error', msg, extra),
};
