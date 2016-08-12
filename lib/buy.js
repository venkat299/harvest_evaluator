// =======================
// private lib
// =======================
const Promise = require('bluebird');
const logger = require('winston');

function generateUUID() {
  let d = new Date().getTime();
  // if (window.performance && typeof window.performance.now ==='function') {
  //     d += performance.now(); //use high-precision timer if available
  // }
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

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
    info.auto_approve = results[0][0].auto_approve;
    info.stock_ceil = results[1][0].stock_ceil;
    info.nrr = results[1][0].nrr;
    callback(null, info);
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
    const auto_approve = extra_info.auto_approve;
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
      order_id: generateUUID(),
      strategy_id,
      tradingsymbol,
      status: 'INIT',
      order_obj,
      status_log: [],
      kite_response: [],
      is_approved: auto_approve,
    });
    if (order_qty <= 0) {
      order_log.status_log.push(['FAILED', Date.now()]);
      order_log.status = 'FAILED';
      order_log.status_msg = 'Order quantiy is nil';
      cb(null, {
        success: true, // check if order reached executor module
        prev_track_id,
        curr_track_id,
        cb_msg: 'order could not be generated',
        cb_msg_obj: null,
        db_val: order_log.save$(),
      });
    } else {
      order_log.status_log.push(['INIT', Date.now()]);
      const order_log_save$ = Promise.promisify(order_log.save$, {
        context: order_log,
      });
      order_log_save$().then(($order_log) => {
        const forward_route = 'role:executor,cmd:place_order';
        if (auto_approve) { // forward to executor
        } else {
          // save it to db and wait for approval
          cb(null, {
            success: true, // check if order reached executor module
            prev_track_id,
            curr_track_id,
            cb_msg: forward_route,
            cb_msg_obj: order_obj,
            db_val: $order_log.data$(false),
          });
        }
        // relay_to_executor($order_log, seneca, order_obj, opt, curr_track_id, cb);
      }).catch(cb);
    }
  });
}
module.exports = buy;