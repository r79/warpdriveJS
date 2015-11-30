var WarpdriveJS = function (canvasId, width, height, backgroundColor, backgroundImage, selectable, refreshTime) {
    var self = this;

    var canvas = window.document.getElementById(canvasId);
    var ctx = canvas.getContext('2d');

    //this object holds the highest settings. If you want to delete it, make sure to set the selectorstuff somewhere else and change the reference.
    var surface = {
        width: width || window.innerWidth(),
        height: height || window.innerHeight(),
        offsetX: 0,
        offsetY: 0,
        selectorColor: '#FF0000',
        selectorSize: 10
    };

    canvas.width = surface.width;
    canvas.height = surface.height;

    //holds all WarpdriveObjects
    var objects = {};

    //Default refreshtime is 60 FPS
    //check the Code in the Query to see how this will be used
    refreshTime = refreshTime || 1000/60;
    var query = new Query(refreshTime);

    //small helperfunction, gets used on many points so be careful.
    function getObjectById(id) {
        return objects[id] || undefined;
    }

    //this code gives us the option of having default IDs. It is only used in the instances of Warpdriveobjects, hence
    // it's declared here as the counter would lose its state if declared there.
    var defaultIdCounter = 0;
    function getDefaultId() {
        defaultIdCounter++;
        return "default." + defaultIdCounter;
    }

    //instantiates the Selector module
    var selector = new Selector(self);

    //Everything below here is meant for exposing
    //TODO: improve in-module dependency management
    //In-module dependencies
    this.getDefaultId = getDefaultId;
    this.objects = objects;
    this.query = query;
    this.selector = selector;
    this.ctx = ctx;
    this.surface = surface;

    //public exposing
    this.getObjectById = getObjectById;
    this.create = function (options, parent) {
        return new WarpdriveObject(self).construct().regular(options, parent);
    };
    this.selector = selector;

    //creates the upper parental node, refered to as 'god' (as this dude has no one over him). If this is not set, nodes without a parent cannot be drawn (which means you can't do anything)
    // the godnode handles default variables and the background of the whole canvas.
    // this needs to be executed in the end as it needs to use the exposings
    new WarpdriveObject(self).construct().god({type: (backgroundImage? 'image' : 'rect'), color: backgroundColor, width: width, height: height, fontFamily: 'serif', image: (backgroundImage ? backgroundImage : '')});
};

//handles Drawing requests and Redraw
function Query(refreshTime) {

    // the changequery is used as a two dimensional array.
    // the lower dimension holds objects that need to be redrawed,
    // the upper one provides a deferring draw functionality.
    var changeQuery = [];

    //checks if there are changes in the current tick and draws them, then sets the next tick
    function update() {
        var currentChanges = changeQuery.shift();
        if(currentChanges) {
            while(currentChanges.length > 0) {
                currentChanges.shift().redraw();
            }
        }
        setTimeout(update, refreshTime);
    }
    //starts the redrawing process. Put this in it's own function if you need to manually start and stop
    setTimeout(update, refreshTime);

    //requests a redraw for an object or an array of objects. By adding a tick variable, you can provide when this
    // shall be processed. This currently only gets used by images, which need to be preloaded before they can be drawn.
    // Deferred drawing also provides the fundamental part for animations.
    // the tick variable says in how many ticks this shall be processed
    function queryChange(changeObject, tick) {
        tick = tick || 0;
        if(!Array.isArray(changeObject)) {
            changeObject = [changeObject];
        }
        if(changeQuery[tick]) {
            changeQuery[tick] = changeQuery[tick].concat(changeObject);
        } else {
            changeQuery[tick] = changeObject;
        }
    }

    //exposing the querychange function.
    return {
        queryChange: queryChange
    }
}

