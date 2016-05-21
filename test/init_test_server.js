var path = require('path')
var mkdirp = require('mkdirp')

var seneca = require('seneca')();
seneca.use('entity')
var Promise = require('bluebird')
	//Promise.promisify(seneca.make$,{context:seneca})
	//Promise.promisify(seneca.list$,{context:seneca})


var config = require('../config.json')



// ###### service needed for testing  ########
var harvest_strategy = require('harvest_strategy');
//var harvest_data = require('harvest_data');
var harvest_executor = require('harvest_executor');
//seneca.use(harvest_data)
seneca.use(harvest_strategy)
seneca.use(harvest_executor)


// ###### current service being tested ########
seneca.use('../index.js')

// ###### testing module ########
function start(cb) {
	//=========== test env db ========== //
	//using mongo
	//seneca.use(config.test.mongo.db_type, config.test.mongo.db_config)
	//using level_store
	//seneca.use(config.test.level.db_type, config.test.level.db_config)
	//using json_file_store
	seneca.use(config.test.json.db_type, config.test.json.db_config)

	//================================= //



	return new Promise(function(resolve, reject) {
		seneca.ready(function() {

			seneca.add('role:test_server,cmd:check_status', function(opt, cb) {
				cb(null, {
					success: true,
					server: 'alive',
					server_type: 'test'
				})
			})

			seneca.listen()
			resolve(seneca)
			console.log('test server listening')


		})
	})

}

var intialize_db_json = function() {
	var mkdirp = require('mkdirp');
	mkdirp(config.test.json.db_config, function(err) {
		// path exists unless there was an error
	});
}
var rmDir = function(dirPath, removeSelf) {
	if (removeSelf === undefined)
		removeSelf = true;
	try {
		var files = fs.readdirSync(dirPath);
	} catch (e) {
		return;
	}
	if (files.length > 0)
		for (var i = 0; i < files.length; i++) {
			var filePath = path.join(dirPath, files[i]);
			if (fs.statSync(filePath).isFile())
				fs.unlinkSync(filePath);
			else
				rmDir(filePath);
		}
	if (removeSelf)
		fs.rmdirSync(dirPath);
};

module.exports.start = start