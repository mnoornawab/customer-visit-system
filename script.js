// Configuration
const API_URL = "YOUR_DEPLOYED_WEB_APP_URL";

// DOM Elements
const elements = {
  salesRep: document.getElementById('salesRep'),
  customer: document.getElementById('customer'),
  customerInfo: document.getElementById('customerInfo'),
  brandTableBody: document.getElementById('brandTableBody'),
  visitForm: document.getElementById('visitForm')
};

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
  loadSalesReps();
  
  // Event listeners
  elements.salesRep.addEventListener('change', loadCustomers);
  document.getElementById('addBrand').addEventListener('click', addBrandRow);
  elements.visitForm.addEventListener('submit', submitVisit);
});

// Load sales representatives
async function loadSalesReps() {
  try {
    const response = await fetch(`${API_URL}?action=getSalesReps`);
    const reps = await response.json();
    
    elements.salesRep.innerHTML = '<option value="">-- Select Sales Rep --</option>';
    reps.forEach(rep => {
      const option = document.createElement('option');
      option.value = rep[1]; // Rep Name
      option.textContent = rep[1];
      elements.salesRep.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading sales reps:", error);
  }
}

// Load customers for selected rep
async function loadCustomers() {
  const repName = this.value;
  if (!repName) return;
  
  try {
    const response = await fetch(`${API_URL}?action=getCustomersByRep&rep=${encodeURIComponent(repName)}`);
    const customers = await response.json();
    
    elements.customer.innerHTML = '<option value="">-- Select Customer --</option>';
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.tradingName;
      option.textContent = customer.tradingName;
      option.dataset.area = customer.area;
      option.dataset.province = customer.province;
      option.dataset.lastVisit = customer.lastVisit;
      elements.customer.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

// Show customer details when selected
elements.customer.addEventListener('change', function() {
  const selected = this.options[this.selectedIndex];
  elements.customerInfo.innerHTML = `
    <p><strong>Area:</strong> ${selected.dataset.area}, ${selected.dataset.province}</p>
    <p><strong>Last Visit:</strong> ${selected.dataset.lastVisit}</p>
  `;
});

// Add brand/unit row
async function addBrandRow() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <select class="brand-select">
        <option value="">-- Select Brand --</option>
      </select>
    </td>
    <td><input type="number" class="units-input" min="0"></td>
    <td><button type="button" class="remove-btn">✕</button></td>
  `;
  
  elements.brandTableBody.appendChild(row);
  
  // Load brands
  try {
    const response = await fetch(`${API_URL}?action=getBrands`);
    const brands = await response.json();
    
    const select = row.querySelector('.brand-select');
    brands.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand[0]; // Brand ID
      option.textContent = brand[1]; // Brand Name
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading brands:", error);
  }
  
  // Remove button
  row.querySelector('.remove-btn').addEventListener('click', () => {
    elements.brandTableBody.removeChild(row);
  });
}

// Submit visit form
async function submitVisit(event) {
  event.preventDefault();
  
  const formData = {
    salesRep: elements.salesRep.value,
    customer: elements.customer.value,
    notes: document.getElementById('notes').value,
    brands: []
  };
  
  // Collect brand data
  document.querySelectorAll('#brandTableBody tr').forEach(row => {
    formData.brands.push({
      brand: row.querySelector('.brand-select').value,
      units: row.querySelector('.units-input').value
    });
  });
  
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
    elements.customerInfo.innerHTML = '';
  } catch (error) {
    console.error("Error submitting visit:", error);
    alert("Failed to save visit. Please check console for details.");
  }
}
