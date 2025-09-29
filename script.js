// HMPI Calculator Application
class HMPICalculator {
  constructor() {
    console.log("[v0] Initializing HMPI Calculator...")

    this.samples = []
    this.currentTheme = "light"
    this.charts = {}

    // WHO/EPA Standards for heavy metals (mg/L)
    this.standards = {
      cd: 0.003, // Cadmium
      pb: 0.01, // Lead
      cr: 0.05, // Chromium
      ni: 0.07, // Nickel
      cu: 2.0, // Copper
      zn: 3.0, // Zinc
      fe: 0.3, // Iron
      mn: 0.4, // Manganese
    }

    // Metal information for tooltips
    this.metalInfo = {
      cd: {
        name: "Cadmium",
        symbol: "Cd",
        description: "A toxic heavy metal that can cause kidney damage and bone disease.",
        sources: "Industrial processes, mining, batteries, pigments",
        healthEffects: "Kidney damage, bone softening, lung damage",
      },
      pb: {
        name: "Lead",
        symbol: "Pb",
        description: "A neurotoxic metal particularly harmful to children.",
        sources: "Old pipes, paint, gasoline, industrial processes",
        healthEffects: "Neurological damage, developmental issues, anemia",
      },
      cr: {
        name: "Chromium",
        symbol: "Cr",
        description: "Can exist in multiple forms, some more toxic than others.",
        sources: "Industrial processes, leather tanning, metal plating",
        healthEffects: "Skin irritation, respiratory problems, cancer risk",
      },
      ni: {
        name: "Nickel",
        symbol: "Ni",
        description: "Can cause allergic reactions and respiratory issues.",
        sources: "Industrial processes, mining, electroplating",
        healthEffects: "Allergic reactions, respiratory problems, cancer risk",
      },
      cu: {
        name: "Copper",
        symbol: "Cu",
        description: "Essential in small amounts but toxic in high concentrations.",
        sources: "Pipes, industrial processes, mining",
        healthEffects: "Gastrointestinal issues, liver damage",
      },
      zn: {
        name: "Zinc",
        symbol: "Zn",
        description: "Essential nutrient but can be harmful in excess.",
        sources: "Industrial processes, galvanized pipes, mining",
        healthEffects: "Nausea, immune system suppression",
      },
      fe: {
        name: "Iron",
        symbol: "Fe",
        description: "Essential nutrient but can affect taste and appearance of water.",
        sources: "Natural occurrence, pipes, industrial processes",
        healthEffects: "Generally not harmful, but can cause staining",
      },
      mn: {
        name: "Manganese",
        symbol: "Mn",
        description: "Essential in trace amounts but neurotoxic in excess.",
        sources: "Natural occurrence, industrial processes, mining",
        healthEffects: "Neurological problems, movement disorders",
      },
    }

    this.init()
  }

