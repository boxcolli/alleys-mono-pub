import pino from 'pino'

const development = pino({
  level: 'trace',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [],
    remove: false,
  },
})

const preview = pino({
  level: 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [],
    remove: true,
  },
})

const production = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      '*.password',
      '*.passwordHash',
    ],
    remove: true,
  },
})

/**
 * logger.fatal('fatal')
 * logger.error('error')
 * logger.warn('warn')
 * logger.info('info')
 * logger.debug('debug')
 * logger.trace('trace')
 */
function selectLogger(env: Env) {
  switch (env.WHICH_ENV) {
    case "development":        
      return development

    case "preview":
      return preview

    case "production":
    default:
      return production
  }
}

export function getLogger(env: Env, request: Request) {
  const logger = selectLogger(env)
  const url = new URL(request.url)
  return logger.child({ req: `${request.method} ...${url.pathname}` })
}
