let userPosition = document.getElementById("userPosition");
let warehouses = document.getElementById("warehouses");
let sbmButton = document.getElementById("submit");
let cityName = document.getElementById("cityName");

sbmButton.onclick = () => {
    localStorage.setItem("cityName", cityName.value);
    localStorage.setItem("search", "true");
    showPosition(JSON.parse(localStorage.getItem("location")));
}

function getLocation() {
    if ("location" in localStorage) {
        showPosition(JSON.parse(localStorage.getItem("location")));
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        userPosition.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;

    let latlng = new google.maps.LatLng(latitude, longitude);
    let geocoder = new google.maps.Geocoder();

    let center = {lat: latitude, lng: longitude};

    geocoder.geocode({'latLng': latlng}, (results, status) => {
        if (status == google.maps.GeocoderStatus.OK) {
            userPosition.innerHTML = "Ви знаходитесь: " + results[6].formatted_address;
            localStorage.setItem("cityName", results[6].formatted_address.split(", ")[0]);
            let address = results[6].formatted_address.split(", ")[0];
        }
    });

    let location = JSON.stringify({
        coords: {
            latitude: latitude,
            longitude: longitude
        }
    })

    if (!("location" in localStorage) || localStorage.getItem("location") !== location) {
        localStorage.setItem("location", location)
    }

    fetch("https://api.novaposhta.ua/v2.0/json/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            "apiKey": "e24be4b216cf0c581562d6eb99b65081",
            "modelName": "Address",
            "calledMethod": "getWarehouses",
            "methodProperties": {
                "CityName" : localStorage.getItem("cityName"),
                "Page" : "1",
                "Limit" : "50",
                "Language" : "UA"
            }
        })
    })
        .then(res => res.json())
        .then(data => {
            if(localStorage.getItem("search")==="true") {
                center = {lat: parseFloat(data.data[0]["Latitude"]), lng: parseFloat(data.data[0]["Longitude"])}
            }

            let opt = {
                center: center,
                zoom: 12
            }

            let myMap = new google.maps.Map(document.getElementById("map"), opt);


            let marker = new google.maps.Marker({
                position: {
                    lat: latitude,
                    lng: longitude
                },
                map: myMap,
                title: "Ви тут",
            });

            warehouses.innerHTML = "Відділення:<br>"
            data.data.forEach(warehouse => {
                warehouses.innerHTML += warehouse["Description"]+"<br>";
                let tmp = new google.maps.Marker({
                    position: {
                        lat: parseFloat(warehouse["Latitude"]),
                        lng: parseFloat(warehouse["Longitude"])
                    },
                    map: myMap,
                    title: "Нова Пошта",
                    icon: "postMarker.svg"
                });
            })
        })
}
