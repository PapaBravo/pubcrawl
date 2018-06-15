let map;
let userPos;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });
    getUserLocation()
        .then(pos => {
            userPos = pos;
            map.setCenter(pos);
        })
        .then(() => {
            getPubs();
        })
}

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
    service.nearbySearch(request, (results, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var place = results[i];
                console.info(place);
            }
        } else {
            console.warn('PlaceService Error', status, results);
        }
    });
}