// This module provides selectability
function Selector(warpdriveInstance) {
    // saves the indices of the currently selected item. Looks like this when filled:
    // {
    //   z: (integer)
    //   x: (integer)
    //   y: (integer)
    // ]
    var selected;

    // an array with all selectable objects. Is 3 dimensional, [z][x][y]. Objects are saved by id. They register themself with the registerSelectable.
    var selectables = [];

    //gets the currently selected object
    function getSelected() {
        return warpdriveInstance.getObjectById(selectables[selected.z][selected.x][selected.y]);
    }

    //registers an object as selectable. Fills up the selectables array.
    function registerSelectable(selectableId, z, x, y) {
        if(!selectables[z]) {
            selectables[z] = [];
        }
        if(!selectables[z][x]) {
            selectables[z][x] = [];
        }
        selectables[z][x][y] = selectableId;
    }

    // updates the currently selected with the selection that is set and marks it for render. Setting the selected variable of an object draws a border around it if the object is no text.
    // see the redraw function in WarpdriveObject.
    function updateCurrent(selection) {
        var current = getSelected();
        current.selected = selection;
        current.render();
    }

    //starts the selection. Needs to be used so the first tile gets updated. If no first tile is set, it uses the 0 point in all axes.
    function startSelection(firstTile) {
        selected = firstTile || {z: 0,x: 0,y: 0};
        updateCurrent(true);
    }

    //stops the selection by unselecting the current tile.
    function stopSelection() {
        updateCurrent(false);
    }

    //changes the currently selected object. Only works, if there is a Object to move to.
    function move(target) {
        if(selectables[target.z] && selectables[target.z][target.x] && selectables[target.z][target.x][target.y]) {
            updateCurrent(false);
            selected = target;
            updateCurrent(true);
        }
    }

    //the move functions provide an easy to use movement in all directions.
    //TODO: put all moves into a subclass, so one can access them by calling move.[direction]() e.x. move.left();
    function moveLeft() {
        var target = {
            z: selected.z,
            x: selected.x - 1,
            y: selected.y
        };
        move(target);
    }

    function moveRight() {
        var target = {
            z: selected.z,
            x: selected.x + 1,
            y: selected.y
        };
        move(target);
    }

    function moveUp() {
        var target = {
            z: selected.z,
            x: selected.x,
            y: selected.y - 1
        };
        move(target);
    }

    function moveDown() {
        var target = {
            z: selected.z,
            x: selected.x,
            y: selected.y + 1
        };
        move(target);
    }

    function moveOut() {
        var target = {
            z: selected.z - 1,
            x: 0,
            y: 0
        };
        move(target);
    }

    function moveIn() {
        var target = {
            z: selected.z + 1,
            x: 0,
            y: 0
        };
        move(target);
    }

    //exposers
    this.registerSelectable = registerSelectable;
    this.getSelected = getSelected;
    this.startSelection = startSelection;
    this.stopSelection = stopSelection;
    this.moveLeft = moveLeft;
    this.moveRight = moveRight;
    this.moveUp = moveUp;
    this.moveDown = moveDown;
    this.moveIn = moveIn;
    this.moveOut = moveOut;
}

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

    //whole construction logic. Might be put into a factory.
    function construct() {
        //provides and checks the most essential parts
        function constructEssentials(options, extended) {
            //checks if the id is valid. If it is not, the object will get a default ID.
            // IDs shall not have dots in there, as dots are used by the god object and by default ids.
            if (options.id && (options.id.indexOf(".") === -1 && !getObjectById(options.id)) || self.god) {
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
            extended();

            //registers object as selectable if it's not text.
            if(options.selectable && self.type !== 'text') {
                warpdriveInstance.selector.registerSelectable(self.id, options.selectable.z, options.selectable.x, options.selectable.y);
            }

            //returns its ID.
            return self.id;
        }

        //checks if text is valid and prepares it.
        function prepareAndValidateText(options) {
            if(!options.textValue){
                return false;
            }
            self.textValue = options.textValue;
            return true;
        }

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

            switch(self.type) {
                case 'text':
                    if(!prepareAndValidateText(options)) {
                        console.log('WarpdriveObject construction failed: Text object has no text value\n' + JSON.stringify(options));
                        return;
                    }
                    break;

                case 'image':
                    if(!prepareAndValidateImage(options)) {
                        console.log('WarpdriveObject construction failed: Image object has none or a not valid image attribute\n' + JSON.stringify(options));
                        return;
                    }
                    break;

                case 'rect':
                    break;

                default:
                    console.log('WarpdriveObject construction failed: Object type is invalid\n' + JSON.stringify(options));
                    return;
            }
        }

        //merges template options into the regular options. Works Cascading (the highest option is used).
        //removes the template attribute.
        function mergeOptionsIntoTemplate(options) {
            if(options.template) {
                var merged = {};
                var template = options.template.template ? mergeOptionsIntoTemplate(options.template) : options.template;
                for (var attrname in template) {
                    if(attrname !== 'template') {
                        merged[attrname] = template[attrname];
                    }
                }
                for (var attrname in options) {
                    if (attrname !== 'template') {
                        merged[attrname] = options[attrname];
                    }
                }
                return merged;
            }
            return options;
        }

        //builds a regular object. Default constructor. Sets itself as a child of its parent (Parent = godnode if not set)
        function regular(options, parentId) {
            options = mergeOptionsIntoTemplate(options);
            return constructEssentials(options, function () {
                //ID Validation and setting.
                if(!warpdriveInstance.getObjectById(parentId)) {
                    self.parent = 'internal.god';
                } else {
                    if(getObjectById(parentId).type === 'text') {
                        console.log('WarpdriveObject construction failed: Text nodes can not be set as parents\n' + JSON.stringify(options));
                        return;
                    } else {
                        self.parent = parentId;
                    }
                }

                handleStyle(options, warpdriveInstance.getObjectById(self.parent));

                //sets itself as parent
                warpdriveInstance.getObjectById(self.parent).childs.push(self.id);

                //if the node isn't text, it instantiates and adds all its childs to itself
                if(self.type != 'text' && options.childs) {
                    options.childs.forEach(function (children) {
                        self.childs.push(new WarpdriveObject(warpdriveInstance).construct().child(children, self));
                    });
                }

                render();
            });
        }

        //creates a child, basically the same as regular, without setting the parent and without rendering
        function child(options, parent) {
            options = mergeOptionsIntoTemplate(options);
            return constructEssentials(options, function () {
                if(parent.type === 'text') {
                    console.log('WarpdriveObject construction failed: Text nodes can not be set as parents\n' + JSON.stringify(options));
                    return;
                } else {
                    self.parent = parent.id;
                }

                handleStyle(options, parent);

                if(self.type != 'text' && options.childs) {
                    options.childs.forEach(function (children) {
                        self.childs.push(new WarpdriveObject(warpdriveInstance).construct().child(children, self));
                    });
                }
            });
        }

        //creates the godnode. Skips all handleStyle stuff except for the image.
        function god(options) {
            options.id = 'internal.god';
            self.god = true;
            return constructEssentials(options, function () {

                self.positionX = 0;
                self.positionY = 0;

                self.width = options.width;
                self.height = options.height;

                self.color = options.color || '#FFFFFF';

                if(options.image) {
                    prepareAndValidateImage(options);
                }
                render();
            });
        }

        //exposation of the 3 construction functions
        return {
            regular: regular,
            child: child,
            god: god
        }
    }

    //updates the current position of the object
    function updatePosition() {
        if(self.id !== 'internal.god') {
            self.positionX = warpdriveInstance.getObjectById(self.parent).positionX + self.offsetX;
            self.positionY = warpdriveInstance.getObjectById(self.parent).positionY + self.offsetY;
        }
    }

    //marks the object and all its child objects for render. Updates position before. This works by creating a list
    // of itself and all its childs that gets passed to the query combined. With this approach, the canvas always shows
    // a complete state
    //The childchange variable is nescessary to make sure that the changes get queried, as this function is recursive
    //the tick is used to defer a rendering of an object (effectively used in defering the drawing of an image).
    function render(isChildChange, tick) {
        var temporaryChangequery = [];
        updatePosition();
        temporaryChangequery.push(self);

        self.childs.forEach(function (child) {
            temporaryChangequery = temporaryChangequery.concat(warpdriveInstance.objects[child].render(true));
        });

        if(isChildChange) {
            return temporaryChangequery;
        } else {
            warpdriveInstance.query.queryChange(temporaryChangequery, tick);
        }
    }

    //redraws the current object. Only should be called by the Query.
    function redraw() {
        //this save is just to make sure no style conflicts occur.
        warpdriveInstance.ctx.save();
        warpdriveInstance.ctx.fillStyle = self.color;

        //chooses the correct type
        switch(self.type) {
            case 'rect':
                warpdriveInstance.ctx.fillRect(self.positionX, self.positionY, self.width, self.height);
                break;

            case 'text':
                warpdriveInstance.ctx.font = self.height + 'px ' + self.fontfamily;
                warpdriveInstance.ctx.fillText(self.textValue, self.positionX, self.positionY, self.width);
                break;

            case 'image':
                //images behave a bit more special, as they only can get drawed when they are completely loaded.
                //image.complete is not the safest function, but the easiest to use
                if(self.image.complete) {
                    warpdriveInstance.ctx.drawImage(self.image, self.positionX, self.positionY, self.width, self.height);
                } else {
                    //if the image hasn't been loaded yet, we draw a placeholder and defer the drawing for later.
                    warpdriveInstance.ctx.fillRect(self.positionX, self.positionY, self.width, self.height);
                    render(false, 10);
                }
                break;
        }
        //draws the selection border
        if(self.selected) {
            warpdriveInstance.ctx.strokeStyle = warpdriveInstance.surface.selectorColor;
            warpdriveInstance.ctx.lineWidth = warpdriveInstance.surface.selectorSize;
            warpdriveInstance.ctx.strokeRect(self.positionX + warpdriveInstance.surface.selectorSize / 2, self.positionY + warpdriveInstance.surface.selectorSize/2, self.width - warpdriveInstance.surface.selectorSize, self.height - warpdriveInstance.surface.selectorSize);
        }

        warpdriveInstance.ctx.restore();
    }

    //this is used to move an object. Rerenders on parental level to clean up dirty parts.
    function moveDistance(distanceX, distanceY) {
        self.offsetX = typeof distanceX !== 'undefined' ? self.offsetX + distanceX : self.offsetX;
        self.offsetY = typeof distanceY !== 'undefined' ? self.offsetY + distanceY : self.offsetY;
        warpdriveInstance.getObjectById(self.parent).render();
    }

    //internal expose
    this.render = render;
    this.redraw = redraw;
    this.positionX = self.positionX;
    this.positionY = self.positionY;
    this.height = self.height;
    this.width = self.width;
    this.childs = self.childs;
    this.construct = construct;

    //external expose
    //create child is a helper function for creating a child by refering to the parental object (e.x. parent.createChild()). Uses regular constructor because of rendering.
    this.createChild = function (options, childs) {
        return new WarpdriveObject(warpdriveInstance).construct().regular(options, childs, self.id);
    };
    this.moveDistance = moveDistance;
}

//exposing the whole Lib to the global namespace for access.
//TODO: improve this
window.document.WarpdriveJS = WarpdriveJS;