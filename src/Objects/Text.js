var WarpdriveObject = require('./WarpdriveObject');

function Text(warpdriveInstance) {
    var self = new WarpdriveObject(warpdriveInstance);

    //checks if text is valid and prepares it.
    function prepareAndValidateText(options) {
        if(!options.textValue){
            return false;
        }
        self.textValue = options.textValue;
        return true;
    }

    var parentalHandleStyle = self.handleStyle;
    self.handleStyle = function(options, parent) {
        parentalHandleStyle(options, parent);
        if(!prepareAndValidateText(options)) {
            console.log('WarpdriveObject construction failed: Text object has no text value\n' + JSON.stringify(options));
            return;
        }
    };

    self.specificRedraw = function() {
        warpdriveInstance.ctx.font = self.height + 'px ' + self.fontfamily;
        warpdriveInstance.ctx.fillText(self.textValue, self.positionX, self.positionY, self.width);
    };
    return self;
}

module.exports = Text;