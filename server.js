/**
 * @author Massimo De Marchi
 * @created 5/12/15.
 */
var express = require('express');
var app = express();

var csv = require("fast-csv");
var request = require('request');
var unzip = require("unzip");

var d3 = require("d3");


app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});


app.get('/api/stops/:lat/:lon/:radius', function(req,res){

    //var lat = parseFloat(req.params.lat);
    //var lon = parseFloat(req.params.lon);
    //
    //var radius = parseFloat(req.params.radius);

    var geoCircle = {
        lat: parseFloat(req.params.lat),
        lon: parseFloat(req.params.lon),
        radius: parseFloat(req.params.radius)
    };

    //console.log(geoCircle);
    //console.log("\n\n");

    //var stopQuadtree = app.locals.stops;
    //
    //var stopsInVicinity = [];
    //
    ////console.log(stopQuadtree);
    //
    //stopQuadtree.visit(function(node, x1, y1, x2, y2) {
    //    //console.log(x1 + " " + y1 + " " + x2 + " " + y2);
    //    var geoRectangle = {
    //        lon: (x1 + x2) /2,
    //        lat: (y1 + y2) / 2,
    //        width: Math.abs(x1 - x2),
    //        height: Math.abs(y1 - y2)
    //    };
    //
    //
    //    if(geoRectCircleColliding(geoCircle, geoRectangle)) {
    //        var station = node.point;
    //        if(station != null && pointInCircle({lat: parseFloat(station["stop_lat"]), lon: parseFloat(station["stop_lon"])}, geoCircle)) {
    //            stopsInVicinity.push(station);
    //        }
    //        console.log("FALSE\n");
    //        return false;
    //    }
    //    console.log("TRUE\n");
    //    return true;
    //});

    res.send(getStopsInVicinity(geoCircle.lat, geoCircle.lon, geoCircle.radius));
});


function getStopsInVicinity(lat, lon, radius) {
    var stopQuadtree = app.locals.stops;

    var stopsInVicinity = [];

    var geoCircle = {
        lat: lat,
        lon: lon,
        radius: radius
    };


    stopQuadtree.visit(function(node, x1, y1, x2, y2) {
        //console.log(x1 + " " + y1 + " " + x2 + " " + y2);
        var geoRectangle = {
            lon: (x1 + x2) /2,
            lat: (y1 + y2) / 2,
            width: Math.abs(x1 - x2),
            height: Math.abs(y1 - y2)
        };


        if(geoRectCircleColliding(geoCircle, geoRectangle)) {
            var station = node.point;
            if(station != null && pointInCircle({lat: parseFloat(station["stop_lat"]), lon: parseFloat(station["stop_lon"])}, geoCircle)) {
                stopsInVicinity.push(station);
            }
            return false;
        }
        return true;
    });

    return stopsInVicinity;
}

/**
 *
 * @param geoCircle @{lat: lat, lon:lon, radius: meters}
 * @param geoRect @{lat: lat, lon:lon, width: ∆Lon, height: ∆Lat}
 */
function geoRectCircleColliding(geoCircle, geoRect) {
    var radiusInDegree = geoCircle.radius / 111111.1; // Approximation (Not accurate near poles)


    var distanceCenters = {
        deltaLat: Math.abs(geoCircle.lat - geoRect.lat),
        deltaLon: Math.abs(geoCircle.lon - geoRect.lon)
    };

    if(distanceCenters.deltaLon > (geoRect.width / 2 + radiusInDegree) ||
        distanceCenters.deltaLat > (geoRect.height / 2 + radiusInDegree)) {
        return false;
    }

    if(distanceCenters.deltaLon <= (geoRect.width / 2 + radiusInDegree) ||
        distanceCenters.deltaLat <= (geoRect.height / 2 + radiusInDegree)) {
        return true;
    }

    return true;
}

/**
 *
 * @param point @{lat: lat, lon: lon}
 * @param circle @{lat: lat, lon: lon, radius: meters}
 */
function pointInCircle(point, circle) {
    var distance = Math.sqrt(Math.pow(latitudeDistance(point, circle), 2) + Math.pow(longitudeDistance(point, circle), 2));
    return distance < circle.radius;
}


/*
 * @locationA {lat, lon}
 * @locationB {lat, lon}
 */
//var distance = function(locationA, locationB) {
//    var delta = {
//        lat: Math.abs(locationA.lat - locationB.lat),
//        lon: Math.abs(locationA.lon - locationB.lon)
//    };
//
//    delta.x = (delta.lat * 40008000) / 360;
//    delta.y = (delta.lon * 40075160 * Math.cos(locationA.lat) / 360);
//
//    return Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));
//};

function longitudeDistance(a, b) {
    var dLon = Math.abs(a.lon - b.lon);
    var avgLat = (a.lat + b.lat) / 2;
    return (dLon * 40075160 * Math.abs(Math.cos((avgLat * Math.PI) / 180)) / 360);
}

function latitudeDistance(a, b) {
    var dLat = Math.abs(a.lat - b.lat);
    return (dLat * 40008000) / 360;
}


app.listen(3000);

var requestData = function() {

    //request('http://amat-mi.it/it/downloads/data/gtfs/current/Export_OpenDataTPL_Current.zip')
    //    .pipe(unzip.Extract({ path: 'dataset/' }))
    //    .on("finish", function() {
    //        console.log("Downloaded!");
    //        loadData();
    //    });
    loadData();

} ();


function loadData() {
    loadStops();
}

function loadStops() {
    var quad = d3.geom.quadtree();
    quad.x(function(d) {
        return parseFloat(d["stop_lon"]);
    });
    quad.y(function(d) {
        return parseFloat(d["stop_lat"]);
    });

    quad.extent([[-180, -90], [180, 90]]);


    app.locals.stops = quad([]);
    var stopQuadtree = app.locals.stops;

    csv
        .fromPath("dataset/stops.txt", {headers: true})
        .on("data", function(row){
            stopQuadtree.add(row);
        })
        .on("end", function(){
            console.log("done stops.csv");
        });
}



