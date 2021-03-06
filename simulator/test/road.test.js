const assert = require('chai').assert;

const Road = require('../src/road');
const Vehicle = require('../src/vehicle');

const completeRoadAttrs = {
    length: 10,
    sleep: 1000 * 60 * 6,
    fastForward: 1000 * 60 * 6,
    stretches: [{
        velocity: 40,
        lanes: 2
    }, {
        velocity: 100,
        lanes: 3
    }, {
        velocity: 100,
        lanes: 4
    }, {
        velocity: 80,
        lanes: 3
    }, {
        velocity: 40,
        lanes: 2
    }]
};

describe('Road', () => {

    let events;

    const emitter = (vehicle) => {
        var event = {
            distance: vehicle.distance,
            time: vehicle.time
        };
        // console.log('event', event);
        events.push(event);
    };

    beforeEach(() => {
        events = [];
    });

    describe('#constructor', () => {
        it('has even stretch lengths', () => {
            const road = new Road(completeRoadAttrs);
            assert.equal(2, road.stretchesLength);
        });
    });

    describe('#loadConfig', () => {
        it('loads config from file', () => {
            const config = Road.loadConfig('../src/data/bandeirantes');
            assert.equal(71.32534361053114, config.length);
            assert.equal(1000, config.stretches.length);
        });
    });

    describe('#change', () => {

        const stretches = [];
        for (let i = 0; i < 10; i++) {
            stretches.push({
                velocity: 100,
                lanes: 2
            });
        }

        it('change the road stretches', () => {
            const road = new Road({
                length: 100,
                stretches: stretches
            });


            road.change({
                from: 0.1,
                to: 0.3,
                lanes: 3,
                velocity: 120
            });

            assert.equal(road.stretches[0].lanes, 2);
            assert.equal(road.stretches[0].velocity, 100);
            assert.equal(road.stretches[1].lanes, 3);
            assert.equal(road.stretches[1].velocity, 120);
            assert.equal(road.stretches[2].lanes, 3);
            assert.equal(road.stretches[3].lanes, 2);
            0

        });

        it('can be reseted', () => {
            const road = new Road({
                length: 100,
                stretches: stretches
            });


            road.change({
                from: 0.1,
                to: 0.3,
                lanes: 3
            });

            assert.equal(road.stretches[0].lanes, 2);
            assert.equal(road.stretches[1].lanes, 3);
            assert.equal(road.stretches[1].velocity, 100);
            assert.equal(road.stretches[2].lanes, 3);
            assert.equal(road.stretches[3].lanes, 2);

            road.reset();

            assert.equal(road.stretches[0].lanes, 2);
            assert.equal(road.stretches[1].lanes, 2);
            assert.equal(road.stretches[2].lanes, 2);
            assert.equal(road.stretches[3].lanes, 2);
        });
    });

    describe('#moveVehicleFromTo', () => {

        let vehicle;

        beforeEach(() => {
            vehicle = new Vehicle({
                targetVelocity: 100,
                length: 3
            });
        });

        it('move vehicle across two stretches', () => {
            const road = new Road({
                length: 100,
                stretches: [{
                    velocity: 100,
                }, {
                    velocity: 50,
                }]
            });

            vehicle.distance = 40;
            road.moveVehicleTo(vehicle, 0.5);

            assert.approximately(vehicle.distance, 70, 0.0001);
        });

        it('move vehicle across four stretches', () => {
            const road = new Road({
                length: 100,
                stretches: [{
                    velocity: 100,
                }, {
                    velocity: 100,
                }, {
                    velocity: 100,
                }, {
                    velocity: 100,
                }]
            });

            vehicle.distance = 20;
            vehicle.stretchIndex = 0;
            road.moveVehicleTo(vehicle, 0.7);

            assert.approximately(vehicle.distance, 90, 0.0001);
            assert.equal(vehicle.stretchIndex, 3);
        });


        it('move vehicle across a stretch with traffic', () => {
            const road = new Road({
                length: 100,
                stretches: [{
                    velocity: 100,
                    lanes: 1,
                    traffic: 51
                }]
            });

            vehicle.distance = 10;
            road.moveVehicleTo(vehicle, 0.5);

            assert.equal(vehicle.distance, 45);
        });

        it('stops the vehicles at the border when the next stretch is full', () => {
            const road = new Road({
                length: 100,
                stretches: [{
                    velocity: 100,
                    lanes: 1,
                }, {
                    velocity: 100,
                    lanes: 1,
                    traffic: 50
                }]
            });

            vehicle.distance = 40;
            road.moveVehicleTo(vehicle, 0.5);

            assert.equal(vehicle.distance, 49.999);
        });

        it('stops the vehicles if the current and next stretch is full', () => {
            const road = new Road({
                length: 100,
                stretches: [{
                    velocity: 100,
                    lanes: 1,
                    traffic: 50
                }, {
                    velocity: 100,
                    lanes: 1,
                    traffic: 50
                }]
            });

            vehicle.distance = 40;
            road.moveVehicleTo(vehicle, 0.5);

            assert.equal(vehicle.distance, 40);
        });
    });

    describe('simulations', () => {

        it('simulates one vehicle with one stretch', (done) => {
            const road = new Road({
                length: 100,
                sleep: 1000 * 60 * 3,
                fastForward: 1000 * 60 * 3,
                stretches: [{
                    velocity: 100,
                    lanes: 1
                }]
            });

            const vehicle = new Vehicle({
                targetVelocity: 100,
                length: 3,
                emitter: emitter
            });

            road.addVehicle(vehicle);

            road.finish(() => {
                var lastIndex = events.length - 1;
                assert.isAbove(lastIndex, 0);
                assert.approximately(events[lastIndex].distance, 100, 0.0001);
                assert.isAtLeast(events[lastIndex].time, 1);
                done();
            });
        });

        it('simulates one vehicle with two stretches', (done) => {
            const road = new Road({
                length: 100,
                sleep: 1000 * 60 * 3,
                fastForward: 1000 * 60 * 3,
                stretches: [{
                    velocity: 100,
                    lanes: 1
                }, {
                    velocity: 50,
                    lanes: 1
                }]
            });

            const vehicle = new Vehicle({
                targetVelocity: 100,
                length: 3,
                emitter: emitter
            });

            road.addVehicle(vehicle);

            road.finish(() => {
                var lastIndex = events.length - 1;
                assert.isAbove(lastIndex, 0);
                assert.approximately(events[lastIndex].distance, 100, 0.0001);
                assert.isAtLeast(events[lastIndex].time, 1.5);
                done();
            });
        });

        it('simulates two vehicles with traffic', (done) => {
            const road = new Road({
                length: 100,
                sleep: 1000 * 60 * 3,
                fastForward: 1000 * 60 * 3,
                stretches: [{
                    velocity: 100,
                    lanes: 1
                }, {
                    velocity: 100,
                    lanes: 1
                }]
            });

            const vehicle1 = new Vehicle({
                targetVelocity: 100,
                length: 0,
                emitter: emitter
            });

            const vehicle2 = new Vehicle({
                targetVelocity: 50,
                length: 25500
            });

            road.addVehicle(vehicle1);
            road.addVehicle(vehicle2);

            road.finish(() => {
                var lastIndex = events.length - 1;
                assert.isAbove(lastIndex, 0);
                assert.approximately(events[lastIndex].distance, 100, 0.0001);
                assert.isAtLeast(events[lastIndex].time, 1.2);
                done();
            });
        });

    });
});