// =======================
// private lib
// =======================
var config = {};

var Promise = require('bluebird')
	//var this = require('this')

var update_order = function(opt, cb) {
	var seneca = this
	var prev_track_id = opt.track_id
	var curr_track_id = Date.now() + '/evaluator/' + opt.order_detail.tradingsymbol
	var forward_route = 'role:strategy,cmd:update_order,id:@strategy_id'

	// add entry in db and send the id for unit test/validation
	var order_log = seneca.make$('order_log')
	var order_log_save$ = Promise.promisify(order_log.save$, {
		context: order_log
	})
	var order_log_list$ = Promise.promisify(order_log.list$, {
		context: order_log
	})
	var order_log_load$ = Promise.promisify(order_log.load$, {
		context: order_log
	})
	var order_log_remove$ = Promise.promisify(order_log.remove$, {
		context: order_log
	})
	order_log_list$({
		order_id: opt.order_detail.order_id
	}).then(function(val) {
		var entity = val[0]
		entity.status = opt.order_detail.status
		entity.status_log.push([opt.order_detail.status, Date.now()])
		entity.kite_response.push(opt.order_detail)
		entity.order_detail = opt.order_detail

		order_log_save$(entity).then(function() {

			if (entity.status === 'COMPLETE') {
				forward_route = forward_route.replace(/@strategy_id/, entity.strategy_id)
				
				seneca.act(forward_route, entity,function(val) {

					cb(null, {
						success: true,
						prev_track_id: prev_track_id,
						curr_track_id: curr_track_id,
						cb_msg: forward_route,
						cb_msg_obj: entity
					})
				})
			}


		})



	})


}

module.exports = update_order;