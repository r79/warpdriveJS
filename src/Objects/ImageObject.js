var WarpdriveObject = require('./WarpdriveObject');

function ImageObject(warpdriveInstance) {
    var self = new WarpdriveObject(warpdriveInstance);

    //checks if image is valid and prepares it. If image is a URL string, it tries to load it.
    function prepareAndValidateImage(options) {
        if(!(options.image && (typeof options.image === 'CanvasImageSource' || typeof options.image === 'string'))) {
            return false;
        }
        if(typeof options.image === 'CanvasImageSource') {
            self.image = options.image;
        } else if(typeof options.image === 'string') {
            self.image = new Image();
            self.image.src = options.image;
        }
        return true;
    }

    var parentalHandleStyle = self.handleStyle;
    self.handleStyle = function(options, parent) {
        parentalHandleStyle(options, parent);
        if(!prepareAndValidateImage(options)) {
            console.log('WarpdriveObject construction failed: Image object has none or a not valid image attribute\n' + JSON.stringify(options));
            return;
        }
    };

    self.specificRedraw = function() {
        //images behave a bit more special, as they only can get drawed when they are completely loaded.
        //image.complete is not the safest function, but the easiest to use
        if(self.image.complete) {
            warpdriveInstance.ctx.drawImage(self.image, self.positionX, self.positionY, self.width, self.height);
        } else {
            //if the image hasn't been loaded yet, we draw a placeholder and defer the drawing for later.
            warpdriveInstance.ctx.fillRect(self.positionX, self.positionY, self.width, self.height);
            self.render(false, 10);
        }
    };
    return self;
}

module.exports = ImageObject;