var chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    should = chai.should();
var Promise = require('bluebird')
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
    transaction_type: 'BUY',
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
        track_id: "1463392269236/executor/YESBANK",
        order_detail: {
            "order_id": "151220000000000",
            "exchange_order_id": "511220371736111",
            "user_id": "AB0012",
            "status": "COMPLETE",
            "tradingsymbol": "YESBANK",
            "exchange": "NSE",
            "transaction_type": "BUY",
            "average_price": 100.00,
            "price": 100.00,
            "quantity": 19,
            "filled_quantity": 19,
            "trigger_price": 0,
            "status_message": "",
            "order_timestamp": "2015-12-20 15:01:43",
            "checksum": "5aa3f8e3c8cc41cff362de9f73212e28"
        }
    }
    //==================================
describe('Order_evaluator{}-> shadowing mode', function() {
    before('initialize', initialize)
    //after('clearing db', clear_db)
    describe('#buy() -> default test', function() {
        var curr_track_id = 'role:evaluator,cmd:evaluate'
            // it('should return a proper/standard api response', function(done) {
            //     seneca.act(curr_track_id, process_order_dt, function(err, val) {
            //         default_api_test(err, val, done)
            //     })
            // });
            // it('should return a proper cb_msg_obj for "BUY" call', function(done) {
            //     seneca.act(curr_track_id, process_order_dt, function(err, val) {
            //         expect(val.cb_msg_obj.transaction_type).to.equal('BUY')
            //         check_order_info(err, val)
            //         default_api_test(err, val, done)
            //     })
            // });
        it('should add entry in order_log with status `init`,`placed`', function(done) {
            this.timeout(15000);
            seneca.act(curr_track_id, process_order_dt, function(err, val) {
                expect(val.db_val.status_log).to.be.an('array')
                expect(val.db_val.status_log[0][0]).to.equal('INIT')
                expect(val.db_val.status_log[1][0]).to.equal('PLACED')
                expect(val.db_val.order_id).to.exist
                //console.log('expect', 'val.db_val.order_id:', val.db_val.order_id)
                expect(val.cb_msg_obj.transaction_type).to.equal('BUY')
                check_order_info(err, val)
                default_api_test(err, val)
                setTimeout((function(opt, done,expect) {
                  console.log('L81:test checking response from kite has come')
                    var order_id = val.db_val.order_id
                    expect(order_id).to.exist
                   // console.log('expect', 'order_id:', order_id)
                    var order_log = seneca.make$('order_log')
                    order_log.list$({
                        order_id: order_id
                    }, function(err, order_log) {
                     // console.log('L88', 'err:', err, 'order_log:', order_log)
                    	if (err) done(err)
                        expect(order_log[0].status).to.be.oneOf(['COMPLETE', 'CANCEL', 'REJECTED']);
                       // default_api_test(err, val)
                        done()
                    })
                }), 3000, val, done,expect)
                //done()
            })
        });
        // it('should create an entry in db after relaying order info to executor', function(done) {
        // 	seneca.act(curr_track_id, process_order_dt, function(err, val) {
        // 		check_order_info(err, val)
        // 		default_api_test(err, val, done)
        // 	})
        // });
    });
    // describe('#update_order() -> default test', function() {
    //     var curr_track_id = 'role:evaluator,cmd:update_order'
    //     it('should return a proper/standard api response\n\tshould update `order_log` collection entry status', function(done) {
    //         seneca.act(curr_track_id, order_executed_dt, function(err, val) {
    //             var order_id = val.cb_msg_obj.order_id
    //             expect(order_id).to.exist
    //             var order_log = seneca.make$('order_log')
    //             order_log.list$({
    //                 order_id: order_id
    //             }, function(err, order_log) {
    //                 expect(order_log[0].status).to.be.oneOf(['COMPLETE', 'CANCEL', 'REJECTED']);
    //                 default_api_test(err, val, done)
    //             })
    //         })
    //     });
    // })
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
var default_api_test = function(err, val) {
    should.not.exist(err);
    should.exist(val);
    expect(val).to.be.an('object');
    expect(val.success).to.be.true;
    expect(val.cb_msg).to.exist;
    expect(val.curr_track_id).to.exist;
    expect(val.prev_track_id).to.have.property;
}

function initialize(done) {
    intialize_server.start().then(function(my_seneca) {
        //console.log(my_seneca)
        seneca = my_seneca
        seneca.client();
        var entity_1 = seneca.make$('strategy', {
            strategy_id: 'fifty_2_wk',
            budget: 10000,
            spent: 2000,
            equity_ceil: 0.2,
            shadowing: true
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
        var entity_3 = seneca.make$('signal_log', {
            strategy_id: 'fifty_2_wk',
            tradingsymbol: 'YESBANK',
            transaction_type: 'BUY',
            signal_status: 'PENDING_OPEN',
            log: ['PENDING_OPEN', 'BUY', Date.now()]
        })
        var entity_3_save$ = Promise.promisify(entity_3.save$, {
            context: entity_3
        })
        seneca.ready(function() {
            Promise.all([
                entity_1_save$(),
                entity_2_save$(),
                entity_3_save$()
            ]).then(function(res) {
                done()
            })
        })
    })
}

function clear_db(done) {
    //mongoose.connection.db.dropDatabase(function(err, result) {
    //mongoose.connection.close()
    done()
    //})
}