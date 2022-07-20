const userPosition = document.getElementById("userPosition");
const warehouses = document.getElementById("warehouses");
const sbmButton = document.getElementById("submit");
const cityName = document.getElementById("cityName");

sbmButton.onclick = () => {
    localStorage.setItem("cityName", cityName.value);
    localStorage.setItem("search", "true");
    showPosition(JSON.parse(localStorage.getItem("location")));
}

function getLocation() {
    if ("location" in localStorage) { //if user data is in cookie
        showPosition(JSON.parse(localStorage.getItem("location")));
    } else if (navigator.geolocation) { //if user is newbie
        navigator.geolocation.getCurrentPosition(showPosition);
    } else { //if user don't give permission
        userPosition.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    let center = {lat: latitude, lng: longitude};

    saveUserPosition(latitude, longitude);

    latLngToAddress(latitude, longitude);

    connectToNpAPI(latitude, longitude, center);
}

function saveUserPosition(latitude, longitude) {
    const location = JSON.stringify({
        coords: {
            latitude: latitude,
            longitude: longitude
        }
    });

    //save user position to localStorage
    if (!("location" in localStorage) || localStorage.getItem("location") !== location) {
        localStorage.setItem("location", location);
    }
}

function latLngToAddress(latitude, longitude) {
    const latlng = new google.maps.LatLng(latitude, longitude);
    const geocoder = new google.maps.Geocoder();

    //transform coords to address
    geocoder.geocode({'latLng': latlng}, (results, status) => {
        if (status == google.maps.GeocoderStatus.OK) {
            userPosition.innerHTML = "Ви знаходитесь: " + results[6].formatted_address;
            localStorage.setItem("cityName", results[6].formatted_address.split(", ")[0]);
        }
    });
}

function connectToNpAPI(latitude, longitude, center) {
    fetch("https://api.novaposhta.ua/v2.0/json/", { //make request to NP
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            "apiKey": "npUserAPI", //user API (removed now)
            "modelName": "Address",
            "calledMethod": "getWarehouses",
            "methodProperties": {
                "CityName": localStorage.getItem("cityName"),
                "Page": "1",
                "Limit": "50",
                "Language": "UA"
            }
        })
    })
        .then(res => res.json())//receive JSON answer
        .then(data => {
            showWarehouses(data.data, center, latitude, longitude);
        });
}

function showWarehouses(npList, center, latitude, longitude) {
    if (localStorage.getItem("search") === "true") { //if user try to find warehouses in certain city
        center = {lat: parseFloat(npList[0]["Latitude"]), lng: parseFloat(npList[0]["Longitude"])} //center of map in first warehouse
    }

    let opt = {
        center: center,
        zoom: 12
    }

    const myMap = new google.maps.Map(document.getElementById("map"), opt);


    let marker = new google.maps.Marker({
        position: {
            lat: latitude,
            lng: longitude
        },
        map: myMap,
        title: "Ви тут",
    });

    warehouses.innerHTML = "Відділення:<br>"
    npList.forEach(warehouse => {
        warehouses.innerHTML += warehouse["Description"] + "<br>";
        let tmp = new google.maps.Marker({
            position: {
                lat: parseFloat(warehouse["Latitude"]),
                lng: parseFloat(warehouse["Longitude"])
            },
            map: myMap,
            title: "Нова Пошта",
            icon: "postMarker.svg"
        });
    });
}