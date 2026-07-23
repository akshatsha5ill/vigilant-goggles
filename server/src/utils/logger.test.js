import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from './logger.js';

describe('logger', () => {
  let stdoutSpy;
  let stderrSpy;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('info level writes to stdout', () => {
    logger.info('test message');

    expect(stdoutSpy).toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();

    const written = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(written.level).toBe('INFO');
    expect(written.message).toBe('test message');
  });

  it('error level writes to stderr', () => {
    logger.error('error message');

    expect(stderrSpy).toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();

    const written = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(written.level).toBe('ERROR');
    expect(written.message).toBe('error message');
  });

  it('warn level writes to stdout', () => {
    logger.warn('warning message');

    expect(stdoutSpy).toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();

    const written = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(written.level).toBe('WARN');
    expect(written.message).toBe('warning message');
  });

  it('includes a timestamp in ISO format', () => {
    logger.info('timestamped');

    const written = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(written.timestamp).toBeDefined();
    expect(new Date(written.timestamp).toISOString()).toBe(written.timestamp);
  });

  it('merges extra fields into the log entry', () => {
    logger.info('with extras', { userId: '123', action: 'login' });

    const written = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(written.userId).toBe('123');
    expect(written.action).toBe('login');
  });

  it('appends a newline after each entry', () => {
    logger.info('newline check');

    const output = stdoutSpy.mock.calls[0][0];
    expect(output.endsWith('\n')).toBe(true);
  });
});
