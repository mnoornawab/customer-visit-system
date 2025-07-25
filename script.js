// Configuration
const API_URL = "YOUR_DEPLOYED_WEB_APP_URL";

// DOM Elements
const elements = {
  salesRep: document.getElementById('salesRep'),
  area: document.getElementById('area'),
  customer: document.getElementById('customer'),
  customerInfo: document.getElementById('customerInfo'),
  brandTableBody: document.getElementById('brandTableBody'),
  visitForm: document.getElementById('visitForm'),
  addBrand: document.getElementById('addBrand')
};

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
  loadSalesReps();
  
  // Event listeners
  elements.salesRep.addEventListener('change', loadAreas);
  elements.area.addEventListener('change', loadCustomers);
  elements.addBrand.addEventListener('click', addBrandRow);
  elements.visitForm.addEventListener('submit', submitVisit);
});

// Load sales representatives
async function loadSalesReps() {
  try {
    const response = await fetch(`${API_URL}?action=getSalesReps`);
    const reps = await response.json();
    
    elements.salesRep.innerHTML = '<option value="">-- Select Rep --</option>';
    reps.forEach(rep => {
      const option = document.createElement('option');
      option.value = rep[0]; // Assuming first column is name
      option.textContent = rep[0];
      elements.salesRep.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading sales reps:", error);
  }
}

// Load areas for selected rep
async function loadAreas() {
  const rep = this.value;
  elements.area.disabled = !rep;
  elements.customer.disabled = true;
  elements.area.innerHTML = '<option value="">-- Select Area --</option>';
  elements.customer.innerHTML = '<option value="">-- Select Customer --</option>';
  elements.customerInfo.innerHTML = '<p>Last Visit: <span id="lastVisitDate">Never</span></p>';
  
  if (!rep) return;
  
  try {
    const response = await fetch(`${API_URL}?action=getAreasByRep&rep=${encodeURIComponent(rep)}`);
    const areas = await response.json();
    
    areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      elements.area.appendChild(option);
    });
    
    elements.area.disabled = false;
  } catch (error) {
    console.error("Error loading areas:", error);
  }
}

// Load customers for selected area
async function loadCustomers() {
  const rep = elements.salesRep.value;
  const area = this.value;
  elements.customer.disabled = !area;
  elements.customer.innerHTML = '<option value="">-- Select Customer --</option>';
  elements.customerInfo.innerHTML = '<p>Last Visit: <span id="lastVisitDate">Never</span></p>';
  
  if (!area) return;
  
  try {
    const response = await fetch(`${API_URL}?action=getCustomersByArea&rep=${encodeURIComponent(rep)}&area=${encodeURIComponent(area)}`);
    const customers = await response.json();
    
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.tradingName;
      option.textContent = customer.tradingName;
      option.dataset.lastVisit = customer.lastVisit;
      elements.customer.appendChild(option);
    });
    
    elements.customer.disabled = false;
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

// Show customer details when selected
elements.customer.addEventListener('change', function() {
  const selected = this.options[this.selectedIndex];
  document.getElementById('lastVisitDate').textContent = selected.dataset.lastVisit || "Never";
});

// Add brand/unit row
async function addBrandRow() {
  try {
    const response = await fetch(`${API_URL}?action=getBrands`);
    const brands = await response.json();
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select class="brand-select" required>
          <option value="">-- Select Brand --</option>
          ${brands.map(brand => 
            `<option value="${brand.id}" data-category="${brand.category}">${brand.name}</option>`
          ).join('')}
        </select>
      </td>
      <td class="brand-category"></td>
      <td><input type="number" class="units-input" min="0" required></td>
      <td><button type="button" class="remove-btn">✕</button></td>
    `;
    
    elements.brandTableBody.appendChild(row);
    
    // Update category when brand changes
    row.querySelector('.brand-select').addEventListener('change', function() {
      const selected = this.options[this.selectedIndex];
      row.querySelector('.brand-category').textContent = selected.dataset.category || '';
    });
    
    // Remove button
    row.querySelector('.remove-btn').addEventListener('click', () => {
      row.remove();
    });
  } catch (error) {
    console.error("Error loading brands:", error);
  }
}

// Submit visit form
async function submitVisit(event) {
  event.preventDefault();
  
  const formData = {
    salesRep: elements.salesRep.value,
    area: elements.area.value,
    customer: elements.customer.value,
    notes: document.getElementById('notes').value,
    brands: []
  };
  
  // Collect brand data
  document.querySelectorAll('#brandTableBody tr').forEach(row => {
    formData.brands.push({
      id: row.querySelector('.brand-select').value,
      name: row.querySelector('.brand-select option:checked').textContent,
      category: row.querySelector('.brand-select option:checked').dataset.category,
      units: row.querySelector('.units-input').value
    });
  });
  
  // Validate
  if (formData.brands.length === 0) {
    alert("Please add at least one brand");
    return;
  }
  
  // Submit to Google Sheets
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=saveVisit&data=${JSON.stringify(formData)}`
    });
    
    const result = await response.text();
    alert(result);
    elements.visitForm.reset();
    elements.brandTableBody.innerHTML = '';
    elements.customerInfo.innerHTML = '<p>Last Visit: <span id="lastVisitDate">Never</span></p>';
  } catch (error) {
    console.error("Error submitting visit:", error);
    alert("Failed to save visit. Please check console for details.");
  }
}
