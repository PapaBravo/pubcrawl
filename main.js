let map;
let userPos;
let directionsDisplay;

function init() {
    initMap();
    initDirectionsRenderer();
    initAutocomplete();
}

// this gets called by maps load callback
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });
    // getUserLocation()
    //     .then(pos => {
    //         userPos = pos;
    //         map.setCenter(pos);
    //     });
}

function initDirectionsRenderer() {
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('right-panel')
    });
}

/**
 * @returns Promise
 */
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                resolve(pos);

            }, reject);
        } else {
            console.warn("Geolocation doesn't work", err)
            resolve({ lat: 53.30, lng: 10.0 });
        }
    });
}

/**
 * @returns Promise
 */
function getPubs(options) {
    const request = {
        query: '',
        fields: ['name', 'rating', 'opening_hours', 'formatted_address', 'geometry'],
        location: options.origin,
        radius: options.radius,
        type: 'bar',
        openNow: true
    }

    service = new google.maps.places.PlacesService(map);

    return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                resolve({ pubs: results.slice(0, 5), options });
            } else {
                console.warn('PlaceService Error', status, results);
                reject();
            }
        });
    });
}

/**
 * 
 * @param {*}
 * @returns Promise 
 */
function getRoute({ pubs, options }) {
    const waypoints = pubs.map(p => {
        return { stopover: true, location: p.geometry.location };
    });
    service = new google.maps.DirectionsService();
    return new Promise((resolve, reject) => {
        service.route({
            origin: options.origin,
            destination: options.origin,
            waypoints: waypoints,
            travelMode: 'WALKING',
            optimizeWaypoints: true
        }, (route, status) => {
            if (status === 'OK') {
                resolve({ route, options });
            } else {
                console.warn('Route error', status, route);
                reject();
            }
        });
    });
}

/**
 * 
 * @param {*} route 
 */
function displayRoute({route, options}) {
    directionsDisplay.setDirections(route);
}

var placeSearch, origin;

function initAutocomplete() {
    // Create the autocomplete object, restricting the search to geographical
    // location types.
    origin = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */(document.getElementById('origin')),
        { types: ['geocode'] })
}

function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            var circle = new google.maps.Circle({
                center: geolocation,
                radius: position.coords.accuracy
            })
            origin.setBounds(circle.getBounds())
        })
    }
}

function showRoute(params = {}) {
    const options = {};
    options.origin = params.origin || { lat: -34.397, lng: 150.644 };
    options.radius = params.radius || 1000;
    options.distance = params.distance || 1000;

    return getPubs(options)
        .then(getRoute)
        .then(displayRoute);
}

function showRouteButtonClicked() {
    var origin = document.getElementById("origin").value;
    var radius = document.getElementById("radius").value;
    var distance = document.getElementById("distance").value;

    getCoordinatesForLocation(origin).then(result => {
        showRoute({origin: result, radius: radius, distance: distance});
    });
}

function getCoordinatesForLocation(origin) {
    return new Promise((resolve, reject) => {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            "address": origin
        }, function(results) {
            resolve(results[0].geometry.location);
        });
    });
}