  init() {
    console.log("[v0] Setting up event listeners...")
    this.setupEventListeners()
    this.loadTheme()
    this.setupTooltips()
    console.log("[v0] HMPI Calculator initialized successfully")
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle")
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme())
    }

    // Help modal
    const helpBtn = document.getElementById("help-btn")
    if (helpBtn) {
      helpBtn.addEventListener("click", () => this.showModal("help-modal"))
    }

    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Manual form submission
    const manualForm = document.getElementById("manual-form")
    if (manualForm) {
      manualForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleManualSubmit()
      })
    }

    // Add sample button
    const addSampleBtn = document.getElementById("add-sample")
    if (addSampleBtn) {
      addSampleBtn.addEventListener("click", () => this.addSampleToDataset())
    }

    // File upload
    this.setupFileUpload()

    // Filter dropdown
    const filterCategory = document.getElementById("filter-category")
    if (filterCategory) {
      filterCategory.addEventListener("change", (e) => {
        this.filterResults(e.target.value)
      })
    }

    // Export report
    const exportBtn = document.getElementById("export-report")
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportReport())
    }

    // Modal close buttons
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.closeModal(e.target.closest(".modal").id)
      })
    })

    // Toast close buttons
    document.querySelectorAll(".toast-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.hideToast(e.target.closest(".toast").id)
      })
    })

    // Click outside modal to close
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id)
        }
      })
    })
  }

  setupFileUpload() {
    const uploadZone = document.getElementById("upload-zone")
    const fileInput = document.getElementById("file-input")

    if (!uploadZone || !fileInput) return

    uploadZone.addEventListener("click", () => {
      fileInput.click()
    })

    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      uploadZone.classList.add("dragover")
    })

    uploadZone.addEventListener("dragleave", () => {
      uploadZone.classList.remove("dragover")
    })

    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault()
      uploadZone.classList.remove("dragover")
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.handleFileUpload(files[0])
      }
    })

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0])
      }
    })
  }

  setupTooltips() {
    // Add click listeners to metal labels for information
    document.querySelectorAll(".metal-input label").forEach((label) => {
      label.addEventListener("click", (e) => {
        const metalSymbol = e.target.getAttribute("for")
        if (metalSymbol && this.metalInfo[metalSymbol]) {
          this.showMetalInfo(metalSymbol)
        }
      })
    })
  }

  // Theme Management
  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light"
    document.documentElement.setAttribute("data-theme", this.currentTheme)
    localStorage.setItem("hmpi-theme", this.currentTheme)

    const themeIcon = document.querySelector(".theme-icon")
    if (themeIcon) {
      themeIcon.textContent = this.currentTheme === "light" ? "🌙" : "☀️"
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem("hmpi-theme") || "light"
    this.currentTheme = savedTheme
    document.documentElement.setAttribute("data-theme", savedTheme)

    const themeIcon = document.querySelector(".theme-icon")
    if (themeIcon) {
      themeIcon.textContent = savedTheme === "light" ? "🌙" : "☀️"
    }
  }

  // Tab Management
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`)
    if (activeTab) {
      activeTab.classList.add("active")
    }

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    const activeContent = document.getElementById(`${tabName}-tab`)
    if (activeContent) {
      activeContent.classList.add("active")
    }
  }

  // HMPI Calculation Core
  calculateHMPI(metalConcentrations) {
    let hmpi = 0
    let validMetals = 0
    const metalContributions = {}

    // Calculate individual metal contributions
    for (const [metal, concentration] of Object.entries(metalConcentrations)) {
      if (concentration !== null && concentration !== undefined && concentration >= 0) {
        const standard = this.standards[metal]
        if (standard) {
          const contribution = (concentration / standard) * 100
          metalContributions[metal] = contribution
          hmpi += contribution
          validMetals++
        }
      }
    }

    // Calculate average HMPI
    if (validMetals > 0) {
      hmpi = hmpi / validMetals
    }

    return {
      hmpi: Math.round(hmpi * 100) / 100,
      contributions: metalContributions,
      category: this.categorizeHMPI(hmpi),
      dominantMetal: this.findDominantMetal(metalContributions),
    }
  }

  categorizeHMPI(hmpi) {
    if (hmpi <= 100) return "safe"
    if (hmpi <= 200) return "moderate"
    return "hazardous"
  }

  findDominantMetal(contributions) {
    let maxContribution = 0
    let dominantMetal = ""

    for (const [metal, contribution] of Object.entries(contributions)) {
      if (contribution > maxContribution) {
        maxContribution = contribution
        dominantMetal = metal.toUpperCase()
      }
    }

    return dominantMetal
  }

  // Form Handling
  handleManualSubmit() {
    const formData = new FormData(document.getElementById("manual-form"))
    const metalConcentrations = {}

    // Extract metal concentrations
    ;["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].forEach((metal) => {
      const value = formData.get(metal)
      metalConcentrations[metal] = value ? Number.parseFloat(value) : 0
    })

    // Validate input
    if (!this.validateMetalData(metalConcentrations)) {
      this.showToast("error", "Please enter valid metal concentrations")
      return
    }

    // Calculate HMPI
    const result = this.calculateHMPI(metalConcentrations)

    // Create sample object
    const sample = {
      id: Date.now(),
      name: formData.get("sampleName") || `Sample ${this.samples.length + 1}`,
      latitude: formData.get("latitude") ? Number.parseFloat(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number.parseFloat(formData.get("longitude")) : null,
      metals: metalConcentrations,
      ...result,
      timestamp: new Date().toISOString(),
    }

    // Clear existing samples for single calculation
    this.samples = [sample]
    this.updateDashboard()
    this.showToast("success", `HMPI calculated: ${result.hmpi} (${result.category.toUpperCase()})`)
  }

  addSampleToDataset() {
    const formData = new FormData(document.getElementById("manual-form"))
    const metalConcentrations = {}

    // Extract metal concentrations
    ;["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].forEach((metal) => {
      const value = formData.get(metal)
      metalConcentrations[metal] = value ? Number.parseFloat(value) : 0
    })

    // Validate input
    if (!this.validateMetalData(metalConcentrations)) {
      this.showToast("error", "Please enter valid metal concentrations")
      return
    }

    // Calculate HMPI
    const result = this.calculateHMPI(metalConcentrations)

    // Create sample object
    const sample = {
      id: Date.now(),
      name: formData.get("sampleName") || `Sample ${this.samples.length + 1}`,
      latitude: formData.get("latitude") ? Number.parseFloat(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number.parseFloat(formData.get("longitude")) : null,
      metals: metalConcentrations,
      ...result,
      timestamp: new Date().toISOString(),
    }

    // Add to dataset
    this.samples.push(sample)
    this.updateDashboard()
    this.showToast("success", `Sample added to dataset (HMPI: ${result.hmpi})`)

    // Clear form
    document.getElementById("manual-form").reset()
  }

  validateMetalData(metals) {
    // Check if at least one metal has a valid value
    return Object.values(metals).some((value) => value > 0)
  }

  // File Handling
  async handleFileUpload(file) {
    this.showLoading(true)

    try {
      const text = await this.readFile(file)
      let data

      if (file.name.endsWith(".csv")) {
        data = this.parseCSV(text)
      } else if (file.name.endsWith(".json")) {
        data = JSON.parse(text)
      } else {
        throw new Error("Unsupported file format")
      }

      this.processBulkData(data)
      this.showToast("success", `Loaded ${data.length} samples from file`)
    } catch (error) {
      this.showToast("error", `Error loading file: ${error.message}`)
    } finally {
      this.showLoading(false)
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  parseCSV(text) {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",")
      const sample = {}

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (value) {
          if (["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].includes(header)) {
            sample[header] = Number.parseFloat(value)
          } else if (header === "latitude" || header === "longitude") {
            sample[header] = Number.parseFloat(value)
          } else {
            sample[header] = value
          }
        }
      })

      if (Object.keys(sample).length > 0) {
        data.push(sample)
      }
    }

    return data
  }

  processBulkData(data) {
    this.samples = []

    data.forEach((item, index) => {
      const metalConcentrations = {}
      ;["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"].forEach((metal) => {
        metalConcentrations[metal] = item[metal] || 0
      })

      if (this.validateMetalData(metalConcentrations)) {
        const result = this.calculateHMPI(metalConcentrations)

        const sample = {
          id: Date.now() + index,
          name: item.name || item.sampleName || `Sample ${index + 1}`,
          latitude: item.latitude || null,
          longitude: item.longitude || null,
          metals: metalConcentrations,
          ...result,
          timestamp: new Date().toISOString(),
        }

        this.samples.push(sample)
      }
    })

    this.updateDashboard()
  }

  // Dashboard Updates
  updateDashboard() {
    this.updateSummaryCards()
    this.updateResultsTable()
    this.updateCharts()
    this.updateMap()
  }

  updateSummaryCards() {
    const safe = this.samples.filter((s) => s.category === "safe").length
    const moderate = this.samples.filter((s) => s.category === "moderate").length
    const hazardous = this.samples.filter((s) => s.category === "hazardous").length
    const total = this.samples.length

    const safeCount = document.getElementById("safe-count")
    const moderateCount = document.getElementById("moderate-count")
    const hazardousCount = document.getElementById("hazardous-count")
    const totalSamples = document.getElementById("total-samples")

    if (safeCount) safeCount.textContent = safe
    if (moderateCount) moderateCount.textContent = moderate
    if (hazardousCount) hazardousCount.textContent = hazardous
    if (totalSamples) totalSamples.textContent = total
  }

  updateResultsTable() {
    const tbody = document.getElementById("results-tbody")
    if (!tbody) return

    tbody.innerHTML = ""

    this.samples.forEach((sample) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${sample.name}</td>
        <td>${sample.hmpi}</td>
        <td><span class="category-badge ${sample.category}">${sample.category}</span></td>
        <td>${sample.latitude && sample.longitude ? `${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}` : "N/A"}</td>
        <td>${sample.dominantMetal}</td>
        <td>
          <button class="btn btn-outline" onclick="window.hmpiApp.viewSampleDetails(${sample.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">View</button>
          <button class="btn btn-outline" onclick="window.hmpiApp.deleteSample(${sample.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.25rem;">Delete</button>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  // Chart Generation
  updateCharts() {
    this.drawHMPIChart()
    this.drawMetalsChart()
  }

  drawHMPIChart() {
    const canvas = document.getElementById("hmpi-chart")
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (this.samples.length === 0) {
      ctx.fillStyle = "#64748b"
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("No data available", canvas.width / 2, canvas.height / 2)
      return
    }

    // Count samples by category
    const categories = { safe: 0, moderate: 0, hazardous: 0 }
    this.samples.forEach((sample) => {
      categories[sample.category]++
    })

    // Draw pie chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    const colors = {
      safe: "#10b981",
      moderate: "#f59e0b",
      hazardous: "#ef4444",
    }

    let currentAngle = -Math.PI / 2
    const total = this.samples.length

    Object.entries(categories).forEach(([category, count]) => {
      if (count > 0) {
        const sliceAngle = (count / total) * 2 * Math.PI

        // Draw slice
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.closePath()
        ctx.fillStyle = colors[category]
        ctx.fill()

        // Draw label
        const labelAngle = currentAngle + sliceAngle / 2
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)

        ctx.fillStyle = "white"
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(count.toString(), labelX, labelY)

        currentAngle += sliceAngle
      }
    })

    // Draw legend
    let legendY = 20
    Object.entries(categories).forEach(([category, count]) => {
      if (count > 0) {
        ctx.fillStyle = colors[category]
        ctx.fillRect(20, legendY, 15, 15)

        ctx.fillStyle = "#1e293b"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "left"
        ctx.fillText(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${count}`, 40, legendY + 12)

        legendY += 25
      }
    })
  }

  drawMetalsChart() {
    const canvas = document.getElementById("metals-chart")
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (this.samples.length === 0) {
      ctx.fillStyle = "#64748b"
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("No data available", canvas.width / 2, canvas.height / 2)
      return
    }

    // Calculate average concentrations
    const metals = ["cd", "pb", "cr", "ni", "cu", "zn", "fe", "mn"]
    const averages = {}

    metals.forEach((metal) => {
      const total = this.samples.reduce((sum, sample) => sum + (sample.metals[metal] || 0), 0)
      averages[metal] = total / this.samples.length
    })

    // Draw bar chart
    const margin = 40
    const chartWidth = canvas.width - 2 * margin
    const chartHeight = canvas.height - 2 * margin
    const barWidth = chartWidth / metals.length
    const maxValue = Math.max(...Object.values(averages))

    if (maxValue === 0) return

    metals.forEach((metal, index) => {
      const barHeight = (averages[metal] / maxValue) * chartHeight
      const x = margin + index * barWidth
      const y = canvas.height - margin - barHeight

      // Draw bar
      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight)

      // Draw label
      ctx.fillStyle = "#1e293b"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(metal.toUpperCase(), x + barWidth / 2, canvas.height - 10)

      // Draw value
      ctx.fillText(averages[metal].toFixed(3), x + barWidth / 2, y - 5)
    })

    // Draw axes
    ctx.strokeStyle = "#64748b"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, margin)
    ctx.lineTo(margin, canvas.height - margin)
    ctx.lineTo(canvas.width - margin, canvas.height - margin)
    ctx.stroke()
  }

  // Map Visualization
  updateMap() {
    const canvas = document.getElementById("location-map")
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Filter samples with coordinates
    const samplesWithCoords = this.samples.filter((s) => s.latitude && s.longitude)

    if (samplesWithCoords.length === 0) {
      ctx.fillStyle = "#64748b"
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("No location data available", canvas.width / 2, canvas.height / 2)
      return
    }

    // Find bounds
    const lats = samplesWithCoords.map((s) => s.latitude)
    const lngs = samplesWithCoords.map((s) => s.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    // Add padding
    const latRange = maxLat - minLat || 1
    const lngRange = maxLng - minLng || 1
    const padding = 0.1

    const bounds = {
      minLat: minLat - latRange * padding,
      maxLat: maxLat + latRange * padding,
      minLng: minLng - lngRange * padding,
      maxLng: maxLng + lngRange * padding,
    }

    // Draw background
    ctx.fillStyle = "#f0f9ff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#e0e7ff"
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = (canvas.width / 10) * i
      const y = (canvas.height / 10) * i

      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Plot samples
    const colors = {
      safe: "#10b981",
      moderate: "#f59e0b",
      hazardous: "#ef4444",
    }

    samplesWithCoords.forEach((sample) => {
      const x = ((sample.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * canvas.width
      const y = canvas.height - ((sample.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * canvas.height

      // Draw point
      ctx.fillStyle = colors[sample.category]
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "#1e293b"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(sample.name, x, y - 12)
    })
  }

  // Utility Functions
  filterResults(category) {
    const rows = document.querySelectorAll("#results-tbody tr")

    rows.forEach((row) => {
      if (category === "all") {
        row.style.display = ""
      } else {
        const badge = row.querySelector(".category-badge")
        if (badge && badge.classList.contains(category)) {
          row.style.display = ""
        } else {
          row.style.display = "none"
        }
      }
    })
  }

  viewSampleDetails(sampleId) {
    const sample = this.samples.find((s) => s.id === sampleId)
    if (!sample) return

    const modal = document.getElementById("metal-info-modal")
    const title = document.getElementById("metal-name")
    const content = document.getElementById("metal-info-content")

    if (!modal || !title || !content) return

    title.textContent = `${sample.name} - Detailed Analysis`

    content.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <h4>HMPI Analysis</h4>
        <p><strong>HMPI Value:</strong> ${sample.hmpi}</p>
        <p><strong>Category:</strong> <span class="category-badge ${sample.category}">${sample.category}</span></p>
        <p><strong>Dominant Metal:</strong> ${sample.dominantMetal}</p>
        ${sample.latitude && sample.longitude ? `<p><strong>Location:</strong> ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}</p>` : ""}
      </div>
      
      <div style="margin-bottom: 1rem;">
        <h4>Metal Concentrations</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <th style="text-align: left; padding: 0.5rem;">Metal</th>
              <th style="text-align: right; padding: 0.5rem;">Concentration (mg/L)</th>
              <th style="text-align: right; padding: 0.5rem;">Standard</th>
              <th style="text-align: right; padding: 0.5rem;">Ratio</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(sample.metals)
              .map(
                ([metal, concentration]) => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.5rem;">${metal.toUpperCase()}</td>
                <td style="text-align: right; padding: 0.5rem;">${concentration.toFixed(3)}</td>
                <td style="text-align: right; padding: 0.5rem;">${this.standards[metal]}</td>
                <td style="text-align: right; padding: 0.5rem;">${(concentration / this.standards[metal]).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <div>
        <h4>Individual Contributions</h4>
        ${Object.entries(sample.contributions)
          .map(
            ([metal, contribution]) => `
          <p><strong>${metal.toUpperCase()}:</strong> ${contribution.toFixed(2)}%</p>
        `,
          )
          .join("")}
      </div>
    `

    this.showModal("metal-info-modal")
  }

  deleteSample(sampleId) {
    if (confirm("Are you sure you want to delete this sample?")) {
      this.samples = this.samples.filter((s) => s.id !== sampleId)
      this.updateDashboard()
      this.showToast("success", "Sample deleted successfully")
    }
  }

  exportReport() {
    if (this.samples.length === 0) {
      this.showToast("error", "No data to export")
      return
    }

    const report = this.generateReport()
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `HMPI_Report_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.showToast("success", "Report exported successfully")
  }

  generateReport() {
    const safe = this.samples.filter((s) => s.category === "safe").length
    const moderate = this.samples.filter((s) => s.category === "moderate").length
    const hazardous = this.samples.filter((s) => s.category === "hazardous").length
    const avgHMPI = this.samples.reduce((sum, s) => sum + s.hmpi, 0) / this.samples.length

    let report = `HEAVY METAL POLLUTION INDEX (HMPI) ANALYSIS REPORT
Generated on: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
================
Total Samples Analyzed: ${this.samples.length}
Average HMPI: ${avgHMPI.toFixed(2)}

Sample Distribution:
- Safe (HMPI ≤ 100): ${safe} samples (${((safe / this.samples.length) * 100).toFixed(1)}%)
- Moderate Risk (100 < HMPI ≤ 200): ${moderate} samples (${((moderate / this.samples.length) * 100).toFixed(1)}%)
- Hazardous (HMPI > 200): ${hazardous} samples (${((hazardous / this.samples.length) * 100).toFixed(1)}%)

DETAILED RESULTS
===============
`

    this.samples.forEach((sample, index) => {
      report += `
Sample ${index + 1}: ${sample.name}
HMPI: ${sample.hmpi} (${sample.category.toUpperCase()})
Dominant Metal: ${sample.dominantMetal}
${sample.latitude && sample.longitude ? `Location: ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}` : "Location: Not specified"}

Metal Concentrations (mg/L):
${Object.entries(sample.metals)
  .map(
    ([metal, conc]) =>
      `  ${metal.toUpperCase()}: ${conc.toFixed(3)} (Standard: ${this.standards[metal]}, Ratio: ${(conc / this.standards[metal]).toFixed(2)})`,
  )
  .join("\n")}

Individual Contributions (%):
${Object.entries(sample.contributions)
  .map(([metal, contrib]) => `  ${metal.toUpperCase()}: ${contrib.toFixed(2)}%`)
  .join("\n")}
`
    })

    report += `

RECOMMENDATIONS
==============
`

    if (hazardous > 0) {
      report += `- URGENT: ${hazardous} sample(s) show hazardous pollution levels requiring immediate attention\n`
    }
    if (moderate > 0) {
      report += `- ${moderate} sample(s) require treatment before consumption\n`
    }
    if (safe > 0) {
      report += `- ${safe} sample(s) are within safe limits for consumption\n`
    }

    report += `
- Regular monitoring is recommended for all water sources
- Consider source protection measures for contaminated areas
- Implement appropriate treatment technologies where needed

This report was generated by the HMPI Calculator Tool.
For questions or additional analysis, consult with water quality professionals.`

    return report
  }

  showMetalInfo(metalSymbol) {
    const info = this.metalInfo[metalSymbol]
    if (!info) return

    const modal = document.getElementById("metal-info-modal")
    const title = document.getElementById("metal-name")
    const content = document.getElementById("metal-info-content")

    if (!modal || !title || !content) return

    title.textContent = `${info.name} (${info.symbol})`
    content.innerHTML = `
      <p><strong>Description:</strong> ${info.description}</p>
      <p><strong>Common Sources:</strong> ${info.sources}</p>
      <p><strong>Health Effects:</strong> ${info.healthEffects}</p>
      <p><strong>WHO/EPA Standard:</strong> ${this.standards[metalSymbol]} mg/L</p>
    `

    this.showModal("metal-info-modal")
  }

  // UI Helper Functions
  showModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add("active")
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.remove("active")
    }
  }

  showToast(type, message) {
    const toast = document.getElementById(`${type}-toast`)
    const messageElement = document.getElementById(`${type}-message`)

    if (!toast || !messageElement) return

    messageElement.textContent = message
    toast.classList.remove("hidden")
    toast.classList.add("show")

    setTimeout(() => {
      this.hideToast(`${type}-toast`)
    }, 5000)
  }

  hideToast(toastId) {
    const toast = document.getElementById(toastId)
    if (toast) {
      toast.classList.remove("show")
      setTimeout(() => {
        toast.classList.add("hidden")
      }, 300)
    }
  }

  showLoading(show) {
    const overlay = document.getElementById("loading-overlay")
    if (overlay) {
      if (show) {
        overlay.classList.remove("hidden")
      } else {
        overlay.classList.add("hidden")
      }
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM loaded, initializing HMPI Calculator...")

  try {
    window.hmpiApp = new HMPICalculator()
    console.log("[v0] HMPI Calculator initialized successfully")
  } catch (error) {
    console.error("[v0] Error initializing HMPI Calculator:", error)

    // Show error message to user
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #ef4444;">
        <h1>Application Error</h1>
        <p>Failed to initialize HMPI Calculator: ${error.message}</p>
        <p>Please check the browser console for more details.</p>
      </div>
    `
  }
})

// Add error handlers
window.addEventListener("error", (event) => {
  console.error("[v0] Uncaught error:", event.error)
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("[v0] Unhandled promise rejection:", event.reason)
})
