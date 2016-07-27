//TODO: outdated, rework
/*
 declaration of the options argument:
 - width and height are optional for text.
 - height on text = fontsize
 - fontfamily will be ignored on non text, is optional, will use navObjects family if none is given

 options = {
 type: (string) 'text' or 'rect' or 'image'
 width: (int) defines width of the object, uses navObjects width if bigger than navObjects width,
 height: (int) same as width
 offsetX: (int) defines the offsetposition from the parent (or the surface if there is no parent),
 offsetY: (int) same as offsetY,
 color: (colorstring, e.x. '#FFFFFF') defines the color of the object (textcolor if text),
 fontfamily: (string) defines fontfamily on text
 textValue: (string) defines the text that should be drawn (text only),
 image: (ImageObject) Image that should be drawn. Doesn't need to be loaded.
 childs: predefined child objects
 }
 */

//Object that can be drawn.
function WarpdriveObject(warpdriveInstance) {
    var self = this;

    //provides and checks the most essential parts
    function constructEssentials(options, preValidation, postInit) {
        //checks if the id is valid. If it is not, the object will get a default ID.
        // IDs shall not have dots in there, as dots are used by the god object and by default ids.
        if (options.id && (options.id.indexOf(".") === -1 && !warpdriveInstance.getObjectById(options.id))) {
            self.id = options.id;
        } else {
            self.id = warpdriveInstance.getDefaultId();
        }
        //checks the type of the object. There is another check in 'handle style' that checks if the type is valid.
        if(options.type) {
            self.type = options.type;
        } else {
            console.log('WarpdriveObject construction failed: Object has no type\n' + JSON.stringify(options));
            return;
        }

        //sets the childnode
        self.childs = [];

        //adds the object to the huge objectsarray.
        warpdriveInstance.objects[self.id] = self;

        //callback to add specific logic
        if(preValidation) {
            preValidation();
        }

        self.handleStyle(options, warpdriveInstance.getObjectById(self.parent));

        if(self.type != 'Text' && options.childs) {
            options.childs.forEach(function (children) {
                self.childs.push(warpdriveInstance.createChild(children, self));
            });
        }

        //registers object as selectable if it's not text.
        if(options.selectable && self.type !== 'Text') {
            warpdriveInstance.selector.registerSelectable(self.id, options.selectable.z, options.selectable.x, options.selectable.y);
        }

        if(postInit) {
            postInit();
        }

        //returns its ID.
        return self.id;
    }

    //handles filling of styles and checks specific attributes per type. Also, validates type.
    //needs the instance of the parentnode.
    function handleStyle(options, parent) {
        self.offsetX = options.offsetX || 0;
        self.offsetY = options.offsetY || 0;

        //TODO: check if object is outside parent and handle that case in a good fashion.
        self.positionX = parent.positionX + self.offsetX;
        self.positionY = parent.positionY + self.offsetY;

        //Height und Width can not exceed parent.
        self.width = options.width <= parent.width ? options.width : parent.width;
        self.height = options.height <= parent.height ? options.height : parent.height;

        //Fontfamily should be set on all objects, to provide inheritance
        self.fontfamily = options.fontFamily || parent.fontFamily;

        //Sets color to white if none is provided
        self.color = options.color || '#FFFFFF';

        self.radians = self.radians || options.radians || 0;
    }
    self.handleStyle = handleStyle;

    //builds a regular object. Default constructor. Sets itself as a child of its parent (Parent = godnode if not set)
    function regular(options, parentId) {
        return constructEssentials(options, function () {
            //ID Validation and setting.
            if(!warpdriveInstance.getObjectById(parentId)) {
                self.parent = 'internal.god';
            } else {
                if(getObjectById(parentId).type === 'Text') {
                    console.log('WarpdriveObject construction failed: Text nodes can not be set as parents\n' + JSON.stringify(options));
                    return;
                } else {
                    self.parent = parentId;
                }
            }
        }, function () {
            warpdriveInstance.getObjectById(self.parent).childs.push(self.id);
            self.render();
        });
    }

    //creates a child, basically the same as regular, without setting the parent and without rendering
    function child(options, parent) {
        return constructEssentials(options, function () {
            if(parent.type === 'Text') {
                console.log('WarpdriveObject construction failed: Text nodes can not be set as parents\n' + JSON.stringify(options));
                return;
            } else {
                self.parent = parent.id;
            }
        });
    }

    function destroy() {
        var parent = warpdriveInstance.getObjectById(self.parent);
        var parentsChildArray = parent.childs;
        parentsChildArray.splice(parentsChildArray.indexOf(self.id), 1);

        delete warpdriveInstance.objects[self.id];

        parent.render();
    }
    self.destroy = destroy;

    //updates the current position of the object
    function updatePosition() {
        if(self.id !== 'internal.god') {
            self.positionX = warpdriveInstance.getObjectById(self.parent).positionX + self.offsetX;
            self.positionY = warpdriveInstance.getObjectById(self.parent).positionY + self.offsetY;
        }
    }

    //marks the object and all its child objects for render. Updates position before. This works by creating a list
    // of itself and all its childs that gets passed to the queue combined. With this approach, the canvas always shows
    // a complete state
    //The childchange variable is nescessary to make sure that the changes get queried, as this function is recursive
    //the tick is used to defer a rendering of an object (effectively used in defering the drawing of an image).
    function render(isChildChange, tick) {
        var temporaryChangequery = [];
        self.updatePosition();
        temporaryChangequery.push(self);

        self.childs.forEach(function (child) {
            temporaryChangequery = temporaryChangequery.concat(warpdriveInstance.objects[child].render(true));
        });

        if(isChildChange) {
            return temporaryChangequery;
        } else {
            warpdriveInstance.queue.queueChange(temporaryChangequery, tick);
        }
    }

    function specificRedraw(){
        //overwrite
    }

    function drawSelection(){
        warpdriveInstance.ctx.strokeStyle = warpdriveInstance.surface.selectorColor;
        warpdriveInstance.ctx.lineWidth = warpdriveInstance.surface.selectorSize;
        warpdriveInstance.ctx.strokeRect(self.positionX, self.positionY, self.width, self.height);
    }

    //redraws the current object. Only should be called by the RedrawQueue.
    function redraw() {
        //this save is just to make sure no style conflicts occur.
        warpdriveInstance.ctx.save();
        warpdriveInstance.ctx.fillStyle = self.color;

        self.specificRedraw();

        //draws the selection border
        if(self.selected) {
            self.drawSelection();
        }

        warpdriveInstance.ctx.restore();
    }

    function handleCollision() {
        //overWrite
        return false;
    }
    self.handleCollision = handleCollision;

    function checkCollisionFor(point) {
        //overWrite
        return false;
    }
    self.checkCollisionFor = checkCollisionFor;

    function checkCollision() {
        //overWrite
        return false;
    }
    self.checkCollision = checkCollision;

    //this is used to move an object. Rerenders on parental level to clean up dirty parts.
    function moveDistance(distanceX, distanceY) {
        var previousState = {
            x: self.offsetX,
            y: self.offsetY
        };

        self.offsetX = typeof distanceX !== 'undefined' ? self.offsetX + distanceX : self.offsetX;
        self.offsetY = typeof distanceY !== 'undefined' ? self.offsetY + distanceY : self.offsetY;

        self.updatePosition();
        if(self.checkCollision()) {
            self.offsetX = previousState.x;
            self.offsetY = previousState.y;
            self.updatePosition();
        } else {
            warpdriveInstance.getObjectById(self.parent).render();
        }
    }
    self.moveDistance = moveDistance;

    function changeRotation(difference) {
        var previousState = self.radians;

        self.radians = (self.radians / Math.PI * 180 + difference) * Math.PI / 180;

        self.updatePosition();
        if(self.checkCollision()) {
            self.radians = previousState;
            self.updatePosition();
        } else {
            warpdriveInstance.getObjectById(self.parent).render();
        }
    }
    self.changeRotation = changeRotation;

    //internal expose
    this.render = render;
    this.updatePosition = updatePosition;
    this.redraw = redraw;
    this.changeRotation = changeRotation;
    this.positionX = self.positionX;
    this.positionY = self.positionY;
    this.height = self.height;
    this.width = self.width;
    this.childs = self.childs;
    this.specificRedraw = specificRedraw;
    this.drawSelection = drawSelection;
    this.regular = regular;
    this.child = child;
    this.handleStyle = handleStyle;

    //external expose
    //create child is a helper function for creating a child by refering to the parental object (e.x. parent.createChild()). Uses regular constructor because of rendering.
    this.createChild = function (options, childs) {
        return new WarpdriveObject(warpdriveInstance).regular(options, childs, self.id);
    };
    this.moveDistance = moveDistance;
}

module.exports = WarpdriveObject;