const buy = require('./lib/buy.js');
const sell = require('./lib/sell.js');
const update_order = require('./lib/update_order.js');
const approve_order = require('./lib/approve_order.js');
const budget_manager = require('./lib/budget_manager.js');

let opts = {};

module.exports = function (options) {
  const seneca = this;
  const extend = seneca.util.deepextend;
  opts = extend(opts, options);

  this.evaluator_config = options;
  seneca.add('role:evaluator,cmd:evaluate,transaction_type:BUY', buy);
  seneca.add('role:evaluator,cmd:evaluate,transaction_type:SELL', buy);
  seneca.add('role:evaluator,cmd:update_order', update_order);

  // ======= approve_order =========== //
  seneca.use(approve_order, opts);

    // ======= budget_manager =========== //
  seneca.use(budget_manager, opts);

  // seneca.add('role:evaluator,cmd:sell', evaluator.register_)
  // seneca.add('role:info,req:part', aliasGet)

  return {
    name: 'evaluator',
  };
};