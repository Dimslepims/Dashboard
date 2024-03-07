module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
          name: String,
          baseUrl: String,
          config: Object,
        },
        { timestamps: true }
    );
    
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
    
    const Service = mongoose.model("service", schema);
    return Service;
};