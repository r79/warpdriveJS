function Rectangle(warpdriveInstance) {
    var self = warpdriveInstance.instantiateObject('VectorObject');

    self.points = [
        {
            x: 0,
            y: 0
        },
        {
            x: 100,
            y: 0
        },
        {
            x: 100,
            y: 100
        },
        {
            x: 0,
            y: 100
        }
    ];

    return self;
}

module.exports = Rectangle;