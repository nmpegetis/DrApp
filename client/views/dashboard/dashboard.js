Markers = new Mongo.Collection('markers');
History = new Mongo.Collection('history');

Meteor.startup(function () {
    GoogleMaps.load({   //load API
        libraries: 'places',
        key: 'AIzaSyBgSrXb5DliuulrK4YkZzpFvGf8Qvy33eI'
    });
});

var bounds;

Template.map.helpers({
    mapOptions: function () {
        if (GoogleMaps.loaded()) {
            return {
                center: new google.maps.LatLng(35.1856, 33.3823), //Nicosia
                zoom: 10
            };
        }
    }
});

Template.modalHistory.helpers({
    showHistory: function () {
        return History.find();
    }
});

Template.registerHelper('formatDate', function (date) {
    return moment(date).format('MM-DD-YYYY');
});

Template.modalAvailableDoctors.helpers({
    aDoctors: function () {
        // Perform a reactive database query against minimongo
        return Markers.find({sent: "-1", surname: "Help"});
    }
});

Template.modalUnavailableDoctors.helpers({
    unaDoctors: function () {
        // Perform a reactive database query against minimongo
        return Markers.find({
            sent: "1",
            surname: "Help"
        });
    }
});


Template.modalUsers.helpers({
    users: function () {
        // Perform a reactive database query against minimongo
        return Markers.find({
            $or: [
                {request: "0"},
                {request: "1"}
            ]
        });
    }
});

function ButtonControl(controlDiv, map, title) {   //add a doctor
    var controlUI = document.createElement('div');

    if (title == 2)                                    //finish-doctor
        controlUI.style.backgroundColor = '#d9534f';
    else
        controlUI.style.backgroundColor = '#cbe6a3';    //add doctor-admin,start-doctor
    controlUI.style.border = 'rgb(102, 255, 102)';
    controlUI.style.marginRight = '20px';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginTop = '10px';
    controlUI.style.marginLeft = '20px';
    controlUI.style.textAlign = 'center';

    if (title == 0)
        controlUI.title = 'Add a doctor';
    else if (title == 1) {
        controlUI.title = 'Click to start';
        controlUI.style.width = '80px';
    }
    else {
        controlUI.title = 'Click to finish';
        controlUI.style.width = '80px';
    }

    controlDiv.appendChild(controlUI);

    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    if (title == 0)
        controlText.innerHTML = '+  Add a doctor';
    else if (title == 1)
        controlText.innerHTML = 'Start';
    else
        controlText.innerHTML = 'Finish';
    controlUI.appendChild(controlText);
}

function RightControl(controlDiv, map, title) {     //button request a doctor(0) / cancel request(1) / remove doctor(2)
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    if (title == 0) {
        controlUI.style.backgroundColor = '#cbe6a3';
        controlUI.style.border = 'rgb(102, 255, 102)';
    }
    else if (title == 1) {
        controlUI.style.backgroundColor = 'rgb(192, 192, 192)';
        controlUI.style.border = 'rgb(192, 192, 192)';
    }
    else {
        controlUI.style.backgroundColor = 'rgb(192, 192, 192)';
        controlUI.style.border = 'rgb(192, 192, 192)';
    }
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginTop = '10px';
    controlUI.style.marginLeft = '20px';
    controlUI.style.marginRight = '20px';
    controlUI.style.textAlign = 'center';
    controlUI.style.width = '155px';
    if (title == 0) {
        controlUI.title = 'Click to request for a doctor';
    }
    else if (title == 1) {
        controlUI.title = 'Click to cancel the request';
    }
    else {
        controlUI.title = 'Click to remove doctor';
    }
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    if (title == 0) {
        controlText.innerHTML = 'Request for doctor';
    }
    else if (title == 1) {
        controlText.innerHTML = 'Cancel request';
    }
    else {
        controlText.innerHTML = 'Remove doctor';
    }
    controlUI.appendChild(controlText);
}

function getDistance(user, doctor) {
    var R = 6378137; // Earth’s mean radius in meter
    var radUserLat = (user.lat * Math.PI) / 180;    // degrees to rad
    var radUserLng = (user.lng * Math.PI) / 180;    // degrees to rad
    var radVehLat = (doctor.lat * Math.PI) / 180;  // degrees to rad
    var radVehLng = (doctor.lng * Math.PI) / 180;  // degrees to rad
    var dLat = radUserLat - radVehLat;
    var dLng = radUserLng - radVehLng;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radUserLat) * Math.cos(radVehLat) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));   //the arctangent
    var d = R * c;
    return d;                                     // returns the distance in meter
}

