// =======================
// private lib
// =======================
const Promise = require('bluebird');
const logger = require('winston');

function query_buy_detail(opt, callback) {
  const info = {};
  const strategy_limit = this.make$('strategy');
  const strategy_limit_list$ = Promise.promisify(strategy_limit.list$, {
    context: strategy_limit,
  });
  const strategy_stock = this.make$('strategy_stock');
  const strategy_stock_list$ = Promise.promisify(strategy_stock.list$, {
    context: strategy_stock,
  });
  Promise.all([
    strategy_limit_list$({
      strategy_id: opt.strategy_id,
    }),
    strategy_stock_list$({
      strategy_id: opt.strategy_id,
      tradingsymbol: opt.tradingsymbol,
    }),
  ]).then((results) => {
    // logger.debug('results-->', results)
    info.budget = results[0][0].budget;
    info.spent = results[0][0].spent;
    info.equity_ceil = results[0][0].equity_ceil;
    info.stock_ceil = results[1][0].stock_ceil;
    info.nrr = results[1][0].nrr;
    callback(null, info);
  });
}

function relay_to_executor(order_log, seneca, order_obj, opt, curr_track_id, cb) {
  /* eslint no-param-reassign:0 */
  const prev_track_id = opt.track_id;
  const order_log_save$ = Promise.promisify(order_log.save$, {
    context: order_log,
  });
  const forward_route = 'role:executor,cmd:place_order';
  seneca.act(forward_route, order_obj, (act_err, executor_res) => {
    logger.debug('executor_res: ', executor_res);
    if (act_err) logger.debug(act_err); // TODO add test case for this code
    if (executor_res.success) {
      order_log.status = 'PLACED';
      order_log.status_log.push(['PLACED', Date.now()]);
    } else {
      order_log.status = 'FAILED';
      order_log.status_log.push(['FAILED', Date.now()]);
    }
    order_log.kite_response.push(executor_res.cb_msg_obj);
    order_log.order_id = executor_res.cb_msg_obj.order_id;
    order_log_save$(order_log).then((val) => {
      seneca.make$('strategy_stock').list$({
        tradingsymbol: opt.tradingsymbol,
        strategy_id: opt.strategy_id,
      }, (query_err, ls) => {
        if (query_err) cb(query_err);
        if (!ls.length === 1) cb(new Error('Err: Multiple entities received'));
        const entity = ls[0];
        entity.order_log = val.data$(false);
        logger.debug('order_log: ', entity.order_log);
        entity.save$(() => {
          cb(null, {
            success: true, // check if order reached executor module
            prev_track_id,
            curr_track_id,
            cb_msg: forward_route,
            cb_msg_obj: order_obj,
            db_val: val.data$(false),
          });
        });
      });
    });
  });
}

function buy(opt, cb) {
  // logger.debug(opt)
  const seneca = this;
  const tradingsymbol = opt.tradingsymbol;
  const strategy_id = opt.strategy_id;
  const transaction_type = (opt.transaction_type).toUpperCase();
  const cmp = opt.ltp;
  const prev_track_id = opt.track_id;
  let query_more_buy_detail = query_buy_detail.bind(this);
  query_more_buy_detail = Promise.promisify(query_more_buy_detail);
  query_more_buy_detail(opt).then((extra_info) => {
    const budget = extra_info.budget; // 10000
    const budget_spent = extra_info.spent;
    const equity_ceil = extra_info.equity_ceil;
    const budget_avail = (budget * (1 - equity_ceil)) - budget_spent;
    const allowed_budget_for_stock = extra_info.stock_ceil;
    const normalized_rate_of_return = extra_info.nrr;
    const amt_available = budget_avail * allowed_budget_for_stock * normalized_rate_of_return;
    const allowed_qty = Math.round(amt_available / cmp);
    let order_qty = opt.order_type || allowed_qty;
    order_qty = (order_qty <= allowed_qty) ? order_qty : allowed_qty;
    const order_type = opt.order_type || 'MARKET';
    const validity = opt.validity || 'DAY';
    const delivery = opt.delivery || 'CNC';
    const exchange = opt.exchange || 'NSE';
    const curr_track_id = `${Date.now()}/evaluator/${tradingsymbol}`;
    const order_obj = {
      strategy_id,
      prev_track_id,
      track_id: curr_track_id,
      tradingsymbol,
      exchange,
      transaction_type,
      order_type,
      quantity: order_qty,
      product: delivery,
      validity,
      ltp: cmp,
    };
    // add entry in db and send the id for unit test/validation
    const order_log = seneca.make$('order_log', {
      strategy_id,
      tradingsymbol,
      status: 'INIT',
      order_obj,
      status_log: [],
      kite_response: [],
      order_id: null,
    });
    // if (order_qty <= 0) {
    //     order_log.status_log.push(['FAILED', Date.now()])
    //     order_log.status = 'FAILED'
    // } else
    order_log.status_log.push(['INIT', Date.now()]);
    const order_log_save$ = Promise.promisify(order_log.save$, {
      context: order_log,
    });
    order_log_save$().then(($order_log) => {
      relay_to_executor($order_log, seneca, order_obj, opt, curr_track_id, cb);
    }).catch(cb);
  });
}
module.exports = buy;