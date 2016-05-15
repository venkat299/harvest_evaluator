var chai = require('chai'),
	expect = chai.expect,
	assert = chai.assert,
	should = chai.should();
var Promise = require('bluebird')
var mongoose = require('mongoose')

var config = require('../config.json')

var seneca = require('seneca')()
seneca.client(); // -- integration test
//seneca.use('../index.js') // --module test

//=========== mock data ============
var route = 'role:evaluator,cmd:buy'
var data = {
		symbol: 'YESBANK',
		strategy_id: 'fifty_2_wk',
		track_id: null
	}
	//==================================

//=========== mock db ============
seneca.use('entity')
seneca.use(config.test.db_type, config.test.db_config)

//==================================
// beforeEach(function(done) {
//   DB.drop(function(err) {
//     if (err) return done(err)
//     DB.fixtures(fixtures, done)
//   })
// })

describe('Order_evaluator{}', function() {

	before('initialize_db', initialize_db)

	describe('#buy() -> default test', function() {
		var curr_track_id = 'role:evaluator,cmd:buy'
		it('should return an obj {success:true,msg:string}', function(done) {
			seneca.act(curr_track_id, data, function(err, val) {
				default_api_test(err, val, done)
			})
		});
	});
	describe('#buy() -> check msg object ', function() {
		var curr_track_id = 'role:evaluator,cmd:buy'
		it('should return an obj {success:true,msg:string}', function(done) {
			seneca.act(curr_track_id, data, function(err, val) {
				expect(val.cb_msg_obj.transaction_type).to.equal('BUY')
				check_order_info(err, val)
				default_api_test(err, val, done)

			})
		});
	});

	after('clearing db', clear_db)

})

// describe('Order_evaluator{}', function() {
// 	describe('#sell() -> default test', function() {
// 		var curr_track_id = 'role:evaluator,cmd:sell'
// 		it('should return an obj {success:true,msg:string}', function(done) {
// 			seneca.act(curr_track_id, data, function(err, val) {
// 				default_api_test(err, val, done)
// 			})
// 		});
// 	});
// 	describe('#sell() -> check msg object ', function() {
// 		var curr_track_id = 'role:evaluator,cmd:sell'
// 		it('should return an obj {success:true,msg:string}', function(done) {
// 			seneca.act(curr_track_id, data, function(err, val) {
// 				expect(val.cb_msg_obj.transaction_type).to.equal('SELL')
// 				check_order_info(err, val)
// 				default_api_test(err, val, done)

// 			})
// 		});
// 	});
// })

var check_order_info = function(err, val) {
	expect(val.cb_msg).to.match(/role:executor,run:place_order/);
	expect(val.cb_msg_obj).to.be.an('object');
	expect(val.cb_msg_obj.track_id).to.be.a('string');
	expect(val.cb_msg_obj.tradingsymbol).to.be.a('string');
	expect(val.cb_msg_obj.exchange).to.be.oneOf(['NSE']);
	expect(val.cb_msg_obj.transaction_type).to.be.oneOf(['BUY', 'SELL']);
	expect(val.cb_msg_obj.order_type).to.be.oneOf(['MARKET']);
	expect(val.cb_msg_obj.quantity).to.be.a('number');
	expect(val.cb_msg_obj.quantity % 1).to.be.equal(0);
	expect(val.cb_msg_obj.quantity).to.be.above(0);
	expect(val.cb_msg_obj.product).to.be.oneOf(['CNC']);
	expect(val.cb_msg_obj.validity).to.be.oneOf(['DAY']);
}


var default_api_test = function(err, val, cb) {
	should.not.exist(err);
	should.exist(val);
	expect(val).to.be.an('object');
	expect(val.success).to.be.true;
	expect(val.cb_msg).to.exist;
	expect(val.curr_track_id).to.exist;
	expect(val.prev_track_id).to.have.property;
	cb();
}
function initialize_db(done) {

	mongoose.connect(config.test.db_uri)
		// Promise.promisify(seneca.make$, {
		// 	context: seneca
		// })
	var entity_1 = seneca.make$('strategy', {
		strategy_id: 'fifty_2_wk',
		budget: 10000,
		spent:2000,
		equity_ceil:0.2
	})
	var entity_1_save$ = Promise.promisify(entity_1.save$, {
		context: entity_1
	})
	var entity_2 = seneca.make$('strategy_stock', {
		strategy_id: 'fifty_2_wk',
		symbol: 'YESBANK',
		stock_ceil: 0.4,
		nrr:0.8
	})
	var entity_2_save$ = Promise.promisify(entity_2.save$, {
		context: entity_2
	})


	seneca.ready(function() {
		Promise.all([
			entity_1_save$(),
			entity_2_save$()
		]).then(function(res) {
			seneca.log.info('insert', res)
			done()
		})
	})

}

function clear_db(done) {
	mongoose.connection.db.dropDatabase(function(err, result) {
		mongoose.connection.close()
		done()
	})
}