function showInfo(infowindow, usrInfo, geocoder, openMarker, map) {
    var resultFormattedAddress;
    var latlng = {lat: usrInfo[0].lat, lng: usrInfo[0].lng};
    geocoder.geocode({'location': latlng}, function (results, status) {
        if (status === 'OK') {
            if (results[0]) {
                resultFormattedAddress = results[0].formatted_address;
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
        contentString = '<div id="content" style="width:220px; font-weight: bold; height:100px;">' +
            '<i>Name:</i> ' + usrInfo[0].name + '<br>' + '<br>' + '<i>Address:</i> ' +
            resultFormattedAddress + '</div>';
        infowindow.setContent(contentString);
        infowindow.open(map.instance, openMarker);
    });
}

Template.map.onCreated(function () {
    var self = this;
    var MAP_ZOOM = 10;
    var markers = {};
    var geocoder = new google.maps.Geocoder;
    var incrNum = 1;
    var infowindow = new google.maps.InfoWindow;
    var infowindow0 = new google.maps.InfoWindow;
    var infowindow1 = new google.maps.InfoWindow;
    /*
                GoogleMaps.ready('map', function (map) {
                    var markers = Markers.find({}).fetch();
                    bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < markers.length; i++) {
                        console.log(markers[i]);
                        bounds.extend({lat: markers[i].lat, lng: markers[i].lng});
                    }

                    //center the map to the geometric center of all markers
                    map.instance.setCenter(bounds.getCenter());

                    map.instance.fitBounds(bounds)

                    if (Meteor.user().roles == 'admin') {
                        //remove one zoom level to ensure no marker is on the edge.
                        map.instance.setZoom(map.instance.getZoom() - 1);

                        // set a minimum zoom
                        // if you got only 1 marker or all markers are on the same address map will be zoomed too much.
                        if (map.instance.getZoom() > 13) {
                            map.instance.setZoom(13);
                        }
                    }
                    else {
                    }
                });
     */
    GoogleMaps.ready('map', function (map) {

        if (Meteor.user().roles == 'admin') {
            var markerReq;
            var addButtonControlDiv = document.createElement('div');    //add a doctor
            addButtonControlDiv.index = 1;
            var addButtonControl = new ButtonControl(addButtonControlDiv, map, 0);
            map.instance.controls[7].push(addButtonControlDiv);

            var menubar = document.getElementById('menuBar');       //menu bar in admin
            map.instance.controls[4].push(menubar);

            var searchbox = document.getElementById('pac-input');   //searchbox in admin
            map.instance.controls[2].push(searchbox);
            /*** Modal Windows for History,Users,Available doctors,Unavailable doctors***/
            var history = document.getElementById('history');
            history.addEventListener('click', function () {
                Modal.show('modalHistory');
            });

            var users = document.getElementById('users');
            users.addEventListener('click', function () {
                Modal.show('modalUsers');
            });

            var adoctors = document.getElementById('aDoctors');
            adoctors.addEventListener('click', function () {
                Modal.show('modalAvailableDoctors');
            });

            var unadoctors = document.getElementById('unaDoctors');
            unadoctors.addEventListener('click', function () {
                Modal.show('modalUnavailableDoctors');
            });
            /*******************************************************/

            searchbox.addEventListener('keydown', function (event) {
                if (event.which == KeyCodes.ENTER) {
                    var searchNameCount = Markers.find({
                        name: searchbox.value,
                        friend: {$exists: true}
                    }).count();
                    if (searchNameCount != 0) {
                        var searchName = Markers.find({
                            name: searchbox.value
                        }).fetch();
                        var nameMarker = markers[searchName[0]._id];
                        if (searchName[0].friend == '-') {
                            showInfo(infowindow0, searchName, geocoder, nameMarker, map);
                        }
                        else {
                            var friendName = searchName[0].friend;
                            var usrName = Markers.find({
                                name: searchName[0].friend
                            }).fetch();
                            var usrMarker = markers[usrName[0]._id];
                            showInfo(infowindow0, searchName, geocoder, nameMarker, map);
                            showInfo(infowindow1, usrName, geocoder, usrMarker, map);
                        }
                    }
                    else {
                        var searchNameCount = Markers.find({    //user or none
                            name: searchbox.value
                        }).count();
                        if (searchNameCount == 0) {     //none
                            Bert.alert("Unknown name. Neither doctor nor user exists with this name.", 'danger', 'fixed-top', 'fa-frown-o');
                        }
                        else {                        //user
                            var usrMarker = Markers.find({
                                name: searchbox.value
                            }).fetch();
                            var searchMarker = markers[usrMarker[0]._id];
                            var marInfo = Markers.find({
                                friend: searchbox.value
                            }).fetch();
                            var friendMarker = markers[marInfo[0]._id];
                            showInfo(infowindow0, usrMarker, geocoder, searchMarker, map);
                            showInfo(infowindow1, marInfo, geocoder, friendMarker, map);
                        }
                    }
                }
            });
            self.autorun(function () {        //change marker color, red for unavailable/green for available
                var countVeh = Markers.find({
                    surname: "Help"
                }).count();
                var doctors = Markers.find({
                    surname: "Help"
                }).fetch();
                for (var i = 0; i < countVeh; i++) {
                    var mar = markers[doctors[i]._id];
                    if (doctors[i].sent == "1")
                        mar.setIcon('https://maps.google.com/mapfiles/ms/icons/red-dot.png');
                    else
                        mar.setIcon('https://maps.google.com/mapfiles/ms/icons/green-dot.png');
                }
            });
            self.autorun(function () {
                Meteor.subscribe('history');
            });

            self.autorun(function () {
                Meteor.subscribe('markers', Meteor.user().emails[0].address, Meteor.user()._id);   //own markers
                if (Markers.find({request: "1"}).count() != 0) {
                    markerReq = Markers.find({
                        request: "1"
                    }).fetch();
                    var openMarker = markers[markerReq[0]._id];
                    var contentString = '<div id="content" style="width:130px; font-weight: bold; height:20px;">' + markerReq[0].name + '</div>';
                    infowindow0.setContent(contentString);
                    infowindow0.close();
                    infowindow0.open(map.instance, openMarker);

                    var countVeh = Markers.find({
                        surname: "Help",
                        sent: "-1"
                    }).count();
                    if (countVeh == 0) {
                        openMarker.setAnimation(google.maps.Animation.BOUNCE);    //bounce if doctor not assigned to user's request
                    }
                    else if (countVeh != 0) {
                        if (openMarker.getAnimation() !== null) {
                            openMarker.setAnimation(null);                          //stop bouncing if doctor assigned to user's request
                        }
                        /********* Algorithm to find nearest available doctor *****************/
                        var doctors = Markers.find({       //available doctors
                            surname: "Help",
                            sent: "-1"
                        }).fetch();
                        var minDist;
                        var VehMinDist;
                        for (var i = 0; i < countVeh; i++) {
                            var dist = getDistance(markerReq[0], doctors[i]);
                            if (i == 0) {
                                minDist = dist;
                                VehMinDist = i;
                            }
                            else {
                                if (dist <= minDist) {
                                    minDist = dist;
                                    VehMinDist = i;
                                }
                            }
                        }
                        Markers.update(
                            {_id: doctors[VehMinDist]._id},
                            {$set: {sent: "1", friend: markerReq[0].name}}
                        );
                        if (doctors[VehMinDist]._id == "YJCyj5mKcpWJa3aPk") {
                            Markers.update(
                                {_id: markerReq[0]._id},
                                {$set: {sent: "1", request: "0", friend: "doctor1@gmail.com"}}
                            );
                        }
                        else {
                            Markers.update(
                                {_id: markerReq[0]._id},
                                {$set: {sent: "1", request: "0"}}
                            );
                        }
                        /*******************************************************/
                        History.insert({
                            history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" +
                            " " + doctors[VehMinDist].name + " was sent to help user: " + markerReq[0].name + "."
                        });
                    }
                }
            });
            self.autorun(function () {
                var bounceCount = Markers.find({name: "doctor@gmail.com", bounce: "1"}).count();
                if (bounceCount != 0) {
                    var bounceMarker = Markers.find({name: "doctor@gmail.com", bounce: "1"}).fetch();
                    var bounce = markers[bounceMarker[0]._id];
                    bounce.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function () {
                        bounce.setAnimation(null);
                    }, 1500);
                    Markers.update({_id: bounceMarker[0]._id}, {$unset: {bounce: ""}});
                }
            });
            addButtonControlDiv.addEventListener('click', function () {
                new Confirmation({
                    message: "Are you sure?",
                    title: "You are about to add a doctor. Tap anywhere!",
                    cancelText: "Cancel",
                    okText: "Add",
                    success: true, // whether the button should be green or red
                    focus: "cancel" // which button to autofocus, "cancel" (default) or "ok", or "none"
                }, function (ok) {
                    if (ok) {
                        google.maps.event.addListenerOnce(map.instance, 'click', function (event) {
                            var resultFormattedAddress;
                            var latlng = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                            geocoder.geocode({'location': latlng}, function (results, status) {
                                if (status === 'OK') {
                                    if (results[0]) {
                                        resultFormattedAddress = results[0].formatted_address;
                                    } else {
                                        window.alert('No results found');
                                    }
                                } else {
                                    window.alert('Geocoder failed due to: ' + status);
                                }
                                Markers.insert({
                                    name: "Doctor" + incrNum,
                                    surname: "Help",
                                    sent: "-1",
                                    lat: event.latLng.lat(),
                                    lng: event.latLng.lng(),
                                    friend: "-",
                                    date: new Date().toDateString(),
                                    time: new Date().toLocaleTimeString(),
                                    address: resultFormattedAddress
                                });
                                incrNum++;
                                var doctor = Markers.find({
                                    lat: event.latLng.lat(),
                                    lng: event.latLng.lng()
                                }).fetch();
                                History.insert({
                                    history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" +
                                    " Admin added a doctor: " + doctor[0].name + "."
                                });
                            });
                        });
                    }
                });
            });
            google.maps.event.addListener(map.instance, 'click', function () {
                infowindow0.close();
                infowindow1.close();
            });


            // console.log(Markers.find({_id: Meteor.user()._id}).fetch());
            console.log(Markers.find({}).fetch());
            var markers = Markers.find({}).fetch();
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < markers.length; i++) {
                console.log(i);
                console.log(markers[i]);
                // bounds.extend(markers[i].getPosition());
                bounds.extend(new google.maps.LatLng(markers[i].lat, markers[i].lng));
                // bounds.extend({lat: markers[i].lat, lng: markers[i].lng});
            }

//new
            //center the map to the geometric center of all markers
            map.instance.setCenter(bounds.getCenter());
            map.instance.fitBounds(bounds);


            // set a minimum zoom
            // if you got only 1 marker or all markers are on the same address map will be zoomed too much.
            if (map.instance.getZoom() > 13) {
                map.instance.setZoom(13);
            }
            else{
                //remove one zoom level to ensure no marker is on the edge.
                map.instance.setZoom(map.instance.getZoom() - 1);
            }
        }
//todo here starts user and doctor
        if (!!Meteor.user().roles === false) { //if not an admin
            self.autorun(function () {
                Meteor.subscribe('history');
            });
            var meteorUser = s.chop(Meteor.user().emails[0].address, 7);

            if (meteorUser[0] !== 'doctor') {      //simple user
                var marker; //marker for geolocation
                var requestControlDiv = document.createElement('div');    //request for a doctor
                requestControlDiv.index = 1;
                var rightControl = new RightControl(requestControlDiv, map, 0);

                var cancelControlDiv = document.createElement('div');   //cancel request
                cancelControlDiv.index = 1;
                var cancelControl = new RightControl(cancelControlDiv, map, 1);

                var removeControlDiv = document.createElement('div');   //remove doctor
                removeControlDiv.index = 1;
                var removeControl = new RightControl(removeControlDiv, map, 2);

                map.instance.controls[7].push(requestControlDiv);

                self.autorun(function (document) {
                    Meteor.subscribe('markers', Meteor.user().emails[0].address, Meteor.user()._id); //each user has dif friends
                    // if (Meteor.user().emails[0].address === 'user1@gmail.com') {
                        latLng = Geolocation.latLng();
                        var resultFormattedAddress;
                        geocoder.geocode({'location': latLng}, function (results, status) {
                            if (status === 'OK') {
                                if (results[0]) {
                                    resultFormattedAddress = results[0].formatted_address;
                                } else {
                                    window.alert('No results found');
                                }
                            } else {
                                // window.alert('Geocoder failed due to: ' + status);
                            }
                            if (!latLng)
                                return;
                            // If the marker doesn't yet exist, create it.
                            if (!marker) {
                                marker = new google.maps.Marker({
                                    position: new google.maps.LatLng(latLng.lat, latLng.lng),
                                    map: map.instance,
                                    icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                    id: document._id,
                                    title: 'Me'
                                });
                                Markers.update(
                                    {_id: Meteor.user()._id},
                                    {
                                        $set: {
                                            lat: latLng.lat,
                                            lng: latLng.lng,
                                            name: Meteor.user().emails[0].address,
                                            surname: "-",
                                            address: resultFormattedAddress
                                        }
                                    },
                                    {upsert: true}
                                );
                            }
                            // The marker already exists, so we'll just change its position.
                            else {
                                marker.setPosition(latLng);
                                Markers.update(
                                    {_id: Meteor.user()._id},
                                    {
                                        $set: {
                                            lat: latLng.lat,
                                            lng: latLng.lng,
                                            name: Meteor.user().emails[0].address,
                                            surname: "-",
                                            address: resultFormattedAddress
                                        }
                                    },
                                    {upsert: true});
                            }

                            // center according to user position and doctor that is heling him
                            var markers = Markers.find({}).fetch();
                            if(markers.length === 1){
                                 map.instance.setCenter({lat:latLng.lat, lng:latLng.lng});
                                 map.instance.setZoom(13);
                            }
                            else {
                                var bounds = new google.maps.LatLngBounds();
                                for (var i = 0; i < markers.length; i++) {
                                    bounds.extend({lat: markers[i].lat, lng: markers[i].lng});
                                }
                                //center the map to the geometric center of all markers
                                map.instance.setCenter(bounds.getCenter());
                                map.instance.fitBounds(bounds);

                                // set a maximum zoom
                                if (map.instance.getZoom() > 13) {
                                    map.instance.setZoom(13);
                                }
                                else{
                                    //remove one zoom level to ensure no marker is on the edge.
                                    map.instance.setZoom(map.instance.getZoom() - 1);
                                }
                            }
                        });
                    // }
                });
// TODO fixed user position - used with the above commented lines
                // if (Meteor.user().emails[0].address !== 'user1@gmail.com') {
                //     Markers.update(
                //         {_id: Meteor.user()._id},
                //         {
                //             $set: {
                //                 lat: 37.976817,
                //                 lng: 23.709823,
                //                 name: Meteor.user().emails[0].address,
                //                 surname: "-",
                //                 address: "Dekelewn 38,Athens 166 78,Greece"
                //             }
                //         },
                //         {upsert: true}
                //     );
                //     var marker = new google.maps.Marker({
                //         position: new google.maps.LatLng(37.929768, 23.747442),
                //         map: map.instance,
                //         icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                //         id: document._id,
                //         title: 'Me'
                //     });
                // }

                requestControlDiv.addEventListener('click', function () {    //Request for doctor --> Cancel request
                    new Confirmation({
                            message: "Are you sure you need help?",
                            title: "You are about to request for a doctor! The first available doctor will arrive to you soon",
                            cancelText: "Cancel",
                            okText: "Yes, I need help",
                            success: true,
                            focus: "cancel"
                        }, function (ok) {
                            if (ok) {
                                var reques = Markers.find({
                                    _id: Meteor.user()._id
                                }).fetch();
                                Markers.update(
                                    {_id: Meteor.user()._id},
                                    {
                                        $set: {
                                            request: "1",
                                            date: new Date().toDateString(),
                                            time: new Date().toLocaleTimeString()
                                        }
                                    }
                                );
                                History.insert({
                                    history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" +
                                    " User: " + reques[0].name + " requested a doctor."
                                });
                                map.instance.controls[7].pop(requestControlDiv);
                                map.instance.controls[7].push(cancelControlDiv);
                            }
                        }
                    );
                });

                cancelControlDiv.addEventListener('click', function () {   //Cancel request --> Request for doctor
                    new Confirmation({
                            message: "Are you sure you want to cancel the request?",
                            title: "You are about to cancel the request for help.",
                            cancelText: "No, don't cancel!",
                            okText: "Yes, cancel the request",
                            width: 100,
                            success: true, // whether the button should be green or red
                            focus: "cancel" // which button to autofocus, "cancel" (default) or "ok", or "none"
                        }, function (ok) {
                            if (ok) {
                                var reques = Markers.find({
                                    _id: Meteor.user()._id
                                }).fetch();
                                History.insert({
                                    history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" +
                                    " User: " + reques[0].name + " canceled the request."
                                });
                                Markers.update(
                                    {_id: Meteor.user()._id},
                                    {$set: {request: "0"}}
                                );
                                map.instance.controls[7].pop(cancelControlDiv);
                                map.instance.controls[7].push(requestControlDiv);
                            }
                        }
                    );
                });

                removeControlDiv.addEventListener('click', function () {  //Remove doctor --> Request for doctor
                    new Confirmation({
                            message: "Are you sure?",
                            title: "You are about to dismiss the doctor.",
                            cancelText: "Cancel",
                            okText: "Yes",
                            focus: "cancel" // which button to autofocus, "cancel" (default) or "ok", or "none"
                        }, function (ok) {
                            if (ok) {
                                var removeDoctor = Markers.find({
                                    sent: "1",
                                    request: {$exists: false}
                                }).fetch();
                                var reques = Markers.find({
                                    _id: Meteor.user()._id
                                }).fetch();
                                History.insert({
                                    history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "] " +
                                    "User: " + reques[0].name + " removed doctor: " + removeDoctor[0].name + "."
                                });
                                Markers.update(
                                    {_id: removeDoctor[0]._id},
                                    {$set: {sent: "-1"}}
                                );
                                Markers.update(
                                    {_id: removeDoctor[0]._id},
                                    {$set: {friend: "-"}}
                                );
                                Markers.update(
                                    {_id: Meteor.user()._id},
                                    {$set: {sent: "0"}}
                                );
                                if (removeDoctor[0]._id == "YJCyj5mKcpWJa3aPk") {
                                    Markers.update(
                                        {_id: Meteor.user()._id},
                                        {$unset: {friend: ""}}
                                    );
                                }
                            }
                        }
                    );
                });

                self.autorun(function () {
                    if (Markers.find({sent: "1", request: {$exists: false}}).count() != 0) {   //change cancel button to remove button
                        map.instance.controls[7].pop(cancelControlDiv);
                        map.instance.controls[7].push(removeControlDiv);
                    }
                });
                self.autorun(function () {
                    if (Markers.find({sent: "0"}).count() != 0) {                              //change remove button to request button
                        map.instance.controls[7].pop(removeControlDiv);
                        map.instance.controls[7].push(requestControlDiv);
                        Markers.update(
                            {_id: Meteor.user()._id},
                            {$unset: {sent: ""}}
                        );
                        Bert.alert({
                            title: 'We were happy to be of assistance!',
                            type: 'info',
                            style: 'growl-top-right'
                        });
                    }
                });
                self.autorun(function () {
                    if (Markers.find({request: "1"}).count() != 0) {    //change add button to cancel button after log in
                        map.instance.controls[7].pop(requestControlDiv);
                        map.instance.controls[7].push(cancelControlDiv);
                    }
                });
                self.autorun(function () {
                    if (Markers.find({surname: "Help", sent: "1"}).count() != 0) {   //change request button to remove button after log in
                        map.instance.controls[7].pop(requestControlDiv);
                        map.instance.controls[7].push(removeControlDiv);
                    }
                });
            }
            else {           //doctor user
                var startButtonControlDiv = document.createElement('div');    //start button
                startButtonControlDiv.index = 1;
                var startButtonControl = new ButtonControl(startButtonControlDiv, map, 1);
                map.instance.controls[7].push(startButtonControlDiv);

                var finishButtonControlDiv = document.createElement('div');    //finish button
                finishButtonControlDiv.index = 1;
                var finishButtonControl = new ButtonControl(finishButtonControlDiv, map, 2);

                startButtonControlDiv.addEventListener('click', function () {
                    var date = new Date().toDateString();
                    var time = new Date().toLocaleTimeString();
                    new Confirmation({
                        message: "Are you sure?",
                        title: "Welcome. You are about to be available for requests. Time: " + time,
                        cancelText: "Cancel",
                        okText: "Yes",
                        success: true,
                        focus: "cancel"
                    }, function (ok) {
                        if (ok) {
                            Markers.update({_id: Meteor.user()._id}, {
                                $set: {
                                    sent: "-1",
                                    date: date,
                                    time: time,
                                    bounce: "1"
                                }
                            });
                            History.insert({
                                history: "[" + date + "," + time + "]" + " Doctor@gmail.com loged in."
                            });
                        }
                    });
                });
                finishButtonControlDiv.addEventListener('click', function () {
                    new Confirmation({
                        message: "Are you sure?",
                        title: "You are about to leave.",
                        cancelText: "Cancel",
                        okText: "Yes",
                        success: true,
                        focus: "cancel"
                    }, function (ok) {
                        if (ok) {
                            map.instance.controls[7].pop(finishButtonControlDiv);
                            map.instance.controls[7].push(startButtonControlDiv);
                            Markers.update({_id: Meteor.user()._id}, {
                                $set: {
                                    sent: "0",
                                    date: new Date().toDateString(),
                                    time: new Date().toLocaleTimeString()
                                }
                            });
                            History.insert({
                                history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" + " Doctor@gmail.com loged out."
                            });
                            Markers.update({_id: Meteor.user().id}, {$unset: {bounce: ""}});
                        }
                    });
                });
                self.autorun(function () {
                    var markersCount = Markers.find().count();
                    if (markersCount != 0) {
                        var markers = Markers.find({_id: Meteor.user()._id}).fetch();
                        if (markers[0].sent == "1" || markers[0].sent == "-1") {
                            map.instance.controls[7].pop(startButtonControlDiv);
                            map.instance.controls[7].push(finishButtonControlDiv);
                        }
                    }
                });
                self.autorun(function (document) {
                    Meteor.subscribe('markers', Meteor.user().emails[0].address, Meteor.user()._id);
                    var markerCount = Markers.find({_id: Meteor.user()._id}).count();
                    if (markerCount != 0) {
                        markerVeh = Markers.find({_id: Meteor.user()._id}).fetch();
                        var mar = markers[markerVeh[0]._id];
                        console.log(mar);
                        if (markerVeh[0].sent == "1")
                            mar.setIcon('https://maps.google.com/mapfiles/ms/icons/red-dot.png');
                        else
                            mar.setIcon('https://maps.google.com/mapfiles/ms/icons/green-dot.png');
                        if (markerVeh[0].sent == "-1" || markerVeh[0].sent == "1") {
                            map.instance.controls[7].pop(startButtonControlDiv);
                            map.instance.controls[7].push(finishButtonControlDiv);
                        }

                    }
                    else {
                        var name = s.chop(Meteor.user().emails[0].address, 8);
                        Markers.insert(
                            {
                                _id: Meteor.user()._id, name: name[0], surname: "Help", sent: "0",
                                friend: "-",
                                lat: "38.014193",
                                lng: "23.784076"
                            });
                    }
                });
            }
        }

        Markers.find({request: {$exists: true}, _id: {$ne: Meteor.user()._id}}).observe({   //user's request in admin panel
            added: function (doc) {
                var marker = new google.maps.Marker({
                    draggable: false,
                    animation: google.maps.Animation.DROP,
                    position: new google.maps.LatLng(doc.lat, doc.lng),
                    map: map.instance,
                    icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    id: doc._id
                });
                google.maps.event.addListener(marker, 'mouseover', function () {
                    var markerInfo = Markers.find({
                        _id: marker.id
                    }).fetch();
                    marker.setTitle(markerInfo[0].name);
                });
                google.maps.event.addListener(map.instance, 'click', function () {
                    infowindow.close();
                });
                google.maps.event.addListener(marker, 'click', function (event) {
                    var resultFormattedAddress;
                    var markerInfo = Markers.find({
                        _id: marker.id
                    }).fetch();
                    var latlng = {lat: markerInfo[0].lat, lng: markerInfo[0].lng};
                    geocoder.geocode({'location': latlng}, function (results, status) {
                        if (status === 'OK') {
                            if (results[0]) {
                                resultFormattedAddress = results[0].formatted_address;
                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                        if (Meteor.user().roles == 'admin') {
                            contentString = '<div id="content" style="width:220px; font-weight: bold; height:120px;">' +
                                '<i>Name</i>: ' + markerInfo[0].name + '<br>' + '<br>' + '<i>Address</i>: ' +
                                resultFormattedAddress + '<br>' + '<br>' + '<button id="btn1" type="button" class="btn btn-danger btn-sm">Delete</button>' +
                                '</div>';
                        }
                        else {
                            contentString = '<div id="content" style="width:220px; font-weight: bold; height:120px;">' +
                                '<i>Name</i>: ' + markerInfo[0].name + '<br>' + '<br>' + '<i>Address</i>: ' +
                                resultFormattedAddress + '</div>';
                        }
                        infowindow.setContent(contentString);
                        infowindow.close();
                        infowindow.open(map.instance, marker);

                        var delBtn1 = document.getElementById('btn1');
                        if (delBtn1) {
                            delBtn1.addEventListener('click', function () {
                                new Confirmation({
                                        message: "Are you sure?",
                                        title: "You are about to remove a user and make a doctor available",
                                        cancelText: "Cancel",
                                        okText: "Yes",
                                        success: true, // whether the button should be green or red
                                        focus: "cancel" // which button to autofocus, "cancel" (default) or "ok", or "none"
                                    }, function (ok) {
                                        if (ok) {
                                            var doctorMar = Markers.find({
                                                friend: markerInfo[0].name,
                                                surname: "Help"
                                            }).fetch();
                                            var vehAvail = markers[doctorMar[0]._id];
                                            History.insert({
                                                history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" + " Admin removed user: " + markerInfo[0].name + " and " + doctorMar[0].name +
                                                " was freed" + "."
                                            });
                                            Markers.update(
                                                {_id: doctorMar[0]._id},
                                                {$set: {sent: "-1"}}
                                            );
                                            Markers.update(
                                                {_id: doctorMar[0]._id},
                                                {$set: {friend: "-"}}
                                            );
                                            Markers.update(
                                                {_id: markerInfo[0]._id},
                                                {$set: {sent: "0"}}
                                            );
                                            if (doctorMar[0]._id == "YJCyj5mKcpWJa3aPk") {
                                                Markers.update(
                                                    {_id: markerInfo[0]._id},
                                                    {$unset: {friend: ""}}
                                                );
                                            }
                                        }
                                    }
                                );
                            });
                        }
                    });
                });
                markers[doc._id] = marker;

            },
            removed: function (oldDocument) {
                // Remove the marker from the map
                markers[oldDocument._id].setMap(null);

                // Clear the event listener
                google.maps.event.clearInstanceListeners(markers[oldDocument._id]);

                // Remove the reference to this marker instance
                delete markers[oldDocument._id];
            }
        });
        Markers.find({sent: {$exists: true}, request: {$exists: false}, _id: Meteor.user()._id}).observe({
            added: function (doc) {
                var marker = new google.maps.Marker({
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    position: new google.maps.LatLng(doc.lat, doc.lng),
                    map: map.instance,
                    icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    id: doc._id
                });
                //markers[doc._id].remove;
                markers[doc._id] = marker;
                console.log(markers);
                google.maps.event.addListener(marker, 'dragend', function (event) {
                    var resultFormattedAddress;
                    var latlng = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                    geocoder.geocode({'location': latlng}, function (results, status) {
                        if (status === 'OK') {
                            if (results[0]) {
                                resultFormattedAddress = results[0].formatted_address;
                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                        Markers.update(
                            marker.id,
                            {
                                $set: {
                                    lat: event.latLng.lat(),
                                    lng: event.latLng.lng(),
                                    address: resultFormattedAddress
                                }
                            }
                        );
                    });
                });
                google.maps.event.addListener(map.instance, 'click', function () {
                    infowindow.close();
                });
                google.maps.event.addListener(marker, 'click', function (event) {
                    var resultFormattedAddress;
                    var latlng = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                    geocoder.geocode({'location': latlng}, function (results, status) {
                        if (status === 'OK') {
                            if (results[0]) {
                                resultFormattedAddress = results[0].formatted_address;
                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                        markerInfo = Markers.find({_id: marker.id}).fetch();
                        if (markerInfo[0].sent == "1") {
                            contentString = '<div id="content" style="width:230px; font-weight: bold; height:150px;">' +
                                '<i>Name:</i> ' + markerInfo[0].name + ' to ' + markerInfo[0].friend + '<br>' + '<br>'
                                + '<i>Address:</i> ' + resultFormattedAddress + '<br>' + '<br>' + '<button id="btn2" type="button" class="btn btn-primary btn-sm">End Task</button>' +
                                '</div>';
                        }
                        else {
                            contentString = '<div id="content" style="width:220px; font-weight: bold; height:120px;">' +
                                '<i>Name:</i> ' + markerInfo[0].name + ' to ' + markerInfo[0].friend + '<br>' + '<br>'
                                + '<i>Address:</i> ' + resultFormattedAddress +
                                '</div>';
                        }
                        infowindow.setContent(contentString);
                        infowindow.close();
                        infowindow.open(map.instance, marker);

                        var endTask = document.getElementById('btn2');
                        if (endTask) {
                            endTask.addEventListener('click', function () {
                                new Confirmation({
                                    message: "Are you sure?",
                                    title: "You are about to be available for the next task.",
                                    cancelText: "Cancel",
                                    okText: "Yes",
                                    success: true, // whether the button should be green or red
                                    focus: "cancel" // which button to autofocus, "cancel" (default) or "ok", or "none"
                                }, function (ok) {
                                    if (ok) {
                                        var userVeh = Markers.find({name: markerInfo[0].friend}).fetch();
                                        History.insert({
                                            history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "] Doctor@gmail.com completed a task. It served " + markerInfo[0].friend + "."
                                        });
                                        Markers.update(
                                            {_id: userVeh[0]._id},
                                            {$set: {sent: "0"}}
                                        );
                                        Markers.update(
                                            {_id: userVeh[0]._id},
                                            {$unset: {friend: ""}}
                                        );
                                        Markers.update(
                                            {_id: markerInfo[0]._id},
                                            {$set: {sent: "-1", friend: "-"}}
                                        );
                                        infowindow.close();
                                    }
                                });
                            });
                        }
                    });
                });
            },
            changed: function (newDocument, oldDocument) {
                markers[newDocument._id].setPosition({lat: newDocument.lat, lng: newDocument.lng});
            },
            removed: function (oldDocument) {
                // Remove the marker from the map
                markers[oldDocument._id].setMap(null);

                // Clear the event listener
                google.maps.event.clearInstanceListeners(markers[oldDocument._id]);

                // Remove the reference to this marker instance
                delete markers[oldDocument._id];
            }
        });

        Markers.find({sent: {$exists: true}, request: {$exists: false}, _id: {$ne: Meteor.user()._id}}).observe({   //doctors
            added: function (doc) {
                if (Meteor.user().roles == 'admin') {
                    var marker = new google.maps.Marker({
                        draggable: true,
                        animation: google.maps.Animation.DROP,
                        position: new google.maps.LatLng(doc.lat, doc.lng),
                        map: map.instance,
                        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        id: doc._id
                    });
                }
                else {
                    var marker = new google.maps.Marker({
                        draggable: false,
                        animation: google.maps.Animation.DROP,
                        position: new google.maps.LatLng(doc.lat, doc.lng),
                        map: map.instance,
                        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        id: doc._id
                    });
                }


                google.maps.event.addListener(marker, 'mouseover', function () {
                    var markerInfo = Markers.find({
                        _id: marker.id
                    }).fetch();
                    marker.setTitle(markerInfo[0].friend);
                });
                google.maps.event.addListener(map.instance, 'click', function () {
                    infowindow.close();
                });
                google.maps.event.addListener(marker, 'click', function (event) {
                    var resultFormattedAddress;
                    var markerInfo = Markers.find({
                            _id: marker.id
                        }
                    ).fetch();
                    var latlng = {lat: markerInfo[0].lat, lng: markerInfo[0].lng};
                    geocoder.geocode({'location': latlng}, function (results, status) {
                        if (status === 'OK') {
                            if (results[0]) {
                                resultFormattedAddress = results[0].formatted_address;
                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                        if (Meteor.user().roles == 'admin') {
                            contentString = '<div id="content" style="width:220px; font-weight: bold; height:150px;">' +
                                '<i>Name:</i> ' + markerInfo[0].name + ' to ' + markerInfo[0].friend + '<br>' + '<br>'
                                + '<i>Address:</i> ' + resultFormattedAddress + '<br>' + '<br>' + '<button id="btn" type="button" class="btn btn-danger btn-sm">Delete</button>' +
                                '</div>';
                        }
                        else {
                            contentString = '<div id="content" style="width:200px; font-weight: bold; height:100px;">' +
                                '<i>Name:</i> ' + markerInfo[0].name + '<br>' + '<br>'
                                + '<i>Address:</i> ' + resultFormattedAddress +
                                '</div>';
                        }
                        infowindow.setContent(contentString);
                        infowindow.close();
                        infowindow.open(map.instance, marker);

                        var delBtn = document.getElementById('btn');
                        if (delBtn) {
                            delBtn.addEventListener('click', function () {
                                if (markerInfo[0].friend != '-') {
                                    Bert.alert("You can not remove this doctor because he is helping " + markerInfo[0].friend + ".", 'danger', 'fixed-top', 'fa-frown-o');
                                }
                                else {
                                    new Confirmation({
                                            message: "Are you sure?",
                                            title: "You are about to remove a doctor",
                                            cancelText: "Cancel",
                                            okText: "Remove",
                                            success: true, // whether the button should be green or red
                                            focus: "cancel" // which button to autofocus, "cancel" (default) or "ok", or "none"
                                        }, function (ok) {
                                            if (ok) {
                                                var meteorUser = s.chop(markerInfo[0].name, 7);
                                                if (meteorUser[0] !== 'doctor') {
                                                    History.insert({
                                                        history: "[" + new Date().toDateString() + "," + new Date().toLocaleTimeString() + "]" +
                                                        " Admin removed: " + markerInfo[0].name + "."
                                                    });
                                                    Markers.remove(markerInfo[0]._id);
                                                    if (incrNum != 0) {
                                                        incrNum--;
                                                    }
                                                }
                                                else {
                                                    Markers.update(
                                                        {_id: markerInfo[0]._id},
                                                        {
                                                            $set:
                                                                {sent: "0"}
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    });
                });
                markers[doc._id] = marker;
                if (Meteor.user().roles == 'admin') {
                    google.maps.event.addListener(marker, 'dragend', function (event) {
                        var resultFormattedAddress;
                        var latlng = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                        geocoder.geocode({'location': latlng}, function (results, status) {
                            if (status === 'OK') {
                                if (results[0]) {
                                    resultFormattedAddress = results[0].formatted_address;
                                } else {
                                    window.alert('No results found');
                                }
                            } else {
                                window.alert('Geocoder failed due to: ' + status);
                            }
                            Markers.update(
                                marker.id,
                                {
                                    $set: {
                                        lat: event.latLng.lat(),
                                        lng: event.latLng.lng(),
                                        address: resultFormattedAddress
                                    }
                                }
                            );
                        });
                    });
                }
            },
            changed: function (newDocument, oldDocument) {
                markers[newDocument._id].setPosition({lat: newDocument.lat, lng: newDocument.lng});
            },
            removed: function (oldDocument) {
                // Remove the marker from the map
                markers[oldDocument._id].setMap(null);

                // Clear the event listener
                google.maps.event.clearInstanceListeners(markers[oldDocument._id]);

                // Remove the reference to this marker instance
                delete markers[oldDocument._id];
            }
        });
        /*
    Markers.find().observe({  //friends  {request:{ $exists: false },sent:{ $exists: false},_id: { $ne: Meteor.user()._id }}
      added: function (document) {
        var marker = new google.maps.Marker({
          draggable: false,
          animation: google.maps.Animation.DROP,
          position: new google.maps.LatLng(document.lat, document.lng),
          map: map.instance,
          id: document._id
        });
        google.maps.event.addListener(marker, 'click', function (event) {
          var resultFormattedAddress;
          var markerInfo = Markers.find({_id: marker.id}).fetch();
          var latlng = {lat: markerInfo[0].lat, lng: markerInfo[0].lng};
          geocoder.geocode({'location': latlng}, function (results, status) {
            if (status === 'OK') {
              if (results[0]) {
                resultFormattedAddress = results[0].formatted_address;
              } else {
                window.alert('No results found');
              }
            } else {
              window.alert('Geocoder failed due to: ' + status);
            }
            contentString = '<div id="content" style="width:150px; height:100px;">' +
                'Name:' + markerInfo[0].name + '<br>' + 'Surname:' + markerInfo[0].surname + '<br>' + 'Address:' + resultFormattedAddress +
                '</div>';
            infowindow.setContent(contentString);
            infowindow.close();
            infowindow.open(map.instance, marker);
          });
        });
        markers[document._id] = marker;
      },
      removed: function (oldDocument) {
        // Remove the marker from the map
        markers[oldDocument._id].setMap(null);

        // Clear the event listener
        google.maps.event.clearInstanceListeners(markers[oldDocument._id]);

        // Remove the reference to this marker instance
        delete markers[oldDocument._id];
      }
    });*/
    });
});