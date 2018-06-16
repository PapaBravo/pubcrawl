const fireBaseConfig = {
    apiKey: "AIzaSyBn2HRMBMxB2TNvY1rb_qqlkCFyCZeZ8no",
    authDomain: "pubcrawl-e482b.firebaseapp.com",
    databaseURL: "https://pubcrawl-e482b.firebaseio.com",
    projectId: "pubcrawl-e482b",
    storageBucket: "",
    messagingSenderId: "1011766290274"
};
const defaultPosition = {
    lat: 53.549531,
    lng: 9.964336
}
firebase.initializeApp(fireBaseConfig);

const database = firebase.database();
const crawlsRef = database.ref('crawls/');

let map;
let userPos;
let directionsDisplay;

function init() {
    initMap();
    initDirectionsRenderer();
    initAutocomplete();
    testFirebase();
    // loadCrawl();
}

function testFirebase(params) {

    // firebase.database().ref('/lastAccessed').once('value')
    //     .then(snapshot => console.info(snapshot && snapshot.val()));

    const data = new Date().toISOString();
    database.ref('/lastAccessed').set(data)
        .then(err => {
            if (err) console.error('Writing lastAccessed failed', err)
        });
}

function loadCrawl(crawlId) {
    // TODO use id
    let crawlRef = crawlsRef.limitToLast(1).once('value')
        .then(snapshot => {
            if (snapshot) {
                const lastCrawl = Object.values(snapshot.val())[0];
                displayRoute({route: lastCrawl, options: {}});
            }
        });
}

// this gets called by maps load callback
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: defaultPosition.lat, lng: defaultPosition.lng },
        zoom: 12
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
            resolve({ lat: defaultPosition.lat, lng: defaultPosition.lng });
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
        maxPrice: options.maxPrice,
        type: 'bar',
        openNow: true
    }

    service = new google.maps.places.PlacesService(map);

    return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                resolve({ pubs: results.slice(0, options.barCount - 1), options });
            } else {
                console.warn('PlaceService Error', status, results);
                reject();
            }
        });
    });
}

/**
 * 
 * @param {google.maps.DirectionsResult} directionsResult
 */
function getJSONDirectionResult(directionsResult) {
    const jsonResult = {
        geocoded_waypoints: directionsResult.geocoded_waypoints,
        routes: directionsResult.routes,
        request: {
            travelMode: directionsResult.request.travelMode
        }
    }
    jsonResult.routes[0].bounds = jsonResult.routes[0].bounds.toJSON();
    jsonResult.routes[0].legs = jsonResult.routes[0].legs.map(leg => {
        const jsonLeg = leg;
        jsonLeg.end_location = jsonLeg.end_location.toJSON();
        jsonLeg.start_location = jsonLeg.start_location.toJSON();
        jsonLeg.steps = jsonLeg.steps.map(step => {
            const jsonStep = step;
            jsonStep.end_location = jsonStep.end_location.toJSON();
            jsonStep.start_location = jsonStep.start_location.toJSON();
            jsonStep.start_point = jsonStep.start_point.toJSON();
            jsonStep.end_point = jsonStep.end_point.toJSON();
            jsonStep.path = jsonStep.path.map(loc => loc.toJSON());
            jsonStep.lat_lngs = jsonStep.lat_lngs.map(loc => loc.toJSON());
            return jsonStep;
        });        
        return jsonLeg;
    });
    jsonResult.routes[0].overview_path = jsonResult.routes[0].overview_path.map(loc => loc.toJSON());
    console.info(jsonResult)    
    return jsonResult;
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
        }, (result, status) => {
            if (status === 'OK') {
                resolve({ route: getJSONDirectionResult(result), options });
            } else {
                console.warn('Route error', status, result);
                reject();
            }
        });
    });
}

/**
 * 
 * @param {*} route 
 */
function displayRoute({ route, options }) {
    directionsDisplay.setDirections(route);
    return Promise.resolve({ route, options });
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
    options.origin = params.origin || { lat: defaultPosition.lat, lng: defaultPosition.lng };
    options.radius = params.radius || 1000;
    options.distance = params.distance || 1000;
    options.maxPrice = params.maxPrice || 3;
    options.barCount = params.barCount || 5;
    options.rating = params.rating || 4;

    return getPubs(options)
        .then(getRoute)
        .then(displayRoute)
        .then(saveCrawl);
}

function saveCrawl({ route, options }) {
    crawlsRef.push().set(route);
}

function showRouteButtonClicked() {
    var origin = document.getElementById("origin").value;
    var radius = document.getElementById("radius").value;
    var distance = document.getElementById("distance").value;
    var maxPrice = document.getElementById("price").value;
    var barCount = document.getElementById("bars").value;
    var rating = getStarRating();

    getCoordinatesForLocation(origin).then(result => {
        showRoute({
            origin: result,
            radius: radius,
            distance: distance,
            maxPrice: maxPrice,
            barCount: barCount,
            rating: rating
        });
    });
}

function getCoordinatesForLocation(origin) {
    return new Promise((resolve, reject) => {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            "address": origin
        }, function (results) {
            resolve(results[0].geometry.location);
        });
    });
}

var $star_rating = $('.star-rating .fa');

var SetRatingStar = function () {
    return $star_rating.each(function () {
        if (parseInt($star_rating.siblings('input.rating-value').val()) >= parseInt($(this).data('rating'))) {
            return $(this).removeClass('fa-star-o').addClass('fa-star');
        } else {
            return $(this).removeClass('fa-star').addClass('fa-star-o');
        }
    });
};

$star_rating.on('click', function () {
    $star_rating.siblings('input.rating-value').val($(this).data('rating'));
    return SetRatingStar();
});

SetRatingStar();
$(document).ready(function () {

});

function getStarRating() {
    return parseInt($star_rating.siblings('input.rating-value').val());
}

function updateSlider(slideAmount, slider) {
    var sliderDiv = document.getElementById(slider);
    sliderDiv.innerHTML = " " + slideAmount;
}

function showLocation(location) {
    getCoordinatesForLocation(location).then(result => {
        map.setCenter(result);
    });
}
