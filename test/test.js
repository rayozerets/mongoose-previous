const dbURI    = 'mongodb://localhost/test-mongoose-previous'
const mongoose = require('mongoose');
const mongoosePreData = require('../lib/mpd');

mongoose.Promise = global.Promise;

const schemaOrders = new mongoose.Schema({
  sum: Number,
  interval: String,
  contains: [
    { sku: String, q: Number }
  ]
});

let checked;
let textChecked;
let funcChecked;

function isFieldChanged() {
  return this.mpd.isFieldChanged(['sum']);
}

function getPreviousData() {
  return this.mpd.getPreviousData(['sum']).sum;
}

function getChangesForArray() {
  return this.mpd.getChangesForArray('contains', 'sku', ['E'], ['q']).edit.length;
}

schemaOrders.post('updateOne', function(doc, next) {
  const changed = funcChecked.call(this);
  if (changed === checked) {
    next();
  } else {
    next('Error: ' + textChecked);
  };
});
schemaOrders.plugin(mongoosePreData, {populate: '', class: 'mpd'});

const Order = mongoose.model('Order', schemaOrders);

describe('Check mongoose previous', function() {
  before(function(done) {
    if (mongoose.connection.db) return done();
    mongoose.connect(dbURI, { useNewUrlParser: true }, done);
  });

  describe('Check isFieldChanged', function() {
    it('sum must not be changed', function(done) {
      checked = false;
      textChecked = 'the sum must not be changed';
      funcChecked = isFieldChanged;
      const orderFirstSave = new Order({sum: 10, interval: '14-18'});
      orderFirstSave.save().then(() => {
        return orderFirstSave.updateOne({sum: 10});
      }).then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    });
    it('sum must be changed', function(done) {
      checked = true;
      textChecked = 'the sum must be changed';
      funcChecked = isFieldChanged;
      const orderFirstSave = new Order({sum: 10, interval: '14-18'});
      orderFirstSave.save().then(() => {
        return orderFirstSave.updateOne({sum: 11});
      }).then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
  describe('Check getPreviousData', function() {
    it('sum must be equal 10', function(done) {
      checked = 10;
      textChecked = 'the sum must be = 10';
      funcChecked = getPreviousData;
      const orderFirstSave = new Order({sum: 10, interval: '14-18'});
      orderFirstSave.save().then(() => {
        return orderFirstSave.updateOne({sum: 20});
      }).then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
  describe('Check getChangesForArray', function() {
    it('Edited only one row', function(done) {
      checked = 1;
      textChecked = 'length must be 1';
      funcChecked = getChangesForArray;
      const orderFirstSave = new Order({
        sum: 10,
        interval: '14-18',
        contains: [
          {sku: '111', q: 4},
          {sku: '222', q: 3},
          {sku: '333', q: 7},
        ]
      });
      orderFirstSave.save().then(() => {
        return orderFirstSave.updateOne({
          sum: 10,
          interval: '14-18',
          contains: [
            {sku: '111', q: 4},
            {sku: '222', q: 5},
            {sku: '333', q: 7},
          ]}
        );
      }).then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.connection.close(done);
    });
  });

})
