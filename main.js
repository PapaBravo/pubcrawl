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
        });
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
