# harvest_evaluator

###### #buy()
- [x] should accept `buy` signal from `Strategy#run()`
- [x] should query for more detail for building order object
- [ ] should check for similiar pending order for same stock and strategy **--to be reviewed**
      - [ ] should discard if similiar order is present **--to be reviewed**
- [ ] should place the order to `Executor#place_order()`
- [x] should add entry in db after relaying order to `executor` with status `PLACED`
 


###### #sell()
- [ ] todo


###### #register_order()
- [ ] should accept the order placed information from `executor`
- [ ] should save the order information to db under the collection `order_log`
- [ ] should relay back the order completion `COMPLETE` information to `Strategy#register_order()`


