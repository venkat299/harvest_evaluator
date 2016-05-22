# harvest_evaluator

######spec_version:0.0.1

###### #evaluate()
- [x] should process the order signal object (`BUY || SELL`)
- [x] should query more detail for building the order object
- [x] for `BUY` signal
	- [x] calculate the allowed quantity to buy
	- [x] if the qty is present in order signal object, then it should check whether the quantity is below the allowed quantity
- [ ] for `SELL` signal
	- [ ] *todo*
- [x] should add entry in the db before relaying order to `executor` with status `INIT`
- [x] should place the order to `Executor#place_order()`
- [x] should add entry in the db after relaying the order to `executor` with status `PLACED`
 


###### #sell()
- [ ] todo


###### #update_order()
- [x] should accept the order placed information from `executor`
- [x] should save the order information to db under the collection `order_log`
- [x] should relay back the order completion `COMPLETE` information to `Strategy#register_order()`


###### db collections

- [ ] owned
	-[ ] order_log
- [ ] referred
	-[ ] strategy
	-[ ] strategy_stock

###### order life-cycle-states
 - INIT
 - PLACED
 - **COMPLETE**
 - **CANCEL**
 - **REJECTED**