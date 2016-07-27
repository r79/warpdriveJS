var RedrawQueue = require('./Utils/RedrawQueue');
var Selector = require('./Utils/Selector');

var WarpdriveObject = require('./Objects/WarpdriveObject');
var VectorObject = require('./Objects/VectorObject');
var ImageObject = require('./Objects/ImageObject');
var Rectangle = require('./Objects/Rectangle');
var Text = require('./Objects/Text');

var Warpdrive = function (canvasId, width, height, backgroundColor, backgroundImage, selectable, refreshTime) {
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
    //check the Code in the RedrawQueue to see how this will be used
    refreshTime = refreshTime || 1000/60;
    var queue = new RedrawQueue(refreshTime);

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
    this.queue = queue;
    this.selector = selector;
    this.ctx = ctx;
    this.surface = surface;

    //public exposing
    this.getObjectById = getObjectById;

    var createableObjects = {};

    function registerObject(name, object) {
        createableObjects[name] = object;
    }
    registerObject('VectorObject', VectorObject);
    registerObject('Rectangle', Rectangle);
    registerObject('Image', ImageObject);
    registerObject('Text', Text);

    this.registerObject = registerObject;

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

    function instantiateObject(type) {
        for (var attrname in createableObjects) {
            if(attrname == type) {
                return new createableObjects[attrname](self);
            }
        }
    }
    self.instantiateObject = instantiateObject;

    this.create = function (options, parent) {
        options = mergeOptionsIntoTemplate(options);
        return instantiateObject(options.type).regular(options, parent);
    };

    this.createChild  = function (options, parent) {
        options = mergeOptionsIntoTemplate(options);
        return instantiateObject(options.type).child(options, parent);
    };

    this.selector = selector;

    //creates the upper parental node, refered to as 'god' (as this dude has no one over him). If this is not set, nodes without a parent cannot be drawn (which means you can't do anything)
    // the godnode handles default variables and the background of the whole canvas.
    // this needs to be executed in the end as it needs to use the exposings

    var god;
    if(backgroundImage) {
        god = new ImageObject(self);
    } else {
        god = new Rectangle(self);
    }

    god.construct = function(options) {
        god.id = 'internal.god';
        god.god = true;

        //checks the type of the object. There is another check in 'handle style' that checks if the type is valid.
        if(options.type) {
            god.type = options.type;
        } else {
            console.log('WarpdriveObject construction failed: Object has no type\n' + JSON.stringify(options));
            return;
        }

        //sets the childnode
        god.childs = [];

        //adds the object to the huge objectsarray.
        self.objects[god.id] = god;

        god.positionX = 0;
        god.positionY = 0;

        god.width = options.width;
        god.height = options.height;

        god.color = options.color || '#FFFFFF';

        god.radians = 0;

        if(options.image) {
            if(!(options.image && (typeof options.image === 'CanvasImageSource' || typeof options.image === 'string'))) {
                return false;
            }
            if(typeof options.image === 'CanvasImageSource') {
                god.image = options.image;
            } else if(typeof options.image === 'string') {
                god.image = new Image();
                god.image.src = options.image;
            }
            return true;
        } else {
            god.handlePoints();
        }

        god.render();

        //returns its ID.
        return god.id;
    };
    god.construct({type: (backgroundImage? 'Image' : 'Rectangle'), color: backgroundColor, width: width, height: height, fontFamily: 'serif', image: (backgroundImage ? backgroundImage : '')});
};

//exposing the whole Lib to the global namespace for access.
//TODO: improve this
window.Warpdrive = Warpdrive;