// =======================
// private lib
// =======================
var config = {};

var Promise = require('bluebird')
	//var this = require('this')

var buy = function(opt, cb) {
	var symbol = opt.symbol
	var strategy_id = opt.strategy_id
	var cmd = (opt.cmd).toUpperCase()
	var prev_track_id = opt.track_id

	// var make$ = Promise.promisify(this.make$, {
	// 		context: this
	// 	})
	//console.log(opt)
	var query_more_buy_detail = query_buy_detail.bind(this)
	query_more_buy_detail = Promise.promisify(query_more_buy_detail)

	query_more_buy_detail(opt).then(function(extra_info) {

		console.log('extra_info', extra_info)
			// get portfolio budget
		var budget = extra_info.budget //10000
			// get portfolio amt remaining to process
		var budget_spent = extra_info.spent
			// get portfolio amt possible to spend for particular stock
		var equity_ceil = extra_info.equity_ceil
		var budget_avail = (budget * (1 - equity_ceil)) - budget_spent
		var allowed_budget_for_stock = extra_info.stock_ceil
			//var rate_of_return = 0.2
		var normalized_rate_of_return = extra_info.nrr

		var amt_available = budget_avail * allowed_budget_for_stock * normalized_rate_of_return

		var cmp = opt.cmp || 80
		var order_qty = Math.round(amt_available * cmp)
		var order_type = opt.order_type || 'MARKET'
		var validity = opt.validity || 'DAY'
		var delivery = opt.delivery || 'CNC'
		var exchange = opt.exchange || 'NSE'

		var curr_track_id = Date.now() + '/evaluator/' + symbol

		var order_obj = {
			strategy_id: strategy_id,
			prev_track_id: prev_track_id,
			track_id: curr_track_id,
			tradingsymbol: symbol,
			exchange: exchange,
			transaction_type: cmd,
			order_type: order_type,
			quantity: order_qty,
			product: delivery,
			validity: validity
		}
		var forward_route = 'role:executor,run:place_order'

		cb(null, {
			success: true,
			prev_track_id: prev_track_id,
			curr_track_id: curr_track_id,
			cb_msg: forward_route,
			cb_msg_obj: order_obj
		});

	})



}
var sell = function(opt, cb) {

	var symbol = opt.symbol
	var strategy_id = opt.strategy_id
	var cmd = opt.cmd
	var prev_track_id = opt.track_id

	// get portfolio budget
	var budget = 10000
		// get portfolio amt remaining to process
	var budget_spent = 0
		// get portfolio amt possible to spend for particular stock
	var equity_ceil = 0.2
	var budget_avail = (budget * (1 - equity_ceil)) - budget_spent
	var allowed_budget_for_stock = 0.4
	var rate_of_return = 0.2
	var normalized_rate_of_return = 0.9

	var amt_available = budget_avail * allowed_budget_for_stock * normalized_rate_of_return

	var cmp = opt.cmp | 80
	var order_qty = Math.round(amt_available * cmp);
	var order_type = opt.order_type | 'MARKET';
	var validity = opt.validity | 'DAY';
	var delivery = opt.delivery | 'CNC';

	var curr_track_id = Date.now() + '/evaluator/' + symbol

	var order_obj = {
		strategy_id: strategy_id,
		prev_track_id: prev_track_id,
		track_id: curr_track_id,
		tradingsymbol: symbol,
		exchange: opt.exchange | 'NSE',
		transaction_type: cmd,
		order_type: order_type,
		quantity: order_qty,
		product: delivery,
		validity: validity
	}
	var forward_route = 'role:executor,run:place_order'

	//this.log.info('placing order to executor : ', JSON.stringify(order_obj));

	cb(null, {
		success: true,
		prev_track_id: prev_track_id,
		curr_track_id: curr_track_id,
		msg: forward_route,
		msg_body: order_obj
	});

	// get rate of return for this stock / risk factor for stock/ beta
	// calculate qty to process 
	// set order details
	// send order to order_executor
	// 
}

var query_buy_detail = function(opt, callback) {
	var info = {}

	var strategy_limit = this.make$('strategy')
	var strategy_limit$ = Promise.promisify(strategy_limit.list$, {
		context: strategy_limit
	})
	var strategy_stock = this.make$('strategy_stock')
	var strategy_stock_list$ = Promise.promisify(strategy_stock.list$, {
		context: strategy_stock
	})

	Promise.all([
		strategy_limit$({
			strategy_id: opt.strategy_id
		}),
		strategy_stock_list$({
			strategy_id: opt.strategy_id,
			symbol: opt.symbol
		})
	]).then(function(results) {
		info.budget = results[0][0].budget
		info.spent = results[0][0].spent
		info.equity_ceil = results[0][0].equity_ceil
		info.stock_ceil = results[1][0].stock_ceil
		info.nrr = results[1][0].nrr
		callback(null, info)
	})
}
module.exports.buy = buy;
module.exports.sell = sell;