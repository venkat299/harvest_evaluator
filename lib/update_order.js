// =======================
// private lib
// =======================
const logger = require('winston');
const Promise = require('bluebird');
// var this = require('this')
function update_order(opt, cb) {
  logger.debug('update_order', 'opt:', opt);
  const seneca = this;
  const prev_track_id = opt.track_id;
  const curr_track_id = `${Date.now()}/evaluator/${opt.order_detail.tradingsymbol}`;
  let forward_route = 'role:signal_log,cmd:update_order,id:@strategy_id';
  // add entry in db and send the id for unit test/validation
  const order_log = seneca.make$('order_log');
  const order_log_save$ = Promise.promisify(order_log.save$, {
    context: order_log,
  });
  const order_log_list$ = Promise.promisify(order_log.list$, {
    context: order_log,
  });

  order_log_list$({
    order_id: opt.order_detail.order_id,
  }).then((val) => {
    if (val.length !== 1) cb(new Error('ERR:COLLECTION_COUNT_MISMATCH'));
    const entity = val[0];
    entity.status = opt.order_detail.status;
    entity.status_log.push([opt.order_detail.status, Date.now()]);
    entity.kite_response.push(opt.order_detail);
    entity.order_detail = opt.order_detail;
    order_log_save$(entity).then(() => {
      if (entity.status === 'COMPLETE') {
        forward_route = forward_route.replace(/@strategy_id/, entity.strategy_id);
        seneca.act(forward_route, entity, (err) => {
          if (err) cb(err);
          cb(null, {
            success: true,
            prev_track_id,
            curr_track_id,
            cb_msg: forward_route,
            cb_msg_obj: entity.data$(false),
          });
        });
      }
    });
  });
}
module.exports = update_order;