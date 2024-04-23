module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      ev: String,
      sym: String,
      i: String,
      x: Number,
      p: Number,
      s: Number,
      c: [Number],
      t: Date,
      q: Number,
      z: Number,
      cn: [{
        modifier: Number,
        condition: String
      }]
    }
  );

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Tickers = mongoose.model("tickers", schema);
  return Tickers;
};
