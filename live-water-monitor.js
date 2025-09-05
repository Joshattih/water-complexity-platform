// live-water-monitor.js - Real-time water monitoring from multiple sources
// This replaces all fake data with actual API calls

class WaterMonitoringSystem {
    constructor() {
        this.cities = [
            // Major water-stressed cities globally
            { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'IN', population: 11.0 },
            { name: 'Cape Town', lat: -33.9249, lon: 18.4241, country: 'ZA', population: 4.6 },
            { name: 'São Paulo', lat: -23.5505, lon: -46.6333, country: 'BR', population: 22.4 },
            { name: 'Mexico City', lat: 19.4326, lon: -99.1332, country: 'MX', population: 22.0 },
            { name: 'Jakarta', lat: -6.2088, lon: 106.8456, country: 'ID', population: 10.6 },
            { name: 'Delhi', lat: 28.6139, lon: 77.2090, country: 'IN', population: 32.0 },
            { name: 'Beijing', lat: 39.9042, lon: 116.4074, country: 'CN', population: 21.5 },
            { name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'TR', population: 15.5 },
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'JP', population: 37.4 },
            { name: 'Cairo', lat: 30.0444, lon: 31.2357, country: 'EG', population: 20.5 },
            { name: 'Lagos', lat: 6.5244, lon: 3.3792, country: 'NG', population: 15.0 },
            { name: 'Karachi', lat: 24.8607, lon: 67.0011, country: 'PK', population: 16.0 },
            { name: 'Dhaka', lat: 23.8103, lon: 90.4125, country: 'BD', population: 22.5 },
            { name: 'Manila', lat: 14.5995, lon: 120.9842, country: 'PH', population: 13.9 },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'US', population: 13.0 },
            { name: 'Phoenix', lat: 33.4484, lon: -112.0740, country: 'US', population: 5.0 },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'SG', population: 5.7 },
            { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'AE', population: 3.3 },
            { name: 'Lima', lat: -12.0464, lon: -77.0428, country: 'PE', population: 10.7 },
            { name: 'Bangalore', lat: 12.9716, lon: 77.5946, country: 'IN', population: 12.3 }
        ];
        
        this.currentData = new Map();
        this.tickerIndex = 0;
        this.updateInterval = 300000; // 5 minutes
        this.lastUpdate = null;
    }

    // NASA POWER API - Get precipitation and temperature
    async fetchNASAPowerData(lat, lon) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const format = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');
        
        const url = `https://power.larc.nasa.gov/api/temporal/daily/point?` +
                   `parameters=PRECTOTCORR,T2M,RH2M,EVLAND&` +
                   `community=RE&longitude=${lon}&latitude=${lat}&` +
                   `start=${format(startDate)}&end=${format(endDate)}&format=JSON`;
        
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const params = data.properties?.parameter;
                
                if (params) {
                    const precip = Object.values(params.PRECTOTCORR || {});
                    const temp = Object.values(params.T2M || {});
                    const humidity = Object.values(params.RH2M || {});
                    
                    // Calculate averages, filtering out -999 (no data) values
                    const validPrecip = precip.filter(v => v !== -999);
                    const validTemp = temp.filter(v => v !== -999);
                    const validHumidity = humidity.filter(v => v !== -999);
                    
                    return {
                        precipitation: validPrecip.length ? 
                            (validPrecip.reduce((a,b) => a+b, 0) / validPrecip.length).toFixed(2) : 0,
                        temperature: validTemp.length ? 
                            (validTemp.reduce((a,b) => a+b, 0) / validTemp.length).toFixed(1) : 0,
                        humidity: validHumidity.length ? 
                            (validHumidity.reduce((a,b) => a+b, 0) / validHumidity.length).toFixed(1) : 0,
                        source: 'NASA POWER',
                        timestamp: new Date().toISOString()
                    };
                }
            }
        } catch (error) {
            console.error('NASA API error:', error);
        }
        
        return null;
    }

    // Open-Meteo API - Backup weather data
    async fetchOpenMeteoData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?` +
                   `latitude=${lat}&longitude=${lon}&` +
                   `current_weather=true&` +
                   `daily=precipitation_sum,temperature_2m_mean,relative_humidity_2m_mean&` +
                   `past_days=30&timezone=auto`;
        
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                
                if (data.daily) {
                    const precip = data.daily.precipitation_sum || [];
                    const avgPrecip = precip.reduce((a,b) => a+b, 0) / precip.length;
                    
                    return {
                        precipitation: avgPrecip.toFixed(2),
                        temperature: data.current_weather?.temperature || 0,
                        humidity: 0, // Open-Meteo doesn't provide humidity easily
                        source: 'Open-Meteo',
                        timestamp: new Date().toISOString()
                    };
                }
            }
        } catch (error) {
            console.error('Open-Meteo API error:', error);
        }
        
        return null;
    }

    // Calculate composite water stress index
    calculateWaterStressIndex(precipitation, temperature, humidity, population) {
        // Multi-factor water stress calculation
        // Based on research papers on water stress indices
        
        // Factor 1: Aridity Index (P/PET ratio)
        const potentialEvapotranspiration = 0.0023 * (temperature + 17.8) * Math.sqrt(Math.abs(25 - temperature)) * 5;
        const aridityIndex = precipitation > 0 ? precipitation / potentialEvapotranspiration : 0;
        
        // Factor 2: Per capita water availability
        // Assuming 1mm precipitation over 1km² = 1000m³ of water
        const areaKm2 = Math.pow(population * 10, 0.5); // Rough estimate of urban area
        const waterAvailable = precipitation * areaKm2 * 1000; // m³
        const perCapitaWater = waterAvailable / (population * 1000000);
        
        // Factor 3: Temperature stress (higher temp = more stress)
        const tempStress = Math.max(0, Math.min(100, (temperature - 15) * 3));
        
        // Factor 4: Humidity factor (lower humidity = more stress)
        const humidityFactor = Math.max(0, Math.min(100, (60 - humidity) * 2));
        
        // Composite index (weighted average)
        let stressIndex = 0;
        
        // Aridity component (40% weight)
        if (aridityIndex < 0.05) stressIndex += 40; // Hyper-arid
        else if (aridityIndex < 0.2) stressIndex += 30; // Arid
        else if (aridityIndex < 0.5) stressIndex += 20; // Semi-arid
        else if (aridityIndex < 0.65) stressIndex += 10; // Dry sub-humid
        
        // Per capita water component (30% weight)
        if (perCapitaWater < 500) stressIndex += 30; // Absolute scarcity
        else if (perCapitaWater < 1000) stressIndex += 20; // Scarcity
        else if (perCapitaWater < 1700) stressIndex += 10; // Stress
        
        // Temperature component (20% weight)
        stressIndex += tempStress * 0.2;
        
        // Humidity component (10% weight)
        stressIndex += humidityFactor * 0.1;
        
        return Math.min(100, Math.max(0, stressIndex));
    }

    // Get severity level from stress index
    getSeverityLevel(stressIndex) {
        if (stressIndex >= 80) return { level: 'critical', color: '#ff0040' };
        if (stressIndex >= 60) return { level: 'severe', color: '#ff6b35' };
        if (stressIndex >= 40) return { level: 'warning', color: '#ffa500' };
        if (stressIndex >= 20) return { level: 'moderate', color: '#ffdd00' };
        return { level: 'low', color: '#00d084' };
    }

    // Fetch data for a single city
    async fetchCityData(city) {
        // Try NASA first, fall back to Open-Meteo
        let data = await this.fetchNASAPowerData(city.lat, city.lon);
        
        if (!data) {
            data = await this.fetchOpenMeteoData(city.lat, city.lon);
        }
        
        if (data) {
            const stressIndex = this.calculateWaterStressIndex(
                parseFloat(data.precipitation),
                parseFloat(data.temperature),
                parseFloat(data.humidity),
                city.population
            );
            
            const severity = this.getSeverityLevel(stressIndex);
            
            return {
                ...city,
                ...data,
                waterStress: stressIndex.toFixed(1),
                severity: severity.level,
                severityColor: severity.color,
                lastUpdate: new Date().toLocaleTimeString()
            };
        }
        
        return null;
    }

    // Update all city data
    async updateAllCities() {
        console.log('Fetching water data for all cities...');
        
        for (const city of this.cities) {
            const data = await this.fetchCityData(city);
            if (data) {
                this.currentData.set(city.name, data);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.lastUpdate = new Date();
        console.log(`Updated ${this.currentData.size} cities at ${this.lastUpdate.toLocaleString()}`);
    }

    // Update ticker display
    updateTicker() {
        const tickerElement = document.getElementById('ticker3');
        if (!tickerElement) return;
        
        const cities = Array.from(this.currentData.values());
        if (cities.length === 0) return;
        
        const city = cities[this.tickerIndex % cities.length];
        
        tickerElement.textContent = 
            `${city.name}: ${city.precipitation}mm rain, ` +
            `${city.temperature}°C, ${city.waterStress}% stress`;
        
        // Update ticker dot color based on severity
        const tickerDot = tickerElement.previousElementSibling;
        if (tickerDot) {
            tickerDot.className = `ticker-dot ${city.severity === 'critical' ? 'critical' : 
                                                 city.severity === 'severe' ? 'warning' : 'normal'}`;
        }
        
        this.tickerIndex++;
    }

    // Update main statistics
    updateMainStats() {
        const cities = Array.from(this.currentData.values());
        
        // Count actual data
        const criticalCount = cities.filter(c => c.severity === 'critical').length;
        const severeCount = cities.filter(c => c.severity === 'severe').length;
        const totalMonitored = cities.length;
        
        // Update display
        const coverageEl = document.getElementById('globalCoverage');
        const criticalEl = document.getElementById('criticalZones');
        const dataPointsEl = document.getElementById('dataPoints');
        
        if (coverageEl) coverageEl.textContent = totalMonitored;
        if (criticalEl) criticalEl.textContent = criticalCount + severeCount;
        if (dataPointsEl) dataPointsEl.textContent = 
            this.lastUpdate ? this.lastUpdate.toLocaleTimeString() : 'Loading...';
    }

    // Update crisis cards
    updateCrisisCards() {
        const grid = document.getElementById('crisisGrid');
        if (!grid) return;
        
        // Clear existing cards
        grid.innerHTML = '';
        
        // Get top 8 most stressed cities
        const cities = Array.from(this.currentData.values())
            .sort((a, b) => parseFloat(b.waterStress) - parseFloat(a.waterStress))
            .slice(0, 8);
        
        cities.forEach((city, index) => {
            const card = document.createElement('div');
            card.className = `crisis-card ${city.severity === 'critical' ? 'critical' : ''}`;
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="location-header">
                    <span class="location-name">${city.name}</span>
                    <span class="status-badge status-${city.severity}">${city.severity}</span>
                </div>
                <div class="data-metric">
                    <span class="metric-label">Water Stress Index</span>
                    <span class="metric-value">${city.waterStress}%</span>
                </div>
                <div class="data-metric">
                    <span class="metric-label">Precipitation (30d avg)</span>
                    <span class="metric-value">${city.precipitation} mm/day</span>
                </div>
                <div class="data-metric">
                    <span class="metric-label">Temperature</span>
                    <span class="metric-value">${city.temperature}°C</span>
                </div>
                <div class="data-metric">
                    <span class="metric-label">Data Source</span>
                    <span class="metric-value" style="font-size: 0.85rem; color: #6b7c93;">
                        ${city.source} • ${city.lastUpdate}
                    </span>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    // Update map markers
    updateMap() {
        if (!window.map) return;
        
        // Clear existing markers
        window.map.eachLayer(layer => {
            if (layer instanceof L.CircleMarker) {
                window.map.removeLayer(layer);
            }
        });
        
        // Add new markers
        this.currentData.forEach(city => {
            const marker = L.circleMarker([city.lat, city.lon], {
                radius: 8 + (parseFloat(city.waterStress) / 10),
                fillColor: city.severityColor,
                color: city.severityColor,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.5
            }).addTo(window.map);
            
            marker.bindPopup(`
                <strong>${city.name}</strong><br>
                Water Stress: ${city.waterStress}%<br>
                Precipitation: ${city.precipitation} mm/day<br>
                Temperature: ${city.temperature}°C<br>
                Status: ${city.severity}<br>
                <small>Updated: ${city.lastUpdate}</small>
            `);
        });
    }

    // Initialize and start monitoring
    async start() {
        console.log('Starting Water Monitoring System...');
        
        // Initial data fetch
        await this.updateAllCities();
        
        // Update UI
        this.updateMainStats();
        this.updateCrisisCards();
        this.updateMap();
        
        // Set up ticker rotation (every 5 seconds)
        setInterval(() => this.updateTicker(), 5000);
        
        // Set up data refresh (every 5 minutes)
        setInterval(async () => {
            await this.updateAllCities();
            this.updateMainStats();
            this.updateCrisisCards();
            this.updateMap();
        }, this.updateInterval);
        
        // Add timestamp display
        const footer = document.querySelector('.data-sources');
        if (footer && !document.getElementById('update-timestamp')) {
            const timestamp = document.createElement('p');
            timestamp.id = 'update-timestamp';
            timestamp.style.cssText = 'color: #00a8ff; margin-top: 20px; font-size: 0.9rem;';
            timestamp.textContent = `Last updated: ${this.lastUpdate.toLocaleString()}`;
            footer.appendChild(timestamp);
            
            // Update timestamp every minute
            setInterval(() => {
                if (this.lastUpdate) {
                    timestamp.textContent = `Last updated: ${this.lastUpdate.toLocaleString()}`;
                }
            }, 60000);
        }
        
        console.log('Water Monitoring System started successfully!');
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    // Hide loading screen faster since we have real data loading
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 1500);
    
    // Start the monitoring system
    window.waterMonitor = new WaterMonitoringSystem();
    window.waterMonitor.start();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterMonitoringSystem;
}