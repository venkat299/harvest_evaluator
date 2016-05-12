// =======================
// private lib
// =======================
var config = {};

var buy = function(opt, cb) {

	var symbol = opt.symbol
	var strategy_id = opt.strategy_id
	var cmd = opt.cmd
var prev_track_id = opt.track_id


	// get portfolio budget
	var budget = 10000
		// get portfolio amt remaining to process
	var budget_spent = 0
		// get portfolio amt possible to spend for particular stock
	var budget_avail = budget - budget_spent
	var equity_ceil = 0.2
	var budget_ceil_of_stock = 0.4
	var rate_of_return = 0.2
	var normalized_rate_of_return = 0.9

	var amt_available = (budget_avail * (1 - equity_ceil)) * budget_ceil_of_stock * normalized_rate_of_return

	var cmp = opt.cmp | 80
	var order_qty = Math.round(amt_available * cmp);
	var order_type = opt.order_type | 'MARKET';
	var validity = opt.validity | 'DAY';
	var delivery = opt.delivery | 'CNC';

	var curr_track_id= Date.now()+'/evaluator/'+symbol

	// -d "api_key=xxx" \
	// -d "access_token=yyy" \
	// -d "tradingsymbol=ACC" \
	// -d "exchange=NSE" \
	// -d "transaction_type=BUY" \
	// -d "order_type=MARKET" \
	// -d "quantity=1" \
	// -d "product=MIS" \
	// -d "validity=DAY"
	var order_obj = {
		strategy_id : strategy_id,
		prev_track_id:prev_track_id,
		track_id : curr_track_id,
		tradingsymbol: symbol,
		exchange: opt.exchange | 'NSE',
		transaction_type: cmd,
		order_type: order_type,
		quantity: order_qty,
		product: delivery,
		validity: validity
	}


	//this.log.info('placing order to executor : ', JSON.stringify(order_obj));

	cb(null, {
		success: true,
		curr_track_id:curr_track_id,
		msg: 'placing order to order_executor',
		msg_body:order_obj
	});

	// get rate of return for this stock / risk factor for stock/ beta
	// calculate qty to process 
	// set order details
	// send order to order_executor
	// 
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
	var budget_avail = budget - budget_spent
	var equity_ceil = 0.2
	var budget_ceil_of_stock = 0.4
	var rate_of_return = 0.2
	var normalized_rate_of_return = 0.9

	var amt_available = (budget_avail * (1 - equity_ceil)) * budget_ceil_of_stock * normalized_rate_of_return

	var cmp = opt.cmp | 80
	var order_qty = Math.round(amt_available * cmp);
	var order_type = opt.order_type | 'MARKET';
	var validity = opt.validity | 'DAY';
	var delivery = opt.delivery | 'CNC';

	var curr_track_id= Date.now()+'/evaluator/'+symbol

	// -d "api_key=xxx" \
	// -d "access_token=yyy" \
	// -d "tradingsymbol=ACC" \
	// -d "exchange=NSE" \
	// -d "transaction_type=BUY" \
	// -d "order_type=MARKET" \
	// -d "quantity=1" \
	// -d "product=MIS" \
	// -d "validity=DAY"
	var order_obj = {
		strategy_id : strategy_id,
		prev_track_id:prev_track_id,
		track_id : curr_track_id,
		tradingsymbol: symbol,
		exchange: opt.exchange | 'NSE',
		transaction_type: cmd,
		order_type: order_type,
		quantity: order_qty,
		product: delivery,
		validity: validity
	}


	//this.log.info('placing order to executor : ', JSON.stringify(order_obj));

	cb(null, {
		success: true,
		curr_track_id:curr_track_id,
		msg: 'placing order to order_executor',
		msg_body:order_obj
	});

	// get rate of return for this stock / risk factor for stock/ beta
	// calculate qty to process 
	// set order details
	// send order to order_executor
	// 
}




module.exports.buy = buy;
module.exports.sell = sell;