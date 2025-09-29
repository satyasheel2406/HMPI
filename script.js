// HMPI Calculator Application v3.1 (Lazy Init Fix Corrected)
class HMPICalculator {
    constructor() {
        console.log("[v3.1-LazyInitFix] Initializing HMPI Calculator...")

        this.samples = []
        this.currentTheme = "light"
        this.charts = { hmpi: null, metals: null } // Initialize chart properties
        this.chartsInitialized = false;
        this.map = null
        this.markerLayer = null

        // WHO/EPA Standards for heavy metals (mg/L)
        this.standards = {
            cd: 0.003, pb: 0.01, cr: 0.05, ni: 0.07,
            cu: 2.0, zn: 3.0, fe: 0.3, mn: 0.4,
        }

        // Calculate standard unit weights (Wi = 1 / Si)
        this.weights = {};
        for (const metal in this.standards) {
            this.weights[metal] = 1 / this.standards[metal];
        }

        // Metal information for tooltips
        this.metalInfo = {
            cd: { name: "Cadmium", symbol: "Cd", description: "A toxic heavy metal that can cause kidney damage and bone disease.", sources: "Industrial processes, mining, batteries, pigments", healthEffects: "Kidney damage, bone softening, lung damage" },
            pb: { name: "Lead", symbol: "Pb", description: "A neurotoxic metal particularly harmful to children.", sources: "Old pipes, paint, gasoline, industrial processes", healthEffects: "Neurological damage, developmental issues, anemia" },
            cr: { name: "Chromium", symbol: "Cr", description: "Can exist in multiple forms, some more toxic than others.", sources: "Industrial processes, leather tanning, metal plating", healthEffects: "Skin irritation, respiratory problems, cancer risk" },
            ni: { name: "Nickel", symbol: "Ni", description: "Can cause allergic reactions and respiratory issues.", sources: "Industrial processes, mining, electroplating", healthEffects: "Allergic reactions, respiratory problems, cancer risk" },
            cu: { name: "Copper", symbol: "Cu", description: "Essential in small amounts but toxic in high concentrations.", sources: "Pipes, industrial processes, mining", healthEffects: "Gastrointestinal issues, liver damage" },
            zn: { name: "Zinc", symbol: "Zn", description: "Essential nutrient but can be harmful in excess.", sources: "Industrial processes, galvanized pipes, mining", healthEffects: "Nausea, immune system suppression" },
            fe: { name: "Iron", symbol: "Fe", description: "Essential nutrient but can affect taste and appearance of water.", sources: "Natural occurrence, pipes, industrial processes", healthEffects: "Generally not harmful, but can cause staining" },
            mn: { name: "Manganese", symbol: "Mn", description: "Essential in trace amounts but neurotoxic in excess.", sources: "Natural occurrence, industrial processes, mining", healthEffects: "Neurological problems, movement disorders" },
        }

        this.init()
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
          .chart-container { 
              position: relative; 
              min-height: 350px;
          }
          #location-map {
              min-height: 400px;
          }
          .charts-section { 
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
          }
          #results-tbody .btn { 
              padding: 0.25rem 0.5rem; 
              font-size: 0.75rem; 
              white-space: nowrap; 
          }
        `;
        document.head.appendChild(style);
    }

    init() {
        this._injectStyles();
        this.setupEventListeners();
        this.loadTheme();
        this.setupTooltips();
        this.initializeMap();
        console.log("[v3.1-LazyInitFix] HMPI Calculator initialized successfully.");
    }

    setupEventListeners() {
        const themeToggle = document.getElementById("theme-toggle");
        if (themeToggle) themeToggle.addEventListener("click", () => this.toggleTheme());
        const helpBtn = document.getElementById("help-btn");
        if (helpBtn) helpBtn.addEventListener("click", () => this.showModal("help-modal"));
        document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", e => this.switchTab(e.target.dataset.tab)));
        const manualForm = document.getElementById("manual-form");
        if (manualForm) manualForm.addEventListener("submit", e => { e.preventDefault(); this.handleManualSubmit(); });
        const addSampleBtn = document.getElementById("add-sample");
        if (addSampleBtn) addSampleBtn.addEventListener("click", () => this.addSampleToDataset());
        this.setupFileUpload();
        const filterCategory = document.getElementById("filter-category");
        if (filterCategory) filterCategory.addEventListener("change", e => this.filterResults(e.target.value));
        const exportBtn = document.getElementById("export-report");
        if (exportBtn) exportBtn.addEventListener("click", () => this.exportReport());
        document.querySelectorAll(".modal-close").forEach(btn => btn.addEventListener("click", e => this.closeModal(e.target.closest(".modal").id)));
        document.querySelectorAll(".toast-close").forEach(btn => btn.addEventListener("click", e => this.hideToast(e.target.closest(".toast").id)));
        document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", e => { if (e.target === modal) this.closeModal(modal.id); }));
    }

    setupFileUpload() {
        const uploadZone = document.getElementById("upload-zone");
        const fileInput = document.getElementById("file-input");
        if (!uploadZone || !fileInput) return;
        uploadZone.addEventListener("click", () => fileInput.click());
        uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.classList.add("dragover"); });
        uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
        uploadZone.addEventListener("drop", e => {
            e.preventDefault();
            uploadZone.classList.remove("dragover");
            const files = e.dataTransfer.files;
            if (files.length > 0) this.handleFileUpload(files[0]);
        });
        fileInput.addEventListener("change", e => { if (e.target.files.length > 0) this.handleFileUpload(e.target.files[0]); });
    }

    setupTooltips() {
        document.querySelectorAll(".metal-input label").forEach(label => {
            label.addEventListener("click", e => {
                const metalSymbol = e.target.getAttribute("for");
                if (metalSymbol && this.metalInfo[metalSymbol]) this.showMetalInfo(metalSymbol);
            });
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", this.currentTheme);
        localStorage.setItem("hmpi-theme", this.currentTheme);
        const themeIcon = document.querySelector(".theme-icon");
        if (themeIcon) themeIcon.textContent = this.currentTheme === "light" ? "🌙" : "☀️";
        this.updateCharts();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem("hmpi-theme") || "light";
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute("data-theme", savedTheme);
        const themeIcon = document.querySelector(".theme-icon");
        if (themeIcon) themeIcon.textContent = savedTheme === "light" ? "🌙" : "☀️";
    }
switchTab(tabName) {
        document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) activeContent.classList.add("active");

        // --- FINAL CORRECTED LOGIC ---
        // Every time the dashboard becomes visible, redraw the charts.
        // This is the simplest and most reliable way to ensure they are up-to-date.
        if (tabName === 'dashboard') {
            requestAnimationFrame(() => {
                console.log("Updating charts now that the tab is visible...");
                this.updateHMPIChart();
                this.updateMetalsChart();
            });
        }

        if (this.map) {
            setTimeout(() => this.map.invalidateSize(), 10);
        }
    }
    calculateHMPI(metalConcentrations) {
        let numerator = 0;
        let denominator = 0;
        const metalContributions = {};
        for (const [metal, concentration] of Object.entries(metalConcentrations)) {
            if (concentration > 0) {
                const standard = this.standards[metal];
                const weight = this.weights[metal];
                if (standard && weight) {
                    const subIndex = concentration / standard;
                    numerator += subIndex * weight;
                    denominator += weight;
                    metalContributions[metal] = subIndex * 100;
                }
            }
        }
        const hmpi = (denominator > 0) ? (numerator / denominator) : 0;
        return {
            hmpi: Math.round(hmpi * 100) / 100,
            contributions: metalContributions,
            category: this.categorizeHMPI(hmpi * 100),
            dominantMetal: this.findDominantMetal(metalContributions),
        };
    }

    categorizeHMPI(hmpiValue) {
        if (hmpiValue <= 100) return "safe";
        if (hmpiValue <= 200) return "moderate";
        return "hazardous";
    }

    findDominantMetal(contributions) {
        let maxContribution = 0;
        let dominantMetal = "";
        for (const [metal, contribution] of Object.entries(contributions)) {
            if (contribution > maxContribution) {
                maxContribution = contribution;
                dominantMetal = metal.toUpperCase();
            }
        }
        return dominantMetal;
    }

    handleManualSubmit() {
        const formData = new FormData(document.getElementById("manual-form"));
        const metalConcentrations = {};
        ["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].forEach(metal => {
            const value = formData.get(metal);
            metalConcentrations[metal] = value ? parseFloat(value) : 0;
        });
        if (!this.validateMetalData(metalConcentrations)) {
            this.showToast("error", "Please enter valid metal concentrations");
            return;
        }
        const result = this.calculateHMPI(metalConcentrations);
        const sample = {
            id: Date.now(),
            name: formData.get("sampleName") || `Sample ${this.samples.length + 1}`,
            latitude: formData.get("latitude") ? parseFloat(formData.get("latitude")) : null,
            longitude: formData.get("longitude") ? parseFloat(formData.get("longitude")) : null,
            metals: metalConcentrations,
            ...result,
            timestamp: new Date().toISOString(),
        };
        this.samples = [sample];
        this.updateDashboard();
        this.showToast("success", `HMPI calculated: ${Math.round(result.hmpi * 100)} (${result.category.toUpperCase()})`);
    }

    addSampleToDataset() {
        const formData = new FormData(document.getElementById("manual-form"));
        const metalConcentrations = {};
        ["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].forEach(metal => {
            const value = formData.get(metal);
            metalConcentrations[metal] = value ? parseFloat(value) : 0;
        });
        if (!this.validateMetalData(metalConcentrations)) {
            this.showToast("error", "Please enter valid metal concentrations");
            return;
        }
        const result = this.calculateHMPI(metalConcentrations);
        const sample = {
            id: Date.now(),
            name: formData.get("sampleName") || `Sample ${this.samples.length + 1}`,
            latitude: formData.get("latitude") ? parseFloat(formData.get("latitude")) : null,
            longitude: formData.get("longitude") ? parseFloat(formData.get("longitude")) : null,
            metals: metalConcentrations,
            ...result,
            timestamp: new Date().toISOString(),
        };
        this.samples.push(sample);
        this.updateDashboard();
        this.showToast("success", `Sample added (HMPI: ${Math.round(result.hmpi * 100)})`);
        document.getElementById("manual-form").reset();
    }

    validateMetalData(metals) {
        return Object.values(metals).some(value => !isNaN(value) && value > 0);
    }

    async handleFileUpload(file) {
        this.showLoading(true);
        try {
            const text = await this.readFile(file);
            let data;
            if (file.name.endsWith(".csv")) data = this.parseCSV(text);
            else if (file.name.endsWith(".json")) data = JSON.parse(text);
            else throw new Error("Unsupported file format");
            this.processBulkData(data);
            this.showToast("success", `Loaded ${data.length} samples from file`);
        } catch (error) {
            this.showToast("error", `Error loading file: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    parseCSV(text) {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",");
            const sample = {};
            headers.forEach((header, index) => {
                const value = values[index]?.trim();
                if (value) {
                    sample[header] = value;
                }
            });
            if (Object.keys(sample).length > 0) data.push(sample);
        }
        return data;
    }

    processBulkData(data) {
        this.samples = data.map((item, index) => {
            const metalConcentrations = {};
            ["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].forEach(metal => {
                metalConcentrations[metal] = parseFloat(item[metal]) || 0;
            });

            if (!this.validateMetalData(metalConcentrations)) return null;

            const result = this.calculateHMPI(metalConcentrations);
            const latitude = parseFloat(item.latitude);
            const longitude = parseFloat(item.longitude);

            return {
                id: Date.now() + index,
                name: item.name || item.sampleName || `Sample ${index + 1}`,
                latitude: !isNaN(latitude) ? latitude : null,
                longitude: !isNaN(longitude) ? longitude : null,
                metals: metalConcentrations,
                ...result,
                timestamp: new Date().toISOString(),
            };
        }).filter(Boolean);

        this.updateDashboard();
    }

    updateDashboard() {
        this.updateSummaryCards()
        this.updateResultsTable()
        this.updateCharts()
        this.updateMap()
    }

    updateSummaryCards() {
        const safe = this.samples.filter(s => s.category === "safe").length;
        const moderate = this.samples.filter(s => s.category === "moderate").length;
        const hazardous = this.samples.filter(s => s.category === "hazardous").length;
        document.getElementById("safe-count").textContent = safe;
        document.getElementById("moderate-count").textContent = moderate;
        document.getElementById("hazardous-count").textContent = hazardous;
        document.getElementById("total-samples").textContent = this.samples.length;
    }

    updateResultsTable() {
        const tbody = document.getElementById("results-tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        this.samples.forEach(sample => {
            const row = document.createElement("tr");
            const displayHMPI = Math.round(sample.hmpi * 100);
            row.innerHTML = `
              <td>${sample.name}</td>
              <td>${displayHMPI}</td>
              <td><span class="category-badge ${sample.category}">${sample.category}</span></td>
              <td>${sample.latitude != null && sample.longitude != null ? `${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}` : "N/A"}</td>
              <td>${sample.dominantMetal}</td>
              <td>
                <button class="btn btn-outline" onclick="window.hmpiApp.viewSampleDetails(${sample.id})">View</button>
                <button class="btn btn-outline" onclick="window.hmpiApp.deleteSample(${sample.id})">Delete</button>
              </td>
            `;
            tbody.appendChild(row);
        });
    }

updateCharts() {
    const chartCanvas = document.getElementById("hmpi-chart");
    // This check correctly ensures we only try to draw the chart if its container is visible.
    if (chartCanvas && chartCanvas.offsetParent !== null) {
        this.updateHMPIChart();
        this.updateMetalsChart();
    }
    // If the dashboard is not visible, the logic in switchTab() will handle drawing the charts later.
}
    updateHMPIChart() {
        const ctx = document.getElementById("hmpi-chart").getContext("2d");
        if (this.charts.hmpi) {
            this.charts.hmpi.destroy(); // Doughnut charts are simple, destroy/recreate is fine.
        }

        const categories = { safe: 0, moderate: 0, hazardous: 0 };
        this.samples.forEach(sample => categories[sample.category]++);
        const textColor = this.currentTheme === 'dark' ? '#f1f5f9' : '#1e293b';

        this.charts.hmpi = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Safe', 'Moderate', 'Hazardous'],
                datasets: [{
                    data: [categories.safe, categories.moderate, categories.hazardous],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderColor: this.currentTheme === 'dark' ? '#1e293b' : '#ffffff',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: context => `${context.label || ''}: ${context.parsed || 0} samples`
                        }
                    }
                }
            }
        });
    }

    updateMetalsChart() {
        const ctx = document.getElementById("metals-chart").getContext("2d");
        if (!ctx) return;
        
        if (this.samples.length === 0 && this.charts.metals) {
             this.charts.metals.destroy();
             this.charts.metals = null;
             // Re-initialize with empty data if we've cleared it
             // This part can be adjusted based on desired behavior for zero samples
        }
        
        // Always attempt to draw, even with zero samples
        if (this.samples.length === 0 && !this.charts.metals) {
            // No need to return, proceed to draw an empty chart
        }


        const metals = ["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"];
        const minValue = 0.001;

        const averages = metals.map(metal => {
            if (this.samples.length === 0) return minValue; // Handle empty case
            const total = this.samples.reduce((sum, s) => sum + (s.metals[metal] || 0), 0);
            const avg = total / this.samples.length;
            return avg > 0 ? avg : minValue;
        });

        const maxAverage = Math.max(...averages, minValue);
        const maxValue = Math.pow(10, Math.ceil(Math.log10(maxAverage)));

        const textColor = this.currentTheme === 'dark' ? '#f1f5f9' : '#1e293b';
        const gridColor = this.currentTheme === 'dark' ? '#334155' : '#e2e8f0';

        if (this.charts.metals) { // If chart exists, UPDATE it
            this.charts.metals.data.labels = metals.map(m => m.toUpperCase());
            this.charts.metals.data.datasets[0].data = averages;
            this.charts.metals.options.scales.y.max = maxValue;
            this.charts.metals.options.scales.y.ticks.color = textColor;
            this.charts.metals.options.scales.y.grid.color = gridColor;
            this.charts.metals.options.scales.x.ticks.color = textColor;
            this.charts.metals.update();
        } else { // If chart DOESN'T exist, CREATE it
            this.charts.metals = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: metals.map(m => m.toUpperCase()),
                    datasets: [{
                        label: 'Average Concentration (mg/L)',
                        data: averages,
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => `Avg: ${Number(context.raw).toPrecision(3)} mg/L`
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: 'logarithmic',
                            min: minValue,
                            max: maxValue,
                            ticks: {
                                color: textColor,
                                callback: function (value) {
                                    const log10 = Math.log10(value);
                                    if (log10 === Math.floor(log10)) return value;
                                }
                            },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textColor },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }

    initializeMap() {
        if (this.map) return;
        this.map = L.map('location-map', { zoomControl: true, scrollWheelZoom: true }).setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.markerLayer = L.layerGroup().addTo(this.map);
        setTimeout(() => this.map.invalidateSize(), 200);
    }

    updateMap() {
        if (!this.map) return;
        setTimeout(() => this.map.invalidateSize(), 10);

        this.markerLayer.clearLayers();
        const samplesWithCoords = this.samples.filter(s => s.latitude != null && s.longitude != null);

        if (samplesWithCoords.length === 0) {
            this.map.setView([20, 0], 2);
            return;
        }

        const markerBounds = [];
        const categoryColors = { safe: '#10b981', moderate: '#f59e0b', hazardous: '#ef4444' };

        samplesWithCoords.forEach(sample => {
            const color = categoryColors[sample.category];
            const svgIcon = L.divIcon({
                html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="white" stroke-width="1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
                className: 'custom-leaflet-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            });

            const marker = L.marker([sample.latitude, sample.longitude], { icon: svgIcon });
            marker.bindPopup(`<strong>${sample.name}</strong><br>HMPI: ${Math.round(sample.hmpi * 100)} (${sample.category})`);
            this.markerLayer.addLayer(marker);
            markerBounds.push([sample.latitude, sample.longitude]);
        });

        if (markerBounds.length > 1) {
            this.map.fitBounds(markerBounds, { padding: [50, 50] });
        } else if (markerBounds.length === 1) {
            this.map.setView(markerBounds[0], 13);
        }
    }

    filterResults(category) {
        document.querySelectorAll("#results-tbody tr").forEach(row => {
            const badge = row.querySelector(".category-badge");
            row.style.display = (category === "all" || (badge && badge.classList.contains(category))) ? "" : "none";
        });
    }

    viewSampleDetails(sampleId) {
        const sample = this.samples.find(s => s.id === sampleId);
        if (!sample) return;
        document.getElementById("metal-name").textContent = `${sample.name} - Detailed Analysis`;
        const displayHMPI = Math.round(sample.hmpi * 100);
        document.getElementById("metal-info-content").innerHTML = `
          <h4>HMPI Analysis</h4>
          <p><strong>HMPI Value:</strong> ${displayHMPI}</p>
          <p><strong>Category:</strong> <span class="category-badge ${sample.category}">${sample.category}</span></p>
          <p><strong>Dominant Metal:</strong> ${sample.dominantMetal}</p>
          ${sample.latitude != null ? `<p><strong>Location:</strong> ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}</p>` : ""}
          <h4 style="margin-top: 1rem;">Metal Concentrations (mg/L)</h4>
          <table class="results-table" style="margin-top: 0.5rem;">
            <thead><tr><th>Metal</th><th>Concentration</th><th>Standard</th><th>Ratio</th></tr></thead>
            <tbody>
              ${Object.entries(sample.metals).map(([metal, conc]) => `
                <tr>
                  <td>${metal.toUpperCase()}</td>
                  <td>${conc.toFixed(3)}</td>
                  <td>${this.standards[metal]}</td>
                  <td>${(conc / this.standards[metal]).toFixed(2)}</td>
                </tr>`).join("")}
            </tbody>
          </table>`;
        this.showModal("metal-info-modal");
    }

    deleteSample(sampleId) {
        if (window.confirm("Are you sure you want to delete this sample?")) {
            this.samples = this.samples.filter(s => s.id !== sampleId);
            this.updateDashboard();
            this.showToast("success", "Sample deleted successfully");
        }
    }

    exportReport() {
        if (this.samples.length === 0) {
            this.showToast("error", "No data to export");
            return;
        }
        const report = this.generateReport();
        const blob = new Blob([report], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `HMPI_Report_${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast("success", "Report exported successfully");
    }

    generateReport() {
        const safe = this.samples.filter(s => s.category === "safe").length;
        const moderate = this.samples.filter(s => s.category === "moderate").length;
        const hazardous = this.samples.filter(s => s.category === "hazardous").length;
        const total = this.samples.length;
        const avgHMPI = total > 0 ? this.samples.reduce((sum, s) => sum + s.hmpi * 100, 0) / total : 0;

        let report = `HEAVY METAL POLLUTION INDEX (HMPI) ANALYSIS REPORT
Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)

EXECUTIVE SUMMARY
=================
Total Samples Analyzed: ${total}
Average HMPI: ${avgHMPI.toFixed(2)}

Sample Distribution:
- Safe (HMPI ≤ 100): ${safe} samples (${(total > 0 ? safe / total * 100 : 0).toFixed(1)}%)
- Moderate (100 < HMPI ≤ 200): ${moderate} samples (${(total > 0 ? moderate / total * 100 : 0).toFixed(1)}%)
- Hazardous (HMPI > 200): ${hazardous} samples (${(total > 0 ? hazardous / total * 100 : 0).toFixed(1)}%)

DETAILED RESULTS
=================\n`;

        this.samples.forEach((sample, index) => {
            report += `\n---------------------------------\n`;
            report += `Sample #${index + 1}: ${sample.name}\n`;
            report += `HMPI: ${Math.round(sample.hmpi * 100)} (${sample.category.toUpperCase()})\n`;
            report += `Dominant Metal: ${sample.dominantMetal}\n`;
            if (sample.latitude != null) {
                report += `Location: ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}\n`;
            }
            report += `\n  Metal Concentrations (mg/L):\n`;
            report += Object.entries(sample.metals).map(([metal, conc]) =>
                `    - ${metal.toUpperCase()}: ${conc.toFixed(3)} (Standard: ${this.standards[metal]})`
            ).join("\n");
            report += `\n---------------------------------\n`;
        });

        return report;
    }

    showMetalInfo(metalSymbol) {
        const info = this.metalInfo[metalSymbol];
        if (!info) return;
        document.getElementById("metal-name").textContent = `${info.name} (${info.symbol})`;
        document.getElementById("metal-info-content").innerHTML = `
          <p><strong>Description:</strong> ${info.description}</p>
          <p><strong>Common Sources:</strong> ${info.sources}</p>
          <p><strong>Health Effects:</strong> ${info.healthEffects}</p>
          <p><strong>WHO/EPA Standard:</strong> ${this.standards[metalSymbol]} mg/L</p>`;
        this.showModal("metal-info-modal");
    }

    showModal(modalId) { document.getElementById(modalId)?.classList.add("active"); }
    closeModal(modalId) { document.getElementById(modalId)?.classList.remove("active"); }

    showToast(type, message) {
        const toast = document.getElementById(`${type}-toast`);
        if (!toast) return;
        toast.querySelector('span').textContent = message;
        toast.classList.remove("hidden");
        toast.classList.add("show");
        setTimeout(() => this.hideToast(`${type}-toast`), 5000);
    }

    hideToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove("show");
            setTimeout(() => toast.classList.add("hidden"), 300);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) overlay.classList.toggle("hidden", !show);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        window.hmpiApp = new HMPICalculator();
    } catch (error) {
        console.error("[v3.1-LazyInitFix] Error initializing HMPI Calculator:", error);
        document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: #ef4444;"><h1>Application Error</h1><p>Failed to initialize HMPI Calculator: ${error.message}</p></div>`;
    }
});

window.addEventListener("error", (event) => console.error("[v3.1-LazyInitFix] Uncaught error:", event.error));
window.addEventListener("unhandledrejection", (event) => console.error("[v3.1-LazyInitFix] Unhandled promise rejection:", event.reason));