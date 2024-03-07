module.exports = mongoose => {
    var widgetSchema = mongoose.Schema({
        service: {
            type: String,
            required: [true, "Please Include your service name"]
        },
        widget: {
            type: String,
            required: [true, "Please Include your widget name"]
        },
        _id: {
            type: Intl,
            required: [true, "Please Include an id"]
        },
        config: {
            type: Object,
            required : [true, "Please Include your config"]
        }
    });
    const Widget = mongoose.model("widget", widgetSchema);
    return Widget;
};
