var chai = require('chai'),
	expect = chai.expect,
	assert = chai.assert,
	should = chai.should();
var Promise = require('bluebird')
var mongoose = require('mongoose')

var config = require('../config.json')

// ###### initializing test server ########
var intialize_server = require('./init_test_server.js')

var seneca;
//seneca.use('entity')


//=========== mock data ============
var route = 'role:evaluator,cmd:buy'
var process_order_dt = {
	tradingsymbol: 'YESBANK',
	strategy_id: 'fifty_2_wk',
	transaction_type:'BUY',
	track_id: null,
	ltp: 100
}
var order_placed_dt = {
	"success": true,
	"prev_track_id": "1463392269207/evaluator/YESBANK",
	"curr_track_id": "1463392269236/executor/YESBANK",
	"cb_msg": 'kite.api:orders/regular',
	"cb_msg_obj": {
		"order_id": "151220000000000",
		"tradingsymbol": "YESBANK",
		"strategy_id": "fifty_2_wk"
	}

}
var order_executed_dt = {
		"order_id": "16032300017157",
		"exchange_order_id": "511220371736111",
		"user_id": "AB0012",
		"status": "COMPLETE",

		"tradingsymbol": "TATAMOTORS",
		"exchange": "NSE",
		"transaction_type": "SELL",

		"average_price": 376.35,
		"price": 376.35,
		"quantity": 1,
		"filled_quantity": 1,
		"trigger_price": 0,
		"status_message": "",
		"order_timestamp": "2015-12-20 15:01:43",
		"checksum": "5aa3f8e3c8cc41cff362de9f73212e28"
	}
	//==================================



describe('Order_evaluator{}', function() {

	before('initialize', initialize)
    //after('clearing db', clear_db)

	describe('#buy() -> default test', function() {
		var curr_track_id = 'role:evaluator,cmd:evaluate'
		it('should return a proper/standard api response', function(done) {
			seneca.act(curr_track_id, process_order_dt, function(err, val) {
				default_api_test(err, val, done)
			})
		});
		it('should return a proper cb_msg_obj for "BUY" call', function(done) {
			seneca.act(curr_track_id, process_order_dt, function(err, val) {
				expect(val.cb_msg_obj.transaction_type).to.equal('BUY')
				check_order_info(err, val)
				default_api_test(err, val, done)
			})
		});

		// it('should create an entry in db after relaying order info to executor', function(done) {
		// 	seneca.act(curr_track_id, process_order_dt, function(err, val) {


		// 		check_order_info(err, val)
		// 		default_api_test(err, val, done)
		// 	})
		// });
	});

	// describe('#buy() -> check msg object ', function() {
	// 	var curr_track_id = 'role:evaluator,cmd:buy'
		
	// });

	// describe("#register_order() -> check if status is updated to 'INITATED' to 'PLACED' in db", function() {
	// 	var curr_track_id = 'role:evaluator,cmd:register_order'
	// 	it('should return an obj {success:true,cb_msg:string}', function(done) {
	// 		seneca.act(curr_track_id, process_order_dt, function(err, val) {
				
	// 			default_api_test(err, val, done)
	// 		})
	// 	});
	// });

	
})


var check_order_info = function(err, val) {
	expect(val.cb_msg).to.match(/role:executor,cmd:place_order/);
	expect(val.cb_msg_obj).to.be.an('object');
	expect(val.cb_msg_obj.track_id).to.be.a('string');
	expect(val.cb_msg_obj.tradingsymbol).to.be.a('string');
	expect(val.cb_msg_obj.strategy_id).to.be.a('string');
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

function initialize(done) {
	intialize_server.start().then(function(my_seneca){
		//console.log(my_seneca)
		seneca = my_seneca
		seneca.client(); 

// -- integration test
//seneca.use('../index.js') // --module test

	//mongoose.connect(config.test.db_uri)
		// Promise.promisify(seneca.make$, {
		// 	context: seneca
		// })

//=========== mock db ============
//seneca.use('entity')
//seneca.use(config.test.db_type, config.test.db_config)

//==================================
// beforeEach(function(done) {
//   DB.drop(function(err) {
//     if (err) return done(err)
//     DB.fixtures(fixtures, done)
//   })
// })


	var entity_1 = seneca.make$('strategy', {
		strategy_id: 'fifty_2_wk',
		budget: 10000,
		spent: 2000,
		equity_ceil: 0.2
	})
	var entity_1_save$ = Promise.promisify(entity_1.save$, {
		context: entity_1
	})
	var entity_2 = seneca.make$('strategy_stock', {
		strategy_id: 'fifty_2_wk',
		tradingsymbol: 'YESBANK',
		stock_ceil: 0.4,
		nrr: 0.8
	})
	var entity_2_save$ = Promise.promisify(entity_2.save$, {
		context: entity_2
	})


	seneca.ready(function() {
		//mongoose.connection.db.dropDatabase(function(err, result) {
		Promise.all([
			entity_1_save$(),
			entity_2_save$()
		]).then(function(res) {
			//console.log('insert', res)
			done()
		})
	//})
})
	})


}

function clear_db(done) {
	//mongoose.connection.db.dropDatabase(function(err, result) {
		//mongoose.connection.close()
		done()
	//})
}