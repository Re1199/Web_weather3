apiKey = '315bdb45e49dcae9a4a9512b11a04583';
baseURL = 'http://localhost:3000';
addListeners();
getMainCity();
addFavoriteCities();

function addListeners() {
	document.querySelector('.add-new-city').addEventListener('submit', (event) => {
		event.preventDefault();
		cityInput = event.currentTarget.firstElementChild.value;
		cityInput = ucFirst(cityInput);
		cityHTML = addCity(cityInput);

		fetch(`${baseURL}/weather/city?q=${cityInput}`).then(resp => resp.json()).then(data => {
			/*
			check = isFavourite(cityInput);
			if (data.name !== undefined && !check) {
				putFavoriteCity(data, cityHTML);
			} else if (check) {
				alert('Город уже в избранном');
				cityHTML.remove();
			} else {
				alert('Город не найден');
				cityHTML.remove();
			}
			 */
			if (data.name !== undefined) {
				putFavoriteCity(data, cityHTML);
			} else {
				alert('Город не найден');
				cityHTML.remove();
			}
		})
		.catch(function () {
			cityHTML.lastElementChild.innerHTML = `<p class="wait-city">Данные не получены</p>`
		});
		document.querySelector('.add-new-city-input').value = "";
	});
	document.querySelector('.update-btn-text').addEventListener('click', (event) => {
		getMainCity();
	});
	document.querySelector('.update-btn').addEventListener('click', (event) => {
		getMainCity();
	});
}

function isFavourite(name) {
	return getFavouriteList().includes(name)
}

function getFavouriteList() {
	fetch(`${baseURL}/favourites`, {
		method: 'GET'
	}).then(resp => resp.json()).then(data => {
		favoritesCities = data ? data.name : [];
	}).catch(err => {});
	return favoritesCities
}

function getCityNum(name) {
	return getFavouriteList().indexOf(name)
}

function getMainCity() {
	geolocation = navigator.geolocation;
	geolocation.getCurrentPosition( position => {
			latitude = position.coords.latitude;
			longitude = position.coords.longitude;
			addMainCity(latitude, longitude);
		},
		positionError => {
			addMainCity(59.894444, 30.264168); //spb
		});
}

function putFavoriteCity(data, cityElem) {
	fetch(`${baseURL}/favourites`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
		body: `name=${data.name}`
	}).then(resp => resp.json()).then(() => {
		addCityInfo(data);
	}).catch(function () {
		cityElem.lastElementChild.innerHTML = `<p class="wait-city">Данные не получены</p>`
	});
}

function addMainCity(lat, lon) {
	localStorage.setItem('lat', lat);
	localStorage.setItem('lon', lon);
	fetch(`${baseURL}/weather/coordinates?lat=${lat}&lon=${lon}`).then(resp => resp.json()).then(data => {
		temp = Math.round(data.main.temp - 273) + '°C';
		document.querySelector('main > section').innerHTML = '';
		document.querySelector('main > section').appendChild(mainCityHtml(data.name, data.weather[0]['icon'], temp));
		document.querySelector('.properties').innerHTML = '';
		document.querySelector('.properties').appendChild(infoHTML(data));
	})
	.catch(function () {
		document.querySelector('#main-loading').innerHTML = `<p class="main-loading-text">Данные не получены</p>`
	});
}

function addFavoriteCities() {
	fetch(`${baseURL}/favourites`).then(resp => resp.json()).then(data => {
		favoritesCities = data ? data : [];
		for (i = 0; i < favoritesCities.length; i++) {
			addCity(favoritesCities[i]);
		}

		favoritesCitiesSet = new Set(favoritesCities);
		for (favoriteCity of favoritesCitiesSet) {
			fetchCity(favoriteCity)
		}
	})
	.catch(err => {});
}

function fetchCity(city) {
	fetch(`${baseURL}/weather/city?q=${city}`).then(resp => resp.json()).then(data => {
		addCityInfo(data);
	})
	.catch(err => {
		document.querySelectorAll(`.${city} > .info`).forEach( item => {
			item.innerHTML = `<p class="wait-city">Данные не получены</p>`;
		});
	});
}

function addCity(cityName) {
	template = document.querySelector('#city');
	template.content.firstElementChild.setAttribute('class', cityName);
	template.content.querySelector('h3').textContent = cityName;
	elem = template.content.cloneNode(true).firstElementChild;
	city = document.querySelector('main').appendChild(elem);

	btnRemove = city.firstElementChild.lastElementChild;
	btnRemove.addEventListener( 'click' , (event) => {
		city = event.currentTarget.parentNode.parentNode;
		cityName = city.getAttribute('class');
		i = getCityNum(cityName);

		fetch(`${baseURL}/favourites`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
			},
			body: `num=${i}`
		}).then(resp => resp.json()).then(() => {}).catch(err => {
			alert("Город не удален");
			console.log(err)
		});

		city.remove();
	});
	return elem;
}

function addCityInfo(data) {
	temp = Math.round(data.main.temp - 273) + '&deg;' + 'C';
	cityNameClass = data.name;
	document.querySelectorAll(`.${cityNameClass} > .fav-city-main-info > h3`).forEach( item => {
		if (item.parentNode.children.length === 2) {
			item.insertAdjacentHTML('afterend', `
   				<span class="fav-city-temp">${temp}</span>
   				<img class="fav-city-img" src="https://openweathermap.org/img/wn/${data.weather[0]['icon']}@2x.png">
   			`);
		}
	});
	document.querySelectorAll(`.${cityNameClass} > .info`).forEach(item => {
		item.innerHTML = '';
		item.appendChild(infoHTML(data));
	});
}

function windDirection(deg) {
	if (deg < 22.5 || deg >= 337.5) {
		return 'North';
	}
	if (deg < 67.5) {
		return 'North-East';
	}
	if (deg < 112.5) {
		return 'East';
	}
	if (deg < 157.5) {
		return 'South-East';
	}
	if (deg < 202.5) {
		return 'South';
	}
	if (deg < 247.5) {
		return 'South-West';
	}
	if (deg < 292.5) {
		return 'West';
	}
	return 'North-West'
}

function mainCityHtml(name, icon, temp) {
	template = document.querySelector('#main-city');
	template.content.querySelector('h2').textContent = name;
	template.content.querySelector('.main-weather-img').setAttribute('src', `https://openweathermap.org/img/wn/${icon}@2x.png`);
	template.content.querySelector('.main-temp').textContent = temp;
	return template.content.cloneNode(true);
}

function infoHTML(data) {
	template = document.querySelector('#properties');
	span = template.content.querySelectorAll('span');
	span[0].textContent = `${data.wind.speed} m/s, ${windDirection(data.wind.deg)}`;
	span[1].textContent = data.clouds.all + ' %';
	span[2].textContent = data.main.pressure + ' hpa';
	span[3].textContent = data.main.humidity + ' %';
	span[4].textContent = `[${data.coord.lon} ${data.coord.lat}]`;
	return template.content.cloneNode(true);
}

function ucFirst(str) {
	if (!str) return str;
	str = (str[0].toUpperCase() + str.slice(1).toLocaleLowerCase()).trim();
	return str;
}
