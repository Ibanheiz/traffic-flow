class Strech {

    constructor(attrs) {
        Object.assign(this, attrs);
        this.maxTraffic = this.lanes * this.length;
        this.traffic = 0;
    }

    trafficLoad() {
        return this.traffic / this.maxTraffic;
    }

    enterVehicle(vehicle) {
        this.traffic += vehicle.length;
    }

    exitVehicle(vehicle) {
        this.traffic -= vehicle.length;
    }

    isFull() {
        return this.traffic >= this.maxTraffic;
    }

}

module.exports = Strech;
