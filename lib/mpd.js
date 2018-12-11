module.exports = exports = function MongoosePreviousData(schema, options) {
  async function setSettingsForData () {
    if (this.isNew) {
      this._previous_data = {};
      this._current_data = this;
    } else {
      const previousData = await this.findOne(this.getQuery()).populate(options.populate);
      this._previous_data = previousData ? previousData._doc : {};
      this._current_data = this._update;
    }
    const nameClass = options.class ? options.class : 'mpd';
    this[nameClass] = new ChagesModel(this);
  }

  async function pre(next) {
    await setSettingsForData.call(this);
    next();
  }

  schema.virtual('_previous_data')
    .get(function () {
      return this.__previous_data;
    }).set(function (previousData) {
      this.__previous_data = convertDataToSimpleObj(previousData);
    });

  schema.virtual('_current_data')
    .get(function () {
      return this.__current_data;
    }).set(function (currentData) {
      this.__current_data = convertDataToSimpleObj(currentData);
    });

  schema.pre('save', pre);
  schema.pre('findOneAndUpdate', pre);
  schema.pre('updateOne', pre);
};

class ChagesModel {
  constructor(model) {
    this.model = model;
    this.getPreviousData = this.getPreviousData.bind(this);
    this.getCurrentData = this.getCurrentData.bind(this);
    this.getChangesForArray = this.getChangesForArray.bind(this);
    this.isFieldChanged = this.isFieldChanged.bind(this);
  }

  getValueField(fields, obj) {
    let val = null;
    const fieldsArray = fields.split('.');
    fieldsArray.forEach(field => {
      if (typeof obj[field] !== 'object' && typeof obj[field] !== 'undefined') {
        val = obj[field];
      }
    });
    if (typeof val === 'object' || typeof val === 'undefined') {
      val = fieldsArray.reduce((accumValue, field) => {
        if (accumValue) {
          return accumValue[field];
        } else {
          return accumValue;
        }
      }, obj);
    }
    if (typeof val === 'object') {
      val = String(val);
    }
    return val;
  }

  getDataCompare (field = null, dataCompare) {
    const data = {};
    const keysData = field || Object.keys(dataCompare);
    keysData.forEach(key => {
      data[key] = dataCompare[key];
    });
    return data;
  }

  getRowFromData(dataArray, key, val) {
    return dataArray.find(prev =>
      this.getValueField(key, val) === this.getValueField(key, prev)
    );
  }

  getNewDeleteRowsArray(name, key, kind = 'N') {
    const newDelRows = [];
    const previousArray = this.model._previous_data[name] || [];
    const currentArray = this.model._current_data[name] || [];
    const leadArray = kind === 'N' ? currentArray : previousArray;
    const secondaryArray = kind === 'N' ? previousArray : currentArray;
    leadArray.forEach(curr => {
      const foundRow = this.getRowFromData(secondaryArray, key, curr);
      if (!foundRow) {
        newDelRows.push(convertDataToSimpleObj(curr));
      }
    });
    return newDelRows;
  }

  getEditRowsArray(name, key, fields) {
    const editRows = [];
    const previousArray = this.model._previous_data[name] || [];
    const currentArray = this.model._current_data[name] || [];
    currentArray.forEach(curr => {
      let edited = false;
      const foundRow = this.getRowFromData(previousArray, key, curr);
      if (foundRow) {
        fields.forEach(field => {
          const currVal = this.getValueField(field, curr);
          const prevVal = this.getValueField(field, foundRow);
          edited = currVal !== prevVal;
        });
      }
      if (edited) {
        editRows.push(convertDataToSimpleObj(curr));
      }
    });
    return editRows;
  }

  /**
   * Function return changes by Array
   * @param {String} name name array in mongoose
   * @param {String} key unique field for find changes
   * @param {Array} kind enum ['N' - new, 'D' - delete, 'E' - edit]
   * @param {Array} fields
   */
  getChangesForArray(name, key = '_id', kinds = ['N', 'D', 'E'], fields = []) {
    const changedRow = {
      new: [],
      edit: [],
      delete: []
    };
    kinds.forEach(kind => {
      if (kind === 'N') changedRow.new = this.getNewDeleteRowsArray(name, key, 'N');
      if (kind === 'E') changedRow.edit = this.getEditRowsArray(name, key, fields);
      if (kind === 'D') changedRow.delete = this.getNewDeleteRowsArray(name, key, 'D');
    });
    return changedRow;
  }

  /**
  * Function return modified object
  * @param {Array} fields for checked changes
  */
  isFieldChanged(fields) {
    let edited = false;
    fields.forEach(field => {
      const prevVal = this.getValueField(field, this.model._previous_data);
      const currVal = this.getValueField(field, this.model._current_data);
      edited = (currVal && currVal !== prevVal);
    });
    return !!edited;
  }

  /**
  * Function return previous data
  * @param {Array} fields for checked changes
  */
  getPreviousData(fields) {
    return this.getDataCompare(fields, this.model._previous_data);
  }

  /**
  * Function return current data
  * @param {Array} fields for checked changes
  */
  getCurrentData(fields) {
    return this.getDataCompare(fields, this.model._current_data);
  }
}

function convertDataToSimpleObj(dataJSON) {
  let currConvert = JSON.stringify(dataJSON);
  return JSON.parse(currConvert);
}
