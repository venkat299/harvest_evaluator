// =======================
// private lib
// =======================
const Promise = require('bluebird');
const logger = require('winston');
const Joi = require('joi');

function approve_order_schema() {
  const schema = Joi.object().keys({
    order_id: Joi.string().guid().required(),
  });
  return schema;
}

function approve_order(opt, cb) {
  /* eslint no-param-reassign:0 */
  const seneca = this;
  const order_id = opt.order_id;
  const prev_track_id = opt.track_id;
  const order_log = seneca.make$('order_log');
  const order_log_save$ = Promise.promisify(order_log.save$, {
    context: order_log,
  });
  order_log.list$({
    order_id,
  }, ($err, $order_log_ls) => {
    const $order_log = $order_log_ls[0];
    const order_obj = $order_log.order_obj;
    logger.debug('order_obj: ', order_obj);
    const curr_track_id = `${Date.now()}/order_log/${order_obj.tradingsymbol}`;
    const forward_route = 'role:executor,cmd:place_order';
    $order_log.is_approved = true;
    seneca.act(forward_route, $order_log, (act_err, executor_res) => {
      logger.debug('executor_res: ', executor_res);
      if (act_err) logger.debug(act_err); // TODO add test case for this code
      if (executor_res.success) {
        $order_log.status = 'PLACED';
        $order_log.status_log.push(['PLACED', Date.now()]);
      } else {
        $order_log.status = 'FAILED';
        $order_log.status_log.push(['FAILED', Date.now()]);
      }
      $order_log.kite_response.push(executor_res.cb_msg_obj);
      $order_log.order_id = executor_res.cb_msg_obj.order_id;
      order_log_save$($order_log).then((val) => {
        cb(null, {
          success: true, // check if order reached executor module
          prev_track_id,
          curr_track_id,
          cb_msg: forward_route,
          cb_msg_obj: order_obj,
          db_val: val.data$(false),
          // seneca.make$('strategy_stock').list$({
          //   tradingsymbol: opt.tradingsymbol,
          //   strategy_id: opt.strategy_id,
          // }, (query_err, ls) => {
          //   if (query_err) cb(query_err);
          //   if (!ls.length === 1) cb(new Error('Err: Multiple entities received'));
          //   const entity = ls[0];
          //   entity.order_log = val.data$(false);
          //   logger.debug('order_log: ', entity.order_log);
          //   entity.save$(() => {
          //     cb(null, {
          //       success: true, // check if order reached executor module
          //       prev_track_id,
          //       curr_track_id,
          //       cb_msg: forward_route,
          //       cb_msg_obj: order_obj,
          //       db_val: val.data$(false),
          //     });
          //   });
          // });
        });
      });
    });
    // cb();
  });
}

function init() {
  // const app_config = options.app_config;
  const seneca = this;
  /* Retrieves all the signals for the given strategy
   */
  this.add('role:evaluator,cmd:approve_order',
    // {
    //   parambulator: 'dsd',
    // },
    approve_order.bind(seneca)
  );
}

module.exports = init;