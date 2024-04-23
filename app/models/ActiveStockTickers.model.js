
module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      _id: mongoose.Schema.Types.ObjectId,
      ticker: String,
      name: String,
      market: String,
      local: String,
      type: String,
      active: Boolean,
      currency_name: String,
      last_updated_utc: Date,
      createdAt: Date,
      updatedAt: Date,
      __v: Number,
      ticker_info: [{
        General: Object,
        Highlights: [{
          MarketCapitalization: Number
        }]
      }]
    }
  );

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const ActiveStockTickers = mongoose.model("ActiveStockTickers", schema);
  return ActiveStockTickers;
};
