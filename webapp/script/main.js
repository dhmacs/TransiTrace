/**
 * @author Massimo De Marchi
 * @created 6/3/15.
 */

mapboxgl.accessToken = 'pk.eyJ1IjoibWFjczkxIiwiYSI6Ik9JM050anMifQ.F7_I4Vj2A3EyBEynwIcr0w';

function startMap(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    // let's show a map or do something interesting!
    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json', //stylesheet location
        center: [latitude, longitude], // starting position
        zoom: 13 // starting zoom
    });
}


navigator.geolocation.getCurrentPosition(startMap);