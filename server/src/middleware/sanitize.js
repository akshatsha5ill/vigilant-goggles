const stripHtml = (value) => {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, '');
  if (Array.isArray(value)) return value.map(stripHtml);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      clean[k] = stripHtml(v);
    }
    return clean;
  }
  return value;
};

const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = stripHtml(req.body);
  }
  next();
};

module.exports = sanitize;
