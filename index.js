var evaluator = require('./lib/order_evaluator.js');

var opts = {};

module.exports = function(options) {

	var seneca = this
	var extend = seneca.util.deepextend
	opts = extend(opts, options)

	this.evaluator_config = options
	seneca.add('role:evaluator,cmd:buy', evaluator.buy)
	seneca.add('role:evaluator,cmd:sell', evaluator.sell)
	//seneca.add('role:evaluator,cmd:sell', evaluator.register_)
		//seneca.add('role:info,req:part', aliasGet)

	return {
		name: 'evaluator'
	}


}