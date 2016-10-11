// =======================
// private lib
// =======================
const Promise = require('bluebird');
const logger = require('winston');
  /* eslint max-len:0 */
/**
 * whenever the order is complete, the stock_budget of the stock is increased or decreased
 * if signal status is pending_open then the amount is debited
 * if signal_status is pending_close then the amount is credited
 */

function update_stock_budget(opt, callback) {
  const seneca = this;
  const signal_log = seneca.make$('signal_log');
  const signal_log_list$ = Promise.promisify(signal_log.list$, {
    context: signal_log,
  });
  signal_log_list$({
    strategy_id: opt.order_obj.strategy_id,
    tradingsymbol: opt.order_obj.tradingsymbol,
  }).then((val) => {
    // logger.debug('L19', 'val:', val)
    const filtered_signals = val.filter((elem) => (elem.signal_status === 'PENDING_OPEN' || elem.signal_status === 'PENDING_CLOSE'));
    if (filtered_signals.length !== 1) throw new Error('ERR:COLLECTION_COUNT_MISMATCH');
    const elem = filtered_signals[0];
    if (!(elem.transaction_type === opt.order_obj.transaction_type)) {
      throw new Error('ERR:ILLEGAL_ENTITY_STATE');
    }
    const $signal_status = elem.signal_status;

    const strategy_stock = seneca.make$('strategy_stock');
    const strategy_stock_list$ = Promise.promisify(strategy_stock.list$, {
      context: strategy_stock,
    });
    strategy_stock_list$({
      strategy_id: opt.order_obj.strategy_id,
      tradingsymbol: opt.order_obj.tradingsymbol,
    }).then((list) => {
      if (list.length !== 1) throw new Error('ERR:COLLECTION_COUNT_MISMATCH');
      const $strategy_stock = list[0];
      const transaction_value = opt.order_detail.average_price * opt.order_detail.quantity;
      logger.debug('transaction_value:', transaction_value, 'signal_status', $signal_status);
      if (!(transaction_value && transaction_value > 0)) throw new Error('ERR:ILLEGAL_ENTITY_STATE');
      if ($signal_status === 'PENDING_OPEN') { // debit
        $strategy_stock.stock_budget = ($strategy_stock.stock_budget) ? ($strategy_stock.stock_budget - transaction_value) : (transaction_value * -1);
      } else if ($signal_status === 'PENDING_CLOSE') { // credit
        $strategy_stock.stock_budget = ($strategy_stock.stock_budget) ? ($strategy_stock.stock_budget + transaction_value) : transaction_value;
      }
      $strategy_stock.save$((err, result) => {
        if (err) throw err;
        callback(null, result);
      });
    });
  }).catch(e => {
    throw e;
  });
}


function init() {
  // const app_config = options.app_config;
  const seneca = this;
  /* Retrieves all the signals for the given strategy
   */
  this.add('role:evaluator,cmd:update_stock_budget', update_stock_budget.bind(seneca));
}

module.exports = init;
