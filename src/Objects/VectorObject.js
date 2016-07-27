var WarpdriveObject = require('./WarpdriveObject');

function VectorObject(warpdriveInstance) {
    var self = new WarpdriveObject(warpdriveInstance);

    //big ups to http://stackoverflow.com/a/9939071
    function get_polygon_centroid(pts) {
        var first = pts[0], last = pts[pts.length-1];
        //TODO: really nice stuff, but this might be in the wrong place
        if (first.x != last.x || first.y != last.y) pts.push(first);
        var twicearea=0,
            x=0, y=0,
            nPts = pts.length,
            p1, p2, f;
        for ( var i=0, j=nPts-1 ; i<nPts ; j=i++ ) {
            p1 = pts[i]; p2 = pts[j];
            f = p1.x*p2.y - p2.x*p1.y;
            twicearea += f;
            x += ( p1.x + p2.x ) * f;
            y += ( p1.y + p2.y ) * f;
        }
        f = twicearea * 3;
        return { x:x/f, y:y/f };
    }

    self.updateDrawPoints = function updateDrawPoints() {
        self.centralPoint = get_polygon_centroid(self.drawPoints);
        function calculatePoint(x, y) {
            var tempX = x - self.centralPoint.x;
            var tempY = y - self.centralPoint.y;

            var rotatedX = tempX*Math.cos(self.radians) - tempY*Math.sin(self.radians);
            var rotatedY = tempX*Math.sin(self.radians) + tempY*Math.cos(self.radians);

            return {
                x: rotatedX + self.centralPoint.x,
                y: rotatedY + self.centralPoint.y
            }
        }
        for(var i=0;i<self.drawPoints.length;i++) {
            self.drawPoints[i] = calculatePoint(self.drawPoints[i].x, self.drawPoints[i].y);
        }
    };

    self.handlePoints = function handlePoints() {
        self.drawPoints = [];
        self.collisionFiels = [];
        self.outerRadius = 0;

        for(var i = 0; i < self.points.length; i++) {
            var point = self.points[i];
            self.drawPoints[i] = {
                x: self.positionX + self.width * point.x / 100,
                y: self.positionY + self.height * point.y / 100
            };
            var distanceFromCenter = Math.sqrt(point.x * point.x + point.y * point.y);
            if(distanceFromCenter > self.outerRadius) {
                self.outerRadius = distanceFromCenter;
            }
        }
        self.updateDrawPoints();
    };


    var parentalHandleStyle = self.handleStyle;
    self.handleStyle = function(options, parent) {
        parentalHandleStyle(options, parent);
        self.handlePoints();
    };

    var parentalUpdatePosition = self.updatePosition;
    self.updatePosition = function () {
        parentalUpdatePosition();
        self.handlePoints();
    };

    self.specificRedraw = function() {
        warpdriveInstance.ctx.beginPath();
        warpdriveInstance.ctx.moveTo(self.drawPoints[0].x, self.drawPoints[0].y);

        for(var i = 1; i < self.drawPoints.length; i++) {
            warpdriveInstance.ctx.lineTo(self.drawPoints[i].x, self.drawPoints[i].y);
        }
        warpdriveInstance.ctx.fill();

        //outcomment to see collision fields
        //for(var i = 1; i < self.drawPoints.length; i++) {
        //    warpdriveInstance.ctx.beginPath();
        //    warpdriveInstance.ctx.moveTo(self.centralPoint.x, self.centralPoint.y);
        //    warpdriveInstance.ctx.lineTo(self.drawPoints[i].x, self.drawPoints[i].y);
        //    warpdriveInstance.ctx.stroke();
        //}
    };

    self.drawSelection = function () {
        warpdriveInstance.ctx.strokeStyle = warpdriveInstance.surface.selectorColor;
        warpdriveInstance.ctx.lineWidth = warpdriveInstance.surface.selectorSize;

        warpdriveInstance.ctx.beginPath();
        warpdriveInstance.ctx.moveTo(self.drawPoints[0].x, self.drawPoints[0].y);

        for(var i = 1; i < self.drawPoints.length; i++) {
            warpdriveInstance.ctx.lineTo(self.drawPoints[i].x, self.drawPoints[i].y);
        }

        //redrawing the first line for smoothing the first corner
        warpdriveInstance.ctx.lineTo(self.drawPoints[1].x, self.drawPoints[1].y);

        warpdriveInstance.ctx.stroke();
    };

    self.handleCollision = function handleCollision() {
        return true;
    };

    self.checkCollisionFor = function checkCollisionFor(point) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

        var x = point.x, y = point.y;

        var inside = false;
        for (var i = 0, j = self.drawPoints.length - 1; i < self.drawPoints.length; j = i++) {
            var xi = self.drawPoints[i].x, yi = self.drawPoints[i].y;
            var xj = self.drawPoints[j].x, yj = self.drawPoints[j].y;

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    self.collisionBoundaryHit = function (sibling) {
        var x = sibling.centralPoint.x - self.centralPoint.x;
        var y = sibling.centralPoint.y - self.centralPoint.y;

        return !(Math.sqrt(x*x + y*y) < sibling.outerRadius - self.outerRadius);
    };

    self.checkCollision = function checkCollision() {
        //if the current object collided into another object
        var collidedSibling = undefined;
        var allreadyChecked = [];

        var parent = warpdriveInstance.getObjectById(self.parent);

        wholeLoop:
            for(var i = 0; i < parent.childs.length; i++) {
                var sibling = warpdriveInstance.getObjectById(self.parent).childs[i];

                sibling = warpdriveInstance.getObjectById(sibling);

                if(sibling.id === self.id || allreadyChecked.indexOf(sibling.id) > 0) {
                    continue;
                }
                if(sibling.drawPoints && self.collisionBoundaryHit(sibling)) {
                    for(var j = 0; j < sibling.drawPoints.length - 1; j++) {
                        if(self.checkCollisionFor(sibling.drawPoints[j])) {
                            collidedSibling = sibling;
                            break wholeLoop;
                        }
                    }
                    for(var k = 0; k < self.drawPoints.length - 1; k++) {
                        if(sibling.checkCollisionFor(self.drawPoints[k])) {
                            collidedSibling = sibling;
                            break wholeLoop;
                        }
                    }
                }
                allreadyChecked.push(sibling.id);
            }

        var leavingParentalBoundaries = false;
        if(parent.drawPoints) {
            for(var j = 0; j < self.drawPoints.length - 1; j++) {
                if(!parent.checkCollisionFor(self.drawPoints[j])) {
                    leavingParentalBoundaries = true;
                    break;
                }
            }
        }

        if(leavingParentalBoundaries) {
            console.log('left');
            return true;
        }

        if(collidedSibling) {
            return self.handleCollision(collidedSibling);
        } else {
            return false;
        }
    };

    return self;
}

module.exports = VectorObject;