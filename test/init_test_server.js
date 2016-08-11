const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const Promise = require('bluebird');
const logger = require('../app_logger').logger;

// ###### service needed for testing  ########
// const harvest_strategy = require('harvest_strategy');
const harvest_data = require('harvest_data');
const harvest_strategy = require('harvest_strategy');
const harvest_executor = require('harvest_executor');

// ###### testing module ########
const seneca = require('seneca')();

const config = require('../config.json');
// ======= change db here =========
const test_db = config.test.current_db;
// ================================
const test_db_name = config.test[test_db].db_type;
const test_db_config = config.test[test_db].db_config;

const custom_port = 8080;

function rmDir(dirPath, removeSelf) {
  /* eslint no-param-reassign:0 */
  if (removeSelf === undefined) removeSelf = true;
  let files;
  try {
    files = fs.readdirSync(dirPath);
  } catch (e) {
    // throw e
    return;
  }
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(dirPath, files[i]);
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  }
  if (removeSelf) fs.rmdirSync(dirPath);
}

function start(cb) {
  mkdirp.sync(test_db_config.folder);
  mkdirp.sync('server/python_node_ipc/');

  seneca.use(harvest_data);
  // seneca.use(harvest_strategy)
  seneca.use(harvest_strategy);
  seneca.use(harvest_executor);

  // ###### current service being tested ########
  seneca.use('../index.js');

  // ###### adding test db  ########
  try {
    seneca.use('entity');
    seneca.use(test_db_name, test_db_config);
  } catch (err) {
    logger.debug(err);
  }

  // ###### promisifying method act  ########
  Promise.promisify(seneca.act, {
    context: seneca,
  });

  // ###### returning a promise that db is configured  ########
  // return new Promise(function (resolve, reject) {
  seneca.ready(() => {
    seneca.listen({
      host: 'localhost',
      port: custom_port,
    });
    cb();
    // resolve({
    //   seneca: seneca,
    //   port: custom_port
    // });
    // logger.debug('test server listening')
  });
  // });
}

function reset_db(cb) {
  // ###### for mongo db  ########
  if (test_db === 'mongo') {
    // drop mongo db
    // logger.debug('clearing mongodb database')
  } else {
    // ###### for level db and json-file db  ########
    // ######### removing db directories #########
    // logger.debug('clearing db files')
    rmDir(test_db_config.folder, false);
    rmDir('server/python_node_ipc/', false);
    // ######### creating empty db directory #########
    mkdirp.sync(test_db_config.folder);

    // path exists unless there was an error
    logger.debug('>>>> deleted the db files');
    cb({
      seneca,
      port: custom_port,
    });
  }
}
/* eslint no-undef:0 */
before((done) => {
  logger.debug('===== starting server =======');
  start(done);
});

after((done) => {
  logger.debug('====== closing server  =====');
  seneca.close(done);
  done();
});

// module.exports.start = start;
module.exports.get_server = reset_db;