// Main application JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const weatherAnimation = document.getElementById('weather-animation');
    const locationElement = document.getElementById('location');
    const dateTimeElement = document.getElementById('date-time');
    const temperatureElement = document.getElementById('temperature');
    const weatherConditionElement = document.getElementById('weather-condition');
    const feelsLikeElement = document.getElementById('feels-like');
    const humidityElement = document.getElementById('humidity');
    const windElement = document.getElementById('wind');
    const precipitationElement = document.getElementById('precipitation');
    const pressureElement = document.getElementById('pressure');
    const visibilityElement = document.getElementById('visibility');
    const uvIndexElement = document.getElementById('uv-index');
    const sunriseElement = document.getElementById('sunrise');
    const sunsetElement = document.getElementById('sunset');
    
    // API key for Tomorrow.io
    const apiKey = 'BcbW0lW0FON9lT1ouUB6QrRqOtAlYL56';
    
    // Add loading animation
    const loadingAnimation = document.createElement('div');
    loadingAnimation.className = 'loading';
    weatherAnimation.appendChild(loadingAnimation);
    
    // Update date and time
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
    
    // Initialize date/time and set up daily refresh
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Set up daily refresh for weather data
    function setupDailyRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow - now;
        
        // Refresh weather data at midnight
        setTimeout(() => {
            getWeatherData();
            // Set up the next day's refresh
            setupDailyRefresh();
        }, timeUntilMidnight);
    }
    
    // Get user's geolocation
    function getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        resolve({ latitude, longitude });
                    },
                    error => {
                        console.error('Error getting location:', error);
                        // Fallback for testing - use default coordinates
                        console.log('Using fallback coordinates for testing');
                        resolve({ latitude: 37.7749, longitude: -122.4194 }); // San Francisco
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else {
                console.error('Geolocation is not supported by this browser.');
                // Fallback for testing - use default coordinates
                console.log('Using fallback coordinates for testing');
                resolve({ latitude: 37.7749, longitude: -122.4194 }); // San Francisco
            }
        });
    }
    
    // Get location name from coordinates using reverse geocoding
    async function getLocationName(latitude, longitude) {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await response.json();
            
            let locationName = '';
            if (data.city) {
                locationName = data.city;
                if (data.principalSubdivision) {
                    locationName += `, ${data.principalSubdivision}`;
                }
            } else if (data.locality) {
                locationName = data.locality;
                if (data.principalSubdivision) {
                    locationName += `, ${data.principalSubdivision}`;
                }
            } else {
                locationName = 'Unknown Location';
            }
            
            return locationName;
        } catch (error) {
            console.error('Error getting location name:', error);
            return 'San Francisco, CA'; // Fallback for testing
        }
    }
    
    // Get weather data from Tomorrow.io API
    async function getWeatherData(latitude, longitude) {
        try {
            // If no coordinates provided, use the ones from getUserLocation
            if (!latitude || !longitude) {
                const location = await getUserLocation();
                latitude = location.latitude;
                longitude = location.longitude;
            }
            
            const url = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&units=imperial&apikey=${apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Weather data:', data);
            
            // Extract weather data
            const weather = data.data.values;
            
            // Update UI with weather data
            temperatureElement.textContent = `${Math.round(weather.temperature)}°`;
            feelsLikeElement.textContent = `${Math.round(weather.temperatureApparent)}°`;
            humidityElement.textContent = `${Math.round(weather.humidity)}%`;
            windElement.textContent = `${Math.round(weather.windSpeed)} mph`;
            precipitationElement.textContent = `${weather.precipitationProbability}%`;
            pressureElement.textContent = `${(weather.pressureSurfaceLevel / 33.864).toFixed(2)} inHg`;
            visibilityElement.textContent = `${weather.visibility} mi`;
            uvIndexElement.textContent = weather.uvIndex;
            
            // Get weather condition
            const weatherCode = weather.weatherCode;
            const weatherCondition = getWeatherCondition(weatherCode);
            weatherConditionElement.textContent = weatherCondition;
            
            // Get sunrise and sunset times
            getSunriseSunset(latitude, longitude);
            
            // Apply theme based on weather condition and time of day
            applyWeatherTheme(weatherCode);
            
            // Create weather animations
            createWeatherAnimations(weatherCode);
            
            return data;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            temperatureElement.textContent = 'Error';
            weatherConditionElement.textContent = 'Could not fetch weather data';
            
            // For testing purposes, show a demo animation with mock data
            console.log('Using fallback weather data for testing');
            useFallbackWeatherData();
        }
    }
    
    // Fallback function for testing when API fails
    function useFallbackWeatherData() {
        // Mock weather data
        temperatureElement.textContent = '72°';
        feelsLikeElement.textContent = '70°';
        humidityElement.textContent = '65%';
        windElement.textContent = '8 mph';
        precipitationElement.textContent = '10%';
        pressureElement.textContent = '29.92 inHg';
        visibilityElement.textContent = '10 mi';
        uvIndexElement.textContent = '5';
        weatherConditionElement.textContent = 'Clear';
        sunriseElement.textContent = '6:45 AM';
        sunsetElement.textContent = '7:30 PM';
        
        // Apply a clear day theme
        document.body.classList.add('clear-day');
        
        // Create sun animation
        createSunAnimation();
    }
    
    // Get sunrise and sunset times
    async function getSunriseSunset(latitude, longitude) {
        try {
            const date = new Date();
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${formattedDate}&formatted=0`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK') {
                const sunriseTime = new Date(data.results.sunrise);
                const sunsetTime = new Date(data.results.sunset);
                
                const formatTime = (date) => {
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                };
                
                sunriseElement.textContent = formatTime(sunriseTime);
                sunsetElement.textContent = formatTime(sunsetTime);
            }
        } catch (error) {
            console.error('Error fetching sunrise/sunset data:', error);
            sunriseElement.textContent = '6:45 AM'; // Fallback
            sunsetElement.textContent = '7:30 PM'; // Fallback
        }
    }
    
    // Map weather code to condition
    function getWeatherCondition(code) {
        const weatherCodes = {
            0: 'Unknown',
            1000: 'Clear',
            1001: 'Cloudy',
            1100: 'Mostly Clear',
            1101: 'Partly Cloudy',
            1102: 'Mostly Cloudy',
            2000: 'Fog',
            2100: 'Light Fog',
            3000: 'Light Wind',
            3001: 'Wind',
            3002: 'Strong Wind',
            4000: 'Drizzle',
            4001: 'Rain',
            4200: 'Light Rain',
            4201: 'Heavy Rain',
            5000: 'Snow',
            5001: 'Flurries',
            5100: 'Light Snow',
            5101: 'Heavy Snow',
            6000: 'Freezing Drizzle',
            6001: 'Freezing Rain',
            6200: 'Light Freezing Rain',
            6201: 'Heavy Freezing Rain',
            7000: 'Ice Pellets',
            7101: 'Heavy Ice Pellets',
            7102: 'Light Ice Pellets',
            8000: 'Thunderstorm'
        };
        
        return weatherCodes[code] || 'Unknown';
    }
    
    // Apply theme based on weather condition
    function applyWeatherTheme(weatherCode) {
        // Remove all existing theme classes
        document.body.classList.remove(
            'clear-day', 'clear-night', 'cloudy', 'fog', 
            'rain', 'snow', 'wind', 'storm'
        );
        
        const now = new Date();
        const hours = now.getHours();
        const isDay = hours >= 6 && hours < 20;
        
        // Apply appropriate theme based on weather code
        if (weatherCode === 1000 || weatherCode === 1100) {
            document.body.classList.add(isDay ? 'clear-day' : 'clear-night');
        } else if ([1001, 1101, 1102].includes(weatherCode)) {
            document.body.classList.add('cloudy');
        } else if ([2000, 2100].includes(weatherCode)) {
            document.body.classList.add('fog');
        } else if ([4000, 4001, 4200, 4201, 6000, 6001, 6200, 6201].includes(weatherCode)) {
            document.body.classList.add('rain');
        } else if ([5000, 5001, 5100, 5101].includes(weatherCode)) {
            document.body.classList.add('snow');
        } else if ([3000, 3001, 3002].includes(weatherCode)) {
            document.body.classList.add('wind');
        } else if ([7000, 7101, 7102, 8000].includes(weatherCode)) {
            document.body.classList.add('storm');
        } else {
            document.body.classList.add(isDay ? 'clear-day' : 'clear-night');
        }
    }
    
    // Create weather animations based on weather code
    function createWeatherAnimations(weatherCode) {
        // Clear previous animations
        weatherAnimation.innerHTML = '';
        
        const now = new Date();
        const hours = now.getHours();
        const isDay = hours >= 6 && hours < 20;
        
        // Create animations based on weather code
        if (weatherCode === 1000 || weatherCode === 1100) {
            // Clear day or night
            if (isDay) {
                createSunAnimation();
            } else {
                createStarryNightAnimation();
            }
        } else if ([1001, 1101, 1102].includes(weatherCode)) {
            // Cloudy
            createCloudAnimation(weatherCode === 1001 ? 8 : weatherCode === 1101 ? 3 : 5);
        } else if ([2000, 2100].includes(weatherCode)) {
            // Fog
            createFogAnimation();
        } else if ([4000, 4001, 4200, 4201, 6000, 6001, 6200, 6201].includes(weatherCode)) {
            // Rain
            const isHeavy = [4001, 4201, 6001, 6201].includes(weatherCode);
            createRainAnimation(isHeavy);
            createCloudAnimation(isHeavy ? 7 : 4);
        } else if ([5000, 5001, 5100, 5101].includes(weatherCode)) {
            // Snow
            const isHeavy = [5000, 5101].includes(weatherCode);
            createSnowAnimation(isHeavy);
            createCloudAnimation(isHeavy ? 6 : 3);
        } else if ([3000, 3001, 3002].includes(weatherCode)) {
            // Wind
            const isStrong = weatherCode === 3002;
            createWindAnimation(isStrong);
            if (isDay) {
                createSunAnimation(true); // Dimmed sun
            } else {
                createStarryNightAnimation(true); // Fewer stars
            }
        } else if ([7000, 7101, 7102].includes(weatherCode)) {
            // Ice pellets
            createIcePelletsAnimation(weatherCode === 7101);
            createCloudAnimation(6);
        } else if (weatherCode === 8000) {
            // Thunderstorm
            createThunderstormAnimation();
        } else {
            // Default - clear
            if (isDay) {
                createSunAnimation();
            } else {
                createStarryNightAnimation();
            }
        }
    }
    
    // Sun animation
    function createSunAnimation(dimmed = false) {
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.position = 'absolute';
        sun.style.width = '150px';
        sun.style.height = '150px';
        sun.style.borderRadius = '50%';
        sun.style.backgroundColor = dimmed ? 'rgba(255, 200, 50, 0.5)' : 'rgba(255, 200, 50, 0.8)';
        sun.style.boxShadow = dimmed ? '0 0 50px rgba(255, 200, 50, 0.5)' : '0 0 100px rgba(255, 200, 50, 0.8)';
        sun.style.top = '15%';
        sun.style.left = '50%';
        sun.style.transform = 'translateX(-50%)';
        weatherAnimation.appendChild(sun);
        
        // Sun rays
        if (!dimmed) {
            for (let i = 0; i < 12; i++) {
                const ray = document.createElement('div');
                ray.className = 'sun-ray';
                ray.style.position = 'absolute';
                ray.style.width = '3px';
                ray.style.height = '50px';
                ray.style.backgroundColor = 'rgba(255, 200, 50, 0.6)';
                ray.style.top = '50%';
                ray.style.left = '50%';
                ray.style.transformOrigin = '0 0';
                ray.style.transform = `rotate(${i * 30}deg) translate(75px, 0)`;
                
                // Animate rays with GSAP
                gsap.to(ray, {
                    height: '70px',
                    opacity: 0.3,
                    duration: 2,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    delay: i * 0.2
                });
                
                sun.appendChild(ray);
            }
        }
        
        // Animate sun with subtle pulsing
        gsap.to(sun, {
            boxShadow: dimmed ? '0 0 60px rgba(255, 200, 50, 0.6)' : '0 0 120px rgba(255, 200, 50, 0.9)',
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
    
    // Starry night animation
    function createStarryNightAnimation(fewer = false) {
        const starCount = fewer ? 50 : 200;
        
        // Create moon
        const moon = document.createElement('div');
        moon.className = 'moon';
        moon.style.position = 'absolute';
        moon.style.width = '100px';
        moon.style.height = '100px';
        moon.style.borderRadius = '50%';
        moon.style.backgroundColor = 'rgba(220, 220, 230, 0.9)';
        moon.style.boxShadow = '0 0 50px rgba(220, 220, 230, 0.5)';
        moon.style.top = '15%';
        moon.style.left = '70%';
        weatherAnimation.appendChild(moon);
        
        // Animate moon with subtle pulsing
        gsap.to(moon, {
            boxShadow: '0 0 60px rgba(220, 220, 230, 0.7)',
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
        
        // Create stars
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.position = 'absolute';
            star.style.width = `${Math.random() * 3 + 1}px`;
            star.style.height = star.style.width;
            star.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            star.style.borderRadius = '50%';
            star.style.top = `${Math.random() * 70}%`;
            star.style.left = `${Math.random() * 100}%`;
            weatherAnimation.appendChild(star);
            
            // Animate stars with twinkling effect
            gsap.to(star, {
                opacity: 0.2,
                duration: Math.random() * 3 + 1,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: Math.random() * 2
            });
        }
    }
    
    // Cloud animation
    function createCloudAnimation(cloudCount = 5) {
        for (let i = 0; i < cloudCount; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.position = 'absolute';
            
            // Randomize cloud size
            const cloudWidth = Math.random() * 200 + 100;
            cloud.style.width = `${cloudWidth}px`;
            cloud.style.height = `${cloudWidth * 0.6}px`;
            
            // Create cloud shape with multiple circles
            cloud.style.backgroundColor = 'rgba(255, 255, 255, 0)';
            cloud.style.borderRadius = '50%';
            cloud.style.top = `${Math.random() * 40 + 5}%`;
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.opacity = `${Math.random() * 0.5 + 0.5}`;
            
            // Create cloud parts
            for (let j = 0; j < 6; j++) {
                const cloudPart = document.createElement('div');
                cloudPart.style.position = 'absolute';
                cloudPart.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                cloudPart.style.borderRadius = '50%';
                
                const partSize = Math.random() * 50 + 50;
                cloudPart.style.width = `${partSize}px`;
                cloudPart.style.height = `${partSize}px`;
                cloudPart.style.top = `${Math.random() * 50}%`;
                cloudPart.style.left = `${Math.random() * 70}%`;
                cloudPart.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
                
                cloud.appendChild(cloudPart);
            }
            
            weatherAnimation.appendChild(cloud);
            
            // Animate cloud movement
            gsap.fromTo(cloud, 
                { x: -cloudWidth }, 
                { 
                    x: window.innerWidth + cloudWidth, 
                    duration: Math.random() * 60 + 60,
                    repeat: -1,
                    ease: 'none',
                    delay: Math.random() * 20
                }
            );
        }
    }
    
    // Rain animation
    function createRainAnimation(heavy = false) {
        const rainCount = heavy ? 200 : 100;
        
        for (let i = 0; i < rainCount; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.position = 'absolute';
            raindrop.style.width = '2px';
            raindrop.style.height = `${Math.random() * 15 + 10}px`;
            raindrop.style.backgroundColor = 'rgba(200, 220, 255, 0.6)';
            raindrop.style.top = `${Math.random() * 100}%`;
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.borderRadius = '0 0 5px 5px';
            raindrop.style.transform = 'rotate(20deg)';
            weatherAnimation.appendChild(raindrop);
            
            // Animate raindrops falling
            gsap.fromTo(raindrop, 
                { y: -100, opacity: 0.7 }, 
                { 
                    y: window.innerHeight + 100, 
                    opacity: 0,
                    duration: Math.random() * 1 + (heavy ? 0.5 : 1),
                    repeat: -1,
                    ease: 'none',
                    delay: Math.random() * 2
                }
            );
        }
    }
    
    // Snow animation
    function createSnowAnimation(heavy = false) {
        const snowCount = heavy ? 150 : 80;
        
        for (let i = 0; i < snowCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.position = 'absolute';
            
            const size = Math.random() * 5 + 3;
            snowflake.style.width = `${size}px`;
            snowflake.style.height = `${size}px`;
            snowflake.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            snowflake.style.borderRadius = '50%';
            snowflake.style.top = `${Math.random() * 100}%`;
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.8)';
            weatherAnimation.appendChild(snowflake);
            
            // Animate snowflakes falling with swaying
            gsap.fromTo(snowflake, 
                { y: -100, x: 0 }, 
                { 
                    y: window.innerHeight + 100,
                    x: Math.random() * 200 - 100,
                    duration: Math.random() * 10 + 10,
                    repeat: -1,
                    ease: 'none',
                    delay: Math.random() * 5
                }
            );
            
            // Add rotation animation
            gsap.to(snowflake, {
                rotation: Math.random() * 360,
                duration: Math.random() * 5 + 5,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
    }
    
    // Fog animation
    function createFogAnimation() {
        for (let i = 0; i < 5; i++) {
            const fogLayer = document.createElement('div');
            fogLayer.className = 'fog-layer';
            fogLayer.style.position = 'absolute';
            fogLayer.style.width = '200%';
            fogLayer.style.height = '100%';
            fogLayer.style.background = 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)';
            fogLayer.style.top = `${i * 20}%`;
            fogLayer.style.left = '-100%';
            fogLayer.style.opacity = `${Math.random() * 0.3 + 0.2}`;
            weatherAnimation.appendChild(fogLayer);
            
            // Animate fog layers
            gsap.to(fogLayer, {
                x: '100%',
                duration: Math.random() * 60 + 60,
                repeat: -1,
                ease: 'none',
                delay: Math.random() * 10
            });
        }
    }
    
    // Wind animation
    function createWindAnimation(strong = false) {
        for (let i = 0; i < (strong ? 20 : 10); i++) {
            const windLine = document.createElement('div');
            windLine.className = 'wind-line';
            windLine.style.position = 'absolute';
            windLine.style.height = '2px';
            windLine.style.width = `${Math.random() * 100 + 50}px`;
            windLine.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            windLine.style.top = `${Math.random() * 100}%`;
            windLine.style.left = '-100px';
            windLine.style.borderRadius = '2px';
            weatherAnimation.appendChild(windLine);
            
            // Animate wind lines
            gsap.fromTo(windLine, 
                { x: -100, opacity: 0 }, 
                { 
                    x: window.innerWidth + 100, 
                    opacity: [0, 0.7, 0],
                    duration: strong ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
                    repeat: -1,
                    ease: 'power1.inOut',
                    delay: Math.random() * 3
                }
            );
        }
        
        // Add some leaves or debris for strong wind
        if (strong) {
            for (let i = 0; i < 15; i++) {
                const debris = document.createElement('div');
                debris.className = 'debris';
                debris.style.position = 'absolute';
                debris.style.width = `${Math.random() * 6 + 2}px`;
                debris.style.height = `${Math.random() * 6 + 2}px`;
                debris.style.backgroundColor = 'rgba(150, 100, 50, 0.7)';
                debris.style.borderRadius = '50%';
                debris.style.top = `${Math.random() * 100}%`;
                debris.style.left = '-20px';
                weatherAnimation.appendChild(debris);
                
                // Animate debris
                gsap.fromTo(debris, 
                    { x: -20, y: 0, rotation: 0 }, 
                    { 
                        x: window.innerWidth + 20,
                        y: Math.random() * 200 - 100,
                        rotation: Math.random() * 360 * 3,
                        duration: Math.random() * 3 + 2,
                        repeat: -1,
                        ease: 'power1.inOut',
                        delay: Math.random() * 5
                    }
                );
            }
        }
    }
    
    // Ice pellets animation
    function createIcePelletsAnimation(heavy = false) {
        const pelletCount = heavy ? 100 : 50;
        
        for (let i = 0; i < pelletCount; i++) {
            const pellet = document.createElement('div');
            pellet.className = 'ice-pellet';
            pellet.style.position = 'absolute';
            
            const size = Math.random() * 4 + 2;
            pellet.style.width = `${size}px`;
            pellet.style.height = `${size}px`;
            pellet.style.backgroundColor = 'rgba(200, 230, 255, 0.8)';
            pellet.style.borderRadius = '50%';
            pellet.style.top = `${Math.random() * 100}%`;
            pellet.style.left = `${Math.random() * 100}%`;
            weatherAnimation.appendChild(pellet);
            
            // Animate ice pellets falling faster than snow
            gsap.fromTo(pellet, 
                { y: -100, x: 0 }, 
                { 
                    y: window.innerHeight + 100,
                    x: Math.random() * 50 - 25,
                    duration: Math.random() * 2 + 1,
                    repeat: -1,
                    ease: 'power1.in',
                    delay: Math.random() * 3
                }
            );
        }
    }
    
    // Thunderstorm animation
    function createThunderstormAnimation() {
        // Add rain
        createRainAnimation(true);
        
        // Add dark clouds
        createCloudAnimation(7);
        
        // Create lightning flashes
        const lightningContainer = document.createElement('div');
        lightningContainer.className = 'lightning-container';
        lightningContainer.style.position = 'absolute';
        lightningContainer.style.width = '100%';
        lightningContainer.style.height = '100%';
        lightningContainer.style.top = '0';
        lightningContainer.style.left = '0';
        lightningContainer.style.backgroundColor = 'rgba(255, 255, 255, 0)';
        weatherAnimation.appendChild(lightningContainer);
        
        // Function to create lightning flash
        function createLightningFlash() {
            lightningContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            
            // Create actual lightning bolt
            const lightning = document.createElement('div');
            lightning.className = 'lightning';
            lightning.style.position = 'absolute';
            lightning.style.width = '3px';
            lightning.style.height = '0';
            lightning.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            lightning.style.top = '20%';
            lightning.style.left = `${Math.random() * 80 + 10}%`;
            lightning.style.zIndex = '100';
            lightning.style.boxShadow = '0 0 10px rgba(200, 220, 255, 0.9)';
            weatherAnimation.appendChild(lightning);
            
            // Animate lightning growth
            gsap.to(lightning, {
                height: '60%',
                duration: 0.1,
                onComplete: () => {
                    // Create branches
                    for (let i = 0; i < 3; i++) {
                        const branch = document.createElement('div');
                        branch.className = 'lightning-branch';
                        branch.style.position = 'absolute';
                        branch.style.width = '2px';
                        branch.style.height = '0';
                        branch.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        branch.style.top = `${Math.random() * 80}%`;
                        branch.style.left = '0';
                        branch.style.transformOrigin = '0 0';
                        branch.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
                        branch.style.boxShadow = '0 0 5px rgba(200, 220, 255, 0.9)';
                        lightning.appendChild(branch);
                        
                        gsap.to(branch, {
                            height: `${Math.random() * 100 + 50}px`,
                            duration: 0.05
                        });
                    }
                    
                    // Fade out lightning
                    gsap.to(lightning, {
                        opacity: 0,
                        delay: 0.2,
                        duration: 0.1,
                        onComplete: () => {
                            weatherAnimation.removeChild(lightning);
                        }
                    });
                }
            });
            
            // Fade out flash
            gsap.to(lightningContainer, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                duration: 0.1
            });
            
            // Schedule next lightning
            setTimeout(createLightningFlash, Math.random() * 5000 + 2000);
        }
        
        // Start lightning after a delay
        setTimeout(createLightningFlash, Math.random() * 2000 + 1000);
    }
    
    // Initialize the application
    async function initApp() {
        try {
            // Get user's location
            const location = await getUserLocation();
            
            // Get location name
            const locationName = await getLocationName(location.latitude, location.longitude);
            locationElement.textContent = locationName;
            
            // Get weather data
            await getWeatherData(location.latitude, location.longitude);
            
            // Set up daily refresh
            setupDailyRefresh();
            
            // Remove loading animation
            if (weatherAnimation.contains(loadingAnimation)) {
                weatherAnimation.removeChild(loadingAnimation);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            locationElement.textContent = 'Location access denied';
            temperatureElement.textContent = 'Error';
            weatherConditionElement.textContent = 'Please allow location access and refresh';
            
            // Use fallback for testing
            useFallbackWeatherData();
            
            // Remove loading animation
            if (weatherAnimation.contains(loadingAnimation)) {
                weatherAnimation.removeChild(loadingAnimation);
            }
        }
    }
    
    // Initialize the app
    initApp();
});
