// display-real-data.js - Connect real data to your website

// Function to update the stats cards with real data
async function updateWithRealData() {
    console.log('📡 Updating website with REAL satellite data...');
    
    // Fetch real data for Lake Chad
    const lakeChadData = await fetchNASAPowerData(13.5, 14.5);
    
    // Fetch real data for Albuquerque (your location!)
    const albuquerqueData = await fetchNASAPowerData(35.0844, -106.6504);
    
    // Fetch USGS Rio Grande data
    const rioGrandeData = await fetchUSGSWaterData();
    
    // Update the stat cards with REAL data
    if (lakeChadData) {
        // Update first card with Lake Chad precipitation
        document.getElementById('groundwater-stat').innerHTML = 
            `${lakeChadData.precipitation.toFixed(2)} mm`;
        document.querySelector('.stat-card:first-child .stat-label').innerHTML = 
            'Lake Chad Daily Precipitation (NASA Satellite)';
    }
    
    if (albuquerqueData) {
        // Update second card with Albuquerque soil moisture
        document.getElementById('affected-stat').innerHTML = 
            `${(albuquerqueData.rootMoisture * 100).toFixed(1)}%`;
        document.querySelector('.stat-card:nth-child(2) .stat-label').innerHTML = 
            'Albuquerque Soil Moisture (Live Satellite)';
    }
    
    if (rioGrandeData) {
        // Update third card with Rio Grande water level
        document.getElementById('lakes-stat').innerHTML = 
            `${parseFloat(rioGrandeData.waterLevel).toFixed(2)} ft`;
        document.querySelector('.stat-card:nth-child(3) .stat-label').innerHTML = 
            'Rio Grande Water Level (Real-time USGS)';
    }
    
    // Update the water fact with real data insight
    const factElement = document.getElementById('fact-text');
    factElement.innerHTML = `
        🛰️ LIVE DATA: Right now, Lake Chad has ${lakeChadData ? lakeChadData.precipitation.toFixed(2) : 'N/A'} mm 
        of daily precipitation, while Albuquerque's soil moisture is at 
        ${albuquerqueData ? (albuquerqueData.rootMoisture * 100).toFixed(1) : 'N/A'}%. 
        The Rio Grande in your city is currently at ${rioGrandeData ? parseFloat(rioGrandeData.waterLevel).toFixed(2) : 'N/A'} feet. 
        This data was collected by NASA satellites and USGS sensors in the last 24 hours!
    `;
    
    // Add a live data indicator
    const header = document.querySelector('header');
    if (!document.getElementById('live-badge')) {
        const liveBadge = document.createElement('div');
        liveBadge.id = 'live-badge';
        liveBadge.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: #00ff00;
            color: #000;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            animation: pulse 2s infinite;
        `;
        liveBadge.innerHTML = '🔴 LIVE SATELLITE DATA';
        header.style.position = 'relative';
        header.appendChild(liveBadge);
    }
    
    console.log('✅ Website updated with real data!');
}

// Function to create a real-time data dashboard
function createDataDashboard() {
    // Create a new section for real-time data
    const dashboard = document.createElement('div');
    dashboard.id = 'real-data-dashboard';
    dashboard.style.cssText = `
        background: rgba(0, 0, 0, 0.3);
        border-radius: 15px;
        padding: 30px;
        margin: 40px 0;
        backdrop-filter: blur(10px);
    `;
    
    dashboard.innerHTML = `
        <h2 style="text-align: center; color: #ffd700; margin-bottom: 20px;">
            🛰️ Real-Time Water Data Dashboard
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div class="data-source-card" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h3 style="color: #ffd700;">NASA POWER Satellite</h3>
                <p>Global precipitation, soil moisture, and evapotranspiration data</p>
                <small>Updated: Daily</small>
            </div>
            <div class="data-source-card" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h3 style="color: #ffd700;">USGS Water Services</h3>
                <p>Real-time water levels from 1.5 million monitoring sites</p>
                <small>Updated: Every 15 minutes</small>
            </div>
            <div class="data-source-card" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h3 style="color: #ffd700;">GRACE-FO Mission</h3>
                <p>Groundwater changes detected by gravity measurements</p>
                <small>Updated: Monthly</small>
            </div>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button onclick="updateWithRealData()" style="
                padding: 15px 30px;
                background: linear-gradient(135deg, #00ff00 0%, #00aa00 100%);
                color: white;
                border: none;
                border-radius: 50px;
                font-size: 1.1em;
                font-weight: 600;
                cursor: pointer;
            ">
                🔄 Refresh Live Data
            </button>
        </div>
    `;
    
    // Insert after the stats grid
    const statsGrid = document.querySelector('.stats-grid');
    statsGrid.parentNode.insertBefore(dashboard, statsGrid.nextSibling);
}

// Auto-update data when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        createDataDashboard();
        updateWithRealData();
        
        // Auto-refresh every 5 minutes
        setInterval(updateWithRealData, 5 * 60 * 1000);
    }, 2000);
});

console.log('📊 Real Data Display Module Loaded!');
console.log('Data will auto-update on page load and every 5 minutes');