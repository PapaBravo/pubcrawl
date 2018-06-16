const fireBaseConfig = {
    apiKey: "AIzaSyBn2HRMBMxB2TNvY1rb_qqlkCFyCZeZ8no",
    authDomain: "pubcrawl-e482b.firebaseapp.com",
    databaseURL: "https://pubcrawl-e482b.firebaseio.com",
    projectId: "pubcrawl-e482b",
    storageBucket: "",
    messagingSenderId: "1011766290274"
};
firebase.initializeApp(fireBaseConfig);
const database = firebase.database();
let map;
let userPos;
let directionsDisplay;
let placeSearch;
let origin;
let geocoder;
let marker;
let markers = [];
let bounds;
let pubs;
let circles = [];
let circle;
let $star_rating = $('.star-rating .fa');

function init() {
    initPosition();
    initMap();
    initDirectionsRenderer();
    initAutocomplete();
    testFirebase();
}

function initMap() {
    center = { lat: -34.397, lng: 150.644 }
    map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 8,
        minZoom: 4,
        maxZoom: 15
    });
}

function initPosition() {
    getUserLocation()
        .then(pos => {
            userPos = pos;
            map.setCenter(pos);
            getLocationForCoordinates(pos).then(result => {
                document.getElementById('origin').value = result;
            });
            setMarker(pos, "Standort");
            clearCircle();
            setCircle(document.getElementById('radius').value);
            fitZoom();
    });
}

function initAutocomplete() {
    origin = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */(document.getElementById('origin')),
        { types: ['geocode'] })
}

function initDirectionsRenderer() {
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('right-panel')
    });
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

function setMarker(position, title) {
    markers.push(
        marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title
        })
    );
}

function setCircle(radius) {
    circles.push(
        circle = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: map,
            center: userPos,
            radius: radius / 2
            })
    );
}

function clearMarkers() {
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];
}

function clearCircle() {
    circles.forEach(function(circle) {
        circle.setMap(null);
    });
    circles = [];
}

function fitZoom() {
    bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }
    bounds.union(circle.getBounds());
    map.fitBounds(bounds);
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
    clearMarkers();
    fitZoom();
}

function geolocate(origin) {
    console.log(origin);
    getCoordinatesForLocation(origin).then(result => {
        userPos = result;
        clearMarkers();
        setMarker(result, "Standort");
        map.setCenter(result);
    });
}

function showRoute(params = {}) {
    const options = {};
    options.origin = params.origin || { lat: -34.397, lng: 150.644 };
    options.radius = params.radius || 1000;
    options.distance = params.distance || 1000;

    return getPubs(options)
        .then(result => pubs = result)
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
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            "address": origin
        }, function(results) {
            resolve(results[0].geometry.location);
        });
    });
}

function getLocationForCoordinates(coordinates) {
    return new Promise((resolve, reject) => {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            "latLng": coordinates
        }, function(results) {
            resolve(results[0].formatted_address);
        });
    });
}

var SetRatingStar = function() {
  return $star_rating.each(function() {
    if (parseInt($star_rating.siblings('input.rating-value').val()) >= parseInt($(this).data('rating'))) {
      return $(this).removeClass('fa-star-o').addClass('fa-star');
    } else {
      return $(this).removeClass('fa-star').addClass('fa-star-o');
    }
  });
};

$star_rating.on('click', function() {
  $star_rating.siblings('input.rating-value').val($(this).data('rating'));
  return SetRatingStar();
});

SetRatingStar();
$(document).ready(function() {

});

function updateSlider(slideAmount, slider) {
    var sliderDiv = document.getElementById(slider);
    sliderDiv.innerHTML = " " + slideAmount;

    if (slider == "radiusValue") {
        clearCircle();
        setCircle(slideAmount);
        fitZoom();
    }
}

