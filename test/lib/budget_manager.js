let chai = require('chai'),
  expect = chai.expect,
  assert = chai.assert,
  should = chai.should();
const Promise = require('bluebird');
// ###### initializing test server ########
const intialize_server = require('../init_test_server.js');
let seneca;
//= ========== mock strategy_config ============
const mock_dt = { strategy_id: 'fifty_2_wk',
 tradingsymbol: 'GMBREW',
 status: 'COMPLETE',
 order_obj: {
   strategy_id: 'fifty_2_wk',
   prev_track_id: '1467599484361/strategy/GMBREW',
   track_id: '1467599489718/evaluator/GMBREW',
   tradingsymbol: 'GMBREW',
   exchange: 'NSE',
   transaction_type: 'BUY',
   order_type: 'MARKET',
   quantity: 10,
   product: 'CNC',
   validity: 'DAY',
   ltp: 673.8,
 }, order_detail: {
   quantity: 10,
   average_price: 600,
 },
      'status_log': [
        ['INIT', 1467599489718],
        ['PLACED', 1467599489748],
        ['COMPLETE', 1467599490787],
      ],
    };
//= =================================
describe('order_log:', function () {
  before('check test server initialization', intialize);
    // after('close server', close_seneca)
  //= =========`=== tests ==============
  describe('#update_stock_budget ', update_stock_budget);
  //= =================================
  function update_stock_budget() {
    it('should reduce the stock budget to -6000', function (done) {
      const dt = mock_dt;
      seneca.act('role:evaluator,cmd:update_stock_budget', dt, function (err, val) {
        if (err) done(err);
        expect(val.stock_budget).to.equal(-6000);
        console.log(val);
        done();
      });
    });
    it('should increase the stock budget to 6000', function (done) {
      const dt = mock_dt;
      dt.tradingsymbol = 'YESBANK';
      dt.order_obj.tradingsymbol = 'YESBANK';
      seneca.act('role:evaluator,cmd:update_stock_budget', dt, function (err, val) {
        if (err) done(err);
        expect(val.stock_budget).to.equal(6000);
        console.log(val);
        done();
      });
    });
  }
});

function intialize(done) {
  intialize_server.get_server(function (options) {
    // console.log(options.seneca)
    seneca = options.seneca;
    seneca.client({
      host: 'localhost',
      port: options.port,
    });

    seneca.ready(function () {
      seneca.make$('signal_log', {
        transaction_type: 'BUY',
        tradingsymbol: 'GMBREW',
        strategy_id: 'fifty_2_wk',
        signal_status: 'PENDING_OPEN',
      }).save$(function () {
        seneca.make$('strategy_stock', {
          strategy_id: 'fifty_2_wk',
          tradingsymbol: 'GMBREW',
          status: 'ACTIVE',
        }).save$(function () {
          seneca.make$('signal_log', {
            transaction_type: 'BUY',
            tradingsymbol: 'YESBANK',
            strategy_id: 'fifty_2_wk',
            signal_status: 'PENDING_CLOSE',
          }).save$(function () {
            seneca.make$('strategy_stock', {
              strategy_id: 'fifty_2_wk',
              tradingsymbol: 'YESBANK',
              status: 'ACTIVE',
            }).save$(function () {
              console.log('>>>> before all hook cleared');
              done(); // <======== finally done is called here
            });
          });
        });
      });
    });

    // seneca.ready(function() {
//     seneca.make$('order_log', { strategy_id: 'fifty_2_wk',
// 	tradingsymbol: 'GMBREW',
// 	status: 'COMPLETE',
// 	order_obj: {
//   strategy_id: 'fifty_2_wk',
//   prev_track_id: '1467599484361/strategy/GMBREW',
//   track_id: '1467599489718/evaluator/GMBREW',
//   tradingsymbol: 'GMBREW',
//   exchange: 'NSE',
//   transaction_type: 'BUY',
//   order_type: 'MARKET',
//   quantity: 8,
//   product: 'CNC',
//   validity: 'DAY',
//   ltp: 673.8,
// },order_detail: {
//   quantity: 8,
//   average_price:600,
// },
//       'status_log': [
//         ['INIT', 1467599489718],
//         ['PLACED', 1467599489748],
//         ['COMPLETE', 1467599490787],
//       ],
//     }).save$(function () {
//       console.log('>>>> before all hook cleared');
//       done(); // <======== finally done is called here
//     });
  });
}

function close_seneca(done) {
  seneca.close(done);
}