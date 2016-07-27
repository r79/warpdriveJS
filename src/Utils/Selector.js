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
        warpdriveInstance.getObjectById(current.parent).render();
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

module.exports = Selector;