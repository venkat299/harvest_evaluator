// =======================
// private lib
// =======================
var config = {};

var Promise = require('bluebird')
	//var this = require('this')

var buy = function(opt, cb) {
	//console.log(opt)
	var seneca = this
	var tradingsymbol = opt.tradingsymbol
	var strategy_id = opt.strategy_id
	var transaction_type = (opt.transaction_type).toUpperCase()
	var prev_track_id = opt.track_id
	var cmp = opt.ltp

	// var make$ = Promise.promisify(this.make$, {
	// 		context: this
	// 	})
	//console.log(opt)
	var query_more_buy_detail = query_buy_detail.bind(this)
	query_more_buy_detail = Promise.promisify(query_more_buy_detail)

	query_more_buy_detail(opt).then(function(extra_info) {

		//console.log('extra_info', extra_info)
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

		var order_qty = Math.round(amt_available / cmp)
		var order_type = opt.order_type || 'MARKET'
		var validity = opt.validity || 'DAY'
		var delivery = opt.delivery || 'CNC'
		var exchange = opt.exchange || 'NSE'

		var curr_track_id = Date.now() + '/evaluator/' + tradingsymbol

		var order_obj = {
			strategy_id: strategy_id,
			prev_track_id: prev_track_id,
			track_id: curr_track_id,
			tradingsymbol: tradingsymbol,
			exchange: exchange,
			transaction_type: transaction_type,
			order_type: order_type,
			quantity: order_qty,
			product: delivery,
			validity: validity
		}
		var forward_route = 'role:executor,cmd:place_order'

		seneca.act(forward_route, order_obj, function(err,val){

			if(err) 
				console.log(err)


			// add entry in db and send the id for unit test/validation
			var order_log = seneca.make$('order_log', {
				strategy_id: strategy_id,
				tradingsymbol: tradingsymbol,
				status:'PLACED',
				order_obj:order_obj
			})
		var order_log_save$ = Promise.promisify(order_log.save$, {
		context: order_log
		})

		order_log_save$().then(function(err,val){
			cb(null, {
			success: true, // check if order reached executor module
			prev_track_id: prev_track_id,
			curr_track_id: curr_track_id,
			cb_msg: forward_route,
			cb_msg_obj: order_obj,
			db_val:val
		});
		})

			

		})

		

	})



}

var sell = function(opt, cb) {

	cb(null, {
		// success: true,
		// prev_track_id: prev_track_id,
		// curr_track_id: curr_track_id,
		// msg: forward_route,
		// msg_body: order_obj
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
			tradingsymbol: opt.tradingsymbol
		})
	]).then(function(results) {
		console.log('results-->',results)
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