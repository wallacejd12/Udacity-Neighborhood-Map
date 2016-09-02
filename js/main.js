/*global google */
/*global $ */
/*global ko */
/*global oauthSignature */

"use strict";


/* Sites Used
** http://stackoverflow.com/questions/16266772/google-maps-multiple-custom-markers
** http://jsfiddle.net/johnpapa/6FCEe/
** http://jsfiddle.net/mythical/XJEzc/
** http://jsfiddle.net/rniemeyer/vdcUA/
** http://jsfiddle.net/RASG/X5mhL/
** https://developers.google.com/maps/documentation/javascript/infowindows
**http://codepen.io/mikeair/pen/Kfyin
*/

// Global var to store Google Map data
var infowindow;
var map;

// Array to store Google Marker data
var markers = [];

// Global constants to store Yelp API Keys, Secrets, and Tokens
var YELP_BASE_URL = 'https://api.yelp.com/v2/';
var YELP_TOKEN = 'XHRjyQUTT3W8GaOp16HV3Gg3tm3aO27f';
var YELP_KEY = 'CoErkiVSMWM5gv65om-WCA';
var YELP_KEY_SECRET = 'mevqo0KKH1A-gIM-wJMDZ1CJiF0';
var YELP_TOKEN_SECRET = 'aGlNeSVh1fLs8A6I2Dwt9ou9240';
var YELP_IDS = ['madame-claude-cafe-jersey-city',
    'white-star-bar-jersey-city', 'the-hamilton-inn-jersey-city',
    'taqueria-downtown-jersey-city',
    'basic-food-and-beverage-jersey-city'];

// Global variable to store the number of places on the map
var PLACES_LENGTH = YELP_IDS.length;

// Array to store Yelp parameters for each place on the map
var storeParameters = [];
storeParameters.length = PLACES_LENGTH;

// Array to store the settings for each place on the map
var settingsForEach = [];

// Generate number for Yelp oauth_nonce variable
function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
}

/*  Function called below to set the Yelp parameters for each place
*   on the Map
*/
function setParametersForEach (i) {
    var parameters = {
        oauth_consumer_key: YELP_KEY,
        oauth_token: YELP_TOKEN,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now()/1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version : '1.0',
        callback: 'cb',
        id: YELP_IDS[i]
    };

    var yelp_url = YELP_BASE_URL + 'business/' + YELP_IDS[i];
    var encodedSignature = oauthSignature.generate('GET',yelp_url,
        parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
        parameters.oauth_signature = encodedSignature;

    storeParameters[i] = parameters;
}// End setParametersForEach


// Set the parameters for each place on the map
for (var i = 0; i < PLACES_LENGTH; i++) {
    setParametersForEach(i);
}

/* Function called below to set the Yelp settings and make the ajax
*  request for each place on the map
*/
function setSettingsForEach (i) {
    var yelp_url = YELP_BASE_URL + 'business/' + YELP_IDS[i];

    var settings = {
        url: yelp_url,
        type: "GET",
        data: storeParameters[i],
        async: true,
        cache: true,
        dataType: 'jsonp',
        timeout: 5000
    };

    /* Store settings in an array to reference when making
    * the AJAX request
    */
    settingsForEach.push(settings);

}//End setSettingsForEach

// Set settings for each place
for(var i = 0; i < PLACES_LENGTH; i++) {
    setSettingsForEach(i);
}

function googleError () {
    alert("Google Maps API Failed to Load.");
}
// Function to initiate the Google Map
function initMap() {
    //add map, the type of map
    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.724918, lng: -74.045963},
    zoom: 14,
    disableDefaultUI: true
    });

    infowindow = new google.maps.InfoWindow();

/* Add an event listener to the Google Map so it recenters when
*   a user resizes the window
*/
map.addListener(window, 'resize', function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
});

}// End initMap

/* Function called below to add markers to the map, set infowindow
*  content and add markers to the markers array to be referenced
*  in the View Model
*/
function addMarker(location, title, l) {
    var contentString, place, atitle, alocation, rating, review, phone, url;
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: title,
        animation: google.maps.Animation.DROP
    });

    marker.addListener('click', toggleBounce);

    function toggleBounce() {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null)
            }, 2000);
        }
    }

    marker.addListener('click', function() {

        var request = $.ajax(l);
        request.success(function(results) {
            place = results;
            atitle = place.name;
            alocation = {lat: place.location.coordinate.latitude, lng: place.location.coordinate.longitude};
            rating = place.rating_img_url_small;
            review = place.snippet_text;
            phone = place.phone;
            url = place.url;
            contentString = '<div id="content">' + '<strong>' + atitle + '</strong>' + ' ' + '<img src="' + rating + '">' + ' ' + '<a href="tel:' + phone + '" style="text-decoration: none;"> <font color="black">' + phone + '</font> </a> <br>' + review + '<br>' + '<a href="' + url + '" target="_blank">View on Yelp</a></div>';
            infowindow.setContent(contentString);
            infowindow.open(map, marker);
        });
        request.error(function() {
            infowindow.setContent("Yelp API Failed to Load.")
        });
    });

    markers.push(marker);
}// End addMarker

/*** View Model ***/

function viewModel () {
    var self = this;
    self.query = ko.observable(""); //Observable for search term
    self.filteredItems = ko.observableArray(); //Observable array for storing filtered places
    self.placeMarkers = ko.observableArray(markers); //Observable array to store markers
    self.selectedItems = ko.observableArray(); //Observable array to store selected places
    self.items = ko.observableArray(); //Observable array to store all the places
    self.message = ko.observable();
    self.addItems = function () {
       $.each( settingsForEach, function( i, l ){
            var request = $.ajax(l);
            request.success(function(results) {
                var place = results;
                var title = place.name;
                var location = {lat: place.location.coordinate.latitude, lng: place.location.coordinate.longitude};
                self.items.push(place);
                addMarker(location, title, l);
            });
            request.error(function() {
                self.message("Yelp API Failed to Load");
            });
        });
    };
    // Function which filters the items on the list and the map based on the search term
    self.search = function (value) {
        if (value === '') {
            for(var i = 0; i < PLACES_LENGTH; i++) {
                self.placeMarkers()[i].setVisible(true);
            }
            return;
        }
        $.each( self.items(), function( i, l ){
            if(l.name.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                self.placeMarkers()[i].setVisible(true);
            }
            else {
                self.placeMarkers()[i].setVisible(false);
            }
        });
    };
    // Function to open the infoWindow of the place selected from the list
    self.selectedInfoWindow = function (data, event) {
        for(var j = 0; j < PLACES_LENGTH; j++) {
            if(event.originalEvent.target.innerText === self.placeMarkers()[j].title) {
                google.maps.event.trigger(self.placeMarkers()[j], 'click');
            }
        }
    };
}// End viewModel

// Initiate the View Model
var hamiltonParkJC = new viewModel();

// Run the addItems function to add the AJAX results to the View Model
hamiltonParkJC.addItems();

// Function which filters the places on the list based on the search term
hamiltonParkJC.filteredItems = ko.dependentObservable(function() {
    var filter = hamiltonParkJC.query().toLowerCase();
    if (!filter) {
        return hamiltonParkJC.items();
    } else {
        return ko.utils.arrayFilter(hamiltonParkJC.items(), function(item) {
            return item.name.toLowerCase().indexOf(filter) >= 0;
        });
    }
}, viewModel);

// Subscribe to the View Model's search function to filter the map markers
hamiltonParkJC.query.subscribe(hamiltonParkJC.search);

ko.applyBindings(hamiltonParkJC);

