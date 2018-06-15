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
        })
        .then(getPubs)
        .then(getRoute)
        .then(displayRoute);
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
function getPubs() {
    const request = {
        query: '',
        fields: ['name', 'rating', 'opening_hours', 'formatted_address', 'geometry'],
        location: userPos,
        radius: 1000,
        type: 'bar',
        openNow: true
    }

    service = new google.maps.places.PlacesService(map);

    return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                resolve(results.slice(0, 5));
            } else {
                console.warn('PlaceService Error', status, results);
                reject();
            }
        });
    });
}

/**
 * 
 * @param {*} pubs
 * @returns Promise 
 */
function getRoute(pubs) {
    const waypoints = pubs.map(p => {
        return { stopover: true, location: p.geometry.location };
    });
    service = new google.maps.DirectionsService();
    return new Promise((resolve, reject) => {
        service.route({
            origin: userPos,
            destination: userPos,
            waypoints: waypoints,
            travelMode: 'WALKING',
            optimizeWaypoints: true
        }, (result, status) => {
            if (status === 'OK') {
                resolve(result);
            } else {
                console.warn('Route error', status, results);
                reject();
            }
        });
    });
}

/**
 * 
 * @param {*} route 
 */
function displayRoute(route) {
    const directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('right-panel')
    });
    directionsDisplay.setDirections(route);
}

var placeSearch, autocomplete

function initAutocomplete () {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
    {types: ['geocode']})
}

function geolocate () {
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
