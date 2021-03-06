/**
 * server.js
 * mongodb-rest
 *
 * Maintained by Ashley Davis 2014-07-02
 * Created by Tom de Grunt on 2010-10-03.
 * Copyright (c) 2010 Tom de Grunt.
 * This file is part of mongodb-rest.
 */

const fs = require('fs')
const express = require('express')
const nocache = require('nocache')
const bodyParser = require('body-parser')
const https = require('https')
const cors = require('cors')
const initRoutes = require('./lib/routes')
const resolveConfig = require('./lib/config/resolve-config')
const morgan = require('morgan')

require('dotenv').config()
require('express-csv')

var server = null

module.exports = {
  startServer,
  stopServer,
}

/**
 * Start the REST API server.
 */
function startServer(customConfig, onStarted) {
  const app = express()
  const config = resolveConfig.with(customConfig)

  init(app, config)
  run(app, config, onStarted)
}

/**
 * Stop the REST API server.
 */
function stopServer() {
  if (!server) return

  server.close()
  server = null
}

/**
 * Init express application
 * @param {object} app
 * @param {object} config
 */
function init(app, config) {
  if (config.accessControl) {
    config.logger.info(config.accessControl)
    app.use(cors(config.accessControl))
  }
  app.use(morgan('combined'))
  app.use(nocache())
  app.use(bodyParser())

  if (config.humanReadableOutput) {
    app.set('json spaces', 4)
  }

  app.get('/favicon.ico', function(req, res) {
    res.status(404)
  })

  initRoutes(app, config)
}

/**
 * Perform server launch
 * @param {object} app
 * @param {object} config
 * @param {callback} onStarted
 */
function run(app, config, onStarted) {
  const logger = config.logger
  const host = config.server.address
  const port = config.server.port
  const ssl = config.ssl || { enabled: false, options: {} }

  const start = function() {
    logger.info('Now listening on: ' + host + ':' + port + ' SSL:' + ssl.enabled)

    if (onStarted) onStarted()
  }

  logger.info('Starting mongodb-rest server: ' + host + ':' + port)
  logger.info('Connecting to db: ')

  if (ssl.enabled) {
    if (ssl.keyFile) ssl.options.key = fs.readFileSync(ssl.keyFile)
    if (ssl.certificate) ssl.options.cert = fs.readFileSync(ssl.certificate)

    server = https.createServer(ssl.options, app).listen(port, host, start)
  } else {
    server = app.listen(port, host, start)
  }
}

/**
 * Auto start server when run as 'node server.js'
 */
;+(function() {
  const autoStart = process.argv.length >= 2 && process.argv[1].indexOf('server.js') != -1

  if (autoStart) module.exports.startServer()
})()
