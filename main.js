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

function init() {
    initMap();
    initAutocomplete();
    testFirebase();
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

// this gets called by maps load callback
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        // center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });
    getUserLocation()
        .then(pos => {
            userPos = pos;
            map.setCenter(pos);
            showRoute({ origin: pos, radius: 1000 });
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
function displayRoute({ route, options }) {
    var directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('right-panel')
    });
    directionsDisplay.setDirections(route);
}

var placeSearch, autocomplete

function initAutocomplete() {
    // Create the autocomplete object, restricting the search to geographical
    // location types.
    autocomplete = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
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
            autocomplete.setBounds(circle.getBounds())
        })
    }
}

function showRoute(params = {}) {
    const options = {};
    options.origin = params.origin || { lat: -34.397, lng: 150.644 };
    options.radius = params.radius || 1000;

    return getPubs(options)
        .then(getRoute)
        .then(displayRoute);
}

var $star_rating = $('.star-rating .fa');

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