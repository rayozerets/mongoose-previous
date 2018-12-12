**Mongoose Previous Data**

is a mongoose plugin with which you can get the previous data. For example after update or after save some data you can get only changed fields or even new/deleted/edited rows array.

**Installation**

```
$ npm install mongoose-previous --save
```

**Setup**

```
const mongoosePreData = require('mongoose-previous');

schemaOrders.plugin(mongoosePreData, {populate: 'city ordersArray.order', class: 'mpd'});

```
**Option keys and defaults**

 populate: use if you need get some field from other collections

 class: name for context mongoose data. Defaul 'mpd'

**Usage**

getPreviousData: Function return previous data or some field from data
* @param {Array} fields for checked changes. Default: null - return all prev data
```
schemaOrders.post('findOneAndUpdate', function (doc, next) {
  // return only prev sum
  const prevSum = this.mpd.getPreviousData(['sum']);
  // return all prev data
  const prevData = this.mpd.getPreviousData();
});
```
getChangesForArray: Function return changes by Array { new: [some new rows], edit: [some edit rows], delete: [some del rows] }
* @param {String} name name array in mongoose
* @param {String} key unique field for find changes
* @param {Array} kind enum ['N' - new, 'D' - delete, 'E' - edit]
* @param {Array} fields
```
schemaOrders.post('findOneAndUpdate', function (doc, next) {
  // return new and delete orders
  const newAndDelOrders = this.mpd.getChangesForArray('ordersArray', 'order._id', ['N', 'D']);
});
```
isFieldChanged: Function return boolean (changed fields or not)
* @param {Array} fields for checked changes
```
schemaOrders.post('findOneAndUpdate', function (doc, next) {
  const changed = this.mpd.isFieldChanged(['sum', 'interval', 'date']);
});
```
getCurrentData: Function return current data
* @param {Array} fields for checked changes
```
schemaOrders.post('findOneAndUpdate', function (doc, next) {
  const updatedData = context.mpd.getCurrentData();
});
```

All this functions you can use for "post save" too
