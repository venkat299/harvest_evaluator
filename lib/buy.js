// =======================
// private lib
// =======================
var config = {};
var Promise = require('bluebird')
var buy = function(opt, cb) {
    //console.log(opt)
    var seneca = this
    var tradingsymbol = opt.tradingsymbol
    var strategy_id = opt.strategy_id
    var transaction_type = (opt.transaction_type).toUpperCase()
    var prev_track_id = opt.track_id
    var cmp = opt.ltp
    var query_more_buy_detail = query_buy_detail.bind(this)
    query_more_buy_detail = Promise.promisify(query_more_buy_detail)
    query_more_buy_detail(opt).then(function(extra_info) {
        var budget = extra_info.budget //10000
        var budget_spent = extra_info.spent
        var equity_ceil = extra_info.equity_ceil
        var budget_avail = (budget * (1 - equity_ceil)) - budget_spent
        var allowed_budget_for_stock = extra_info.stock_ceil
        var normalized_rate_of_return = extra_info.nrr
        var amt_available = budget_avail * allowed_budget_for_stock * normalized_rate_of_return
        var allowed_qty = Math.round(amt_available / cmp)
        var order_qty = opt.order_type || allowed_qty
        order_qty = (order_qty <= allowed_qty) ? order_qty : allowed_qty;
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
            validity: validity,
            ltp:cmp
        }
        var forward_route = 'role:executor,cmd:place_order'
            // add entry in db and send the id for unit test/validation
        var order_log = seneca.make$('order_log', {
                strategy_id: strategy_id,
                tradingsymbol: tradingsymbol,
                status: 'INIT',
                order_obj: order_obj,
                status_log: [],
                kite_response: [],
                order_id: null
            })
            // if (order_qty <= 0) {
            //     order_log.status_log.push(['FAILED', Date.now()])
            //     order_log.status = 'FAILED'
            // } else
        order_log.status_log.push(['INIT', Date.now()])
        var order_log_save$ = Promise.promisify(order_log.save$, {
            context: order_log
        })
        order_log_save$().then(function(err, saved_entity) {
            // if (order_qty <= 0) {
            //     cb(null, {
            //         success: true, // check if order reached executor module
            //         prev_track_id: prev_track_id,
            //         curr_track_id: curr_track_id,
            //         cb_msg: forward_route,
            //         cb_msg_obj: order_obj,
            //         db_val: saved_entity
            //     });
            // } else
            seneca.act(forward_route, order_obj, function(err, executor_res) {
                if (err) console.log(err) // TODO add test case for this code
                if (executor_res.success) {
                    order_log.status = 'PLACED'
                    order_log.status_log.push(['PLACED', Date.now()])
                } else {
                    order_log.status = 'FAILED'
                    order_log.status_log.push(['FAILED', Date.now()])
                }
                order_log.kite_response.push(executor_res.cb_msg_obj)
                order_log.order_id = executor_res.cb_msg_obj.order_id
                order_log_save$().then(function(val) {
                    var strategy_stock = seneca.make$('strategy_stock').list$({
                        tradingsymbol: opt.tradingsymbol,
                        strategy_id: opt.strategy_id
                    }, function(err, ls) {
                        if (!ls.length == 1) throw new Error("Err: Multiple entities received");
                        var entity = ls[0]
                        entity.order_log = val.data$(false)
                        entity.save$(function(err) {
                            if (err) callback(err);
                                            cb(null, {
                        success: true, // check if order reached executor module
                        prev_track_id: prev_track_id,
                        curr_track_id: curr_track_id,
                        cb_msg: forward_route,
                        cb_msg_obj: order_obj,
                        db_val: val
                    });
                        })
                    })
    
                })
            })
        })
    })
}
var query_buy_detail = function(opt, callback) {
    var info = {}
    var strategy_limit = this.make$('strategy')
    var strategy_limit_list$ = Promise.promisify(strategy_limit.list$, {
        context: strategy_limit
    })
    var strategy_stock = this.make$('strategy_stock')
    var strategy_stock_list$ = Promise.promisify(strategy_stock.list$, {
        context: strategy_stock
    })
    Promise.all([
        strategy_limit_list$({
            strategy_id: opt.strategy_id
        }),
        strategy_stock_list$({
            strategy_id: opt.strategy_id,
            tradingsymbol: opt.tradingsymbol
        })
    ]).then(function(results) {
        //console.log('results-->', results)
        info.budget = results[0][0].budget
        info.spent = results[0][0].spent
        info.equity_ceil = results[0][0].equity_ceil
        info.stock_ceil = results[1][0].stock_ceil
        info.nrr = results[1][0].nrr
        callback(null, info)
    })
}
module.exports = buy;