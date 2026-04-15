const executeWithRetry = async (fn, options = {}) => {
  const retries = Number(options.retries ?? 3);
  const delayMs = Number(options.delayMs ?? 300);

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const result = await fn(attempt);
      return {
        result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw Object.assign(lastError || new Error('Retry failed'), {
    attempts: retries
  });
};

module.exports = {
  executeWithRetry
};
