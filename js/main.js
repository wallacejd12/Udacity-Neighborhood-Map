"use strict"

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
var service;
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

// Array to store the Ajax request for each place on the map
var jcRequests = [];

/* Variable to store the error message for posting when the Yelp
*  AJAX request fails.
*/
var $errorMessage = $('.error');

// Generatre number for Yelp oauth_nonce variable
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
        id: YELP_IDS[i],
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
        timeout: 5000 /* Added this since fail does not work for
                       * for cross domain requests. This seem to
                       * be the best solution that I could find
                       */
    }

    // Make AJAX request
    var request = $.ajax(settings);

    /* Store request in an array to reference when creating
    * Map Markers and the list in view Model
    */
    jcRequests.push(request);

}//End setSettingsForEach

// Set settings and make AJAX request
for(var i = 0; i < PLACES_LENGTH; i++) {
    setSettingsForEach(i);
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
    service = new google.maps.places.PlacesService(map);

}// End initMap

// Call function to initiate Google Map
initMap();

/* Add an event listener to the Google Map so it recenters when
*   a user resizes the window
*/
google.maps.event.addDomListener(window, 'resize', function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
});

/* Function called below to add markers to the map, set infowindow
*  content and add markers to the markers array to be referenced
*  in the View Model
*/
function addMarker(location, title, rating, review, phone, url) {
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: title,
        rating: rating,
        review: review,
        phone: phone,
        url: url,
        animation: google.maps.Animation.DROP,
    });

    google.maps.event.addListener(marker, 'click', function() {
        var contentString = '<div id="content">' + '<strong>' + title + '</strong>' + ' ' + '<img src="' + rating + '">' + ' ' + '<a href="tel:' + phone + '" style="text-decoration: none;"> <font color="black">' + phone + '</font> </a> <br>' + review + '<br>' + '<a href="' + url + '" target="_blank">View on Yelp</a></div>';

        infowindow.setContent(contentString);
        infowindow.open(map, this);
    });
        markers.push(marker);
}// End addMarker

/*  Get ajax requests results and use those results to set the
*   properties for each marker
*/
$.each( jcRequests, function(i, l){
    l.success(function (results) {
        var place = results;
        var location = {lat: place.location.coordinate.latitude, lng: place.location.coordinate.longitude};
        var title = place.name;
        var rating = place.rating_img_url_small;
        var review = place.snippet_text;
        var phone = place.phone;
        var url = place.url;
        addMarker(location, title, rating, review, phone, url);
    });
});


/*** View Model ***/

function viewModel () {
    var self = this;
    self.query = ko.observable(""); //Observable for search term
    self.filteredItems = ko.observableArray(); //Observable array for storing filtered places
    self.placeMarkers = ko.observableArray(markers); //Observable array to store markers
    self.selectedItems = ko.observableArray(); //Observable array to store selected places
    self.items = ko.observableArray(); //Observable array to store all the places
    self.addItems = function () {
       $.each( jcRequests, function( i, l ){
        // Access AJAX results and add them to the items observable array
            l.success(function (results) {
                self.items.push(results);
            });
            // Post a message when the AJAX request fails for a place
            l.fail(function(x, t, m) {
                $errorMessage.append('Yelp Request failed for a Place of Interest <br> ');
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
                if(event.toElement.innerText === self.placeMarkers()[j].title) {
                    self.placeMarkers()[j].setAnimation(google.maps.Animation.DROP);
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

