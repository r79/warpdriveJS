//handles Drawing requests and Redraw
function RedrawQueue(refreshTime) {
    var self = this;

    // the changequery is used as a two dimensional array.
    // the lower dimension holds objects that need to be redrawed,
    // the upper one provides a deferring draw functionality.
    var changeQueue = [];

    //checks if there are changes in the current tick and draws them, then sets the next tick
    function update() {
        var currentChanges = changeQueue.shift();
        if(currentChanges) {
            while(currentChanges.length > 0) {
                currentChanges.shift().redraw();
            }
        }
        setTimeout(self.update, refreshTime);
    }
    self.update = update;
    //starts the redrawing process. Put this in it's own function if you need to manually start and stop
    setTimeout(self.update, refreshTime);

    //requests a redraw for an object or an array of objects. By adding a tick variable, you can provide when this
    // shall be processed. This currently only gets used by images, which need to be preloaded before they can be drawn.
    // Deferred drawing also provides the fundamental part for animations.
    // the tick variable says in how many ticks this shall be processed
    function queueChange(changeObject, tick) {
        tick = tick || 0;
        if(!Array.isArray(changeObject)) {
            changeObject = [changeObject];
        }
        if(changeQueue[tick]) {
            changeObject.forEach(function(object) {
                if(changeQueue.indexOf(object) < 0) {
                    changeQueue[tick].push(object);
                }
            });
        } else {
            changeQueue[tick] = changeObject;
        }
    }
    self.queueChange = queueChange;

    return self;
}

module.exports = RedrawQueue;