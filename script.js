const API_URL = "https://script.google.com/macros/s/AKfycbxs43gvdb9SyVmF50XW2kr_f9_ylg1Pp2hMNeXtmeCMB-Tp-cFa043-7xlLzdpi7iIl9Q/exec";

document.addEventListener('DOMContentLoaded', () => {
  loadSalesReps();
  document.getElementById('salesRep').addEventListener('change', loadAreas);
  document.getElementById('area').addEventListener('change', loadCustomers);
  document.getElementById('addBrand').addEventListener('click', addBrandRow);
  document.getElementById('visitForm').addEventListener('submit', submitVisit);
});

async function loadSalesReps() {
  try {
    const response = await fetch(`${API_URL}?action=getSalesReps`);
    const reps = await response.json();
    
    const select = document.getElementById('salesRep');
    select.innerHTML = '<option value="">-- Select Sales Rep --</option>';
    
    reps.forEach(rep => {
      const option = document.createElement('option');
      option.value = rep.id;
      option.textContent = rep.name;
      option.dataset.territories = rep.territories.join(',');
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading sales reps:", error);
    alert("Failed to load sales reps. Please try again.");
  }
}

async function loadAreas() {
  const repId = this.value;
  const areaSelect = document.getElementById('area');
  areaSelect.innerHTML = '<option value="">-- Select Area --</option>';
  areaSelect.disabled = true;
  
  document.getElementById('customer').innerHTML = '<option value="">-- Select Customer --</option>';
  document.getElementById('customer').disabled = true;
  document.getElementById('customerInfo').innerHTML = '<p>Last Visit: <span id="lastVisitDate">Never</span></p>';
  
  if (!repId) return;
  
  try {
    const response = await fetch(`${API_URL}?action=getAreasByRep&repId=${encodeURIComponent(repId)}`);
    const areas = await response.json();
    
    areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      areaSelect.appendChild(option);
    });
    
    areaSelect.disabled = false;
  } catch (error) {
    console.error("Error loading areas:", error);
    alert("Failed to load areas. Please try again.");
  }
}

async function loadCustomers() {
  const area = this.value;
  const repId = document.getElementById('salesRep').value;
  const customerSelect = document.getElementById('customer');
  customerSelect.innerHTML = '<option value="">-- Select Customer --</option>';
  customerSelect.disabled = true;
  
  if (!area) return;
  
  try {
    const response = await fetch(`${API_URL}?action=getCustomersByArea&area=${encodeURIComponent(area)}&repId=${encodeURIComponent(repId)}`);
    const customers = await response.json();
    
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.tradingName;
      option.textContent = customer.tradingName;
      option.dataset.lastVisit = customer.lastVisit;
      option.dataset.nextVisit = customer.nextVisit;
      customerSelect.appendChild(option);
    });
    
    customerSelect.disabled = false;
  } catch (error) {
    console.error("Error loading customers:", error);
    alert("Failed to load customers. Please try again.");
  }
}

document.getElementById('customer').addEventListener('change', function() {
  const selected = this.options[this.selectedIndex];
  document.getElementById('lastVisitDate').textContent = selected.dataset.lastVisit || "Never";
});

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
            `<option value="${brand.id}" 
                    data-category1="${brand.category1}" 
                    data-category2="${brand.category2}">
              ${brand.name}
            </option>`
          ).join('')}
        </select>
      </td>
      <td>
        <select class="category-select" required>
          <option value="">-- Select Category --</option>
        </select>
      </td>
      <td><input type="number" class="units-input" min="0" required></td>
      <td><button type="button" class="remove-btn">✕</button></td>
    `;
    
    document.getElementById('brandTableBody').appendChild(row);
    
    // Update categories when brand changes
    const brandSelect = row.querySelector('.brand-select');
    const categorySelect = row.querySelector('.category-select');
    
    brandSelect.addEventListener('change', function() {
      const selected = this.options[this.selectedIndex];
      categorySelect.innerHTML = `
        <option value="">-- Select Category --</option>
        <option value="${selected.dataset.category1}">${selected.dataset.category1}</option>
        <option value="${selected.dataset.category2}">${selected.dataset.category2}</option>
      `;
    });
    
    row.querySelector('.remove-btn').addEventListener('click', function() {
      row.remove();
    });
  } catch (error) {
    console.error("Error loading brands:", error);
    alert("Failed to load brands. Please try again.");
  }
}

async function submitVisit(event) {
  event.preventDefault();
  
  const repSelect = document.getElementById('salesRep');
  const repName = repSelect.options[repSelect.selectedIndex].textContent;
  
  const formData = {
    salesRepName: repName,
    customer: document.getElementById('customer').value,
    notes: document.getElementById('notes').value,
    brands: []
  };
  
  // Validate customer selection
  if (!formData.customer) {
    alert("Please select a customer");
    return;
  }
  
  // Collect brand data
  const brandRows = document.querySelectorAll('#brandTableBody tr');
  if (brandRows.length === 0) {
    alert("Please add at least one brand");
    return;
  }
  
  brandRows.forEach(row => {
    const brandSelect = row.querySelector('.brand-select');
    const brandOption = brandSelect.options[brandSelect.selectedIndex];
    
    const categorySelect = row.querySelector('.category-select');
    
    formData.brands.push({
      brandId: brandSelect.value,
      brandName: brandOption.textContent,
      category: categorySelect.value,
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
    
    // Reset form
    document.getElementById('visitForm').reset();
    document.getElementById('brandTableBody').innerHTML = '';
    document.getElementById('customerInfo').innerHTML = '<p>Last Visit: <span id="lastVisitDate">Never</span></p>';
    document.getElementById('area').disabled = true;
    document.getElementById('customer').disabled = true;
  } catch (error) {
    console.error("Error submitting visit:", error);
    alert("Failed to save visit. Please check console for details.");
  }
}
