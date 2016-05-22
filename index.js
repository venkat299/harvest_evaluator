var buy = require('./lib/buy.js');
var sell = require('./lib/sell.js');
var update_order = require('./lib/update_order.js');



var opts = {};

module.exports = function(options) {

	var seneca = this
	var extend = seneca.util.deepextend
	opts = extend(opts, options)

	this.evaluator_config = options
	seneca.add('role:evaluator,cmd:evaluate,transaction_type:BUY', buy)
	seneca.add('role:evaluator,cmd:evaluate,transaction_type:SELL', sell)
	seneca.add('role:evaluator,cmd:update_order', update_order)
	
	//seneca.add('role:evaluator,cmd:sell', evaluator.register_)
		//seneca.add('role:info,req:part', aliasGet)

	return {
		name: 'evaluator'
	}


}