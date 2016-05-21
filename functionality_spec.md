# harvest_evaluator

###### #evaluate()
- [x] should process the order signal object (`BUY || SELL`)
- [x] should query more detail for building the order object
- [ ] for `BUY` signal
	- [ ] calculate the allowed quantity to buy
	- [ ] if the qty is present in order signal object, then it should check whether the quantity is below the allowed quantity
- [ ] for `SELL` signal
	- [ ] *todo*
- [ ] should add entry in the db before relaying order to `executor` with status `INIT`
- [ ] should place the order to `Executor#place_order()`
- [ ] should add entry in the db after relaying the order to `executor` with status `PLACED`
 


###### #sell()
- [ ] todo


###### #register_order()
- [ ] should accept the order placed information from `executor`
- [ ] should save the order information to db under the collection `order_log`
- [ ] should relay back the order completion `COMPLETE` information to `Strategy#register_order()`


###### db collections

- [ ] owned
	-[ ] order_log
- [ ] referred
	-[ ] strategy
	-[ ] strategy_stock
