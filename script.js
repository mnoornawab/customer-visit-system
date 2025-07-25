const API_URL = "https://script.google.com/macros/s/AKfycbxs43gvdb9SyVmF50XW2kr_f9_ylg1Pp2hMNeXtmeCMB-Tp-cFa043-7xlLzdpi7iIl9Q/exec";

// Initialize form if on record-visit page
if (document.getElementById('visitForm')) {
  document.addEventListener('DOMContentLoaded', () => {
    loadSalesReps();
    document.getElementById('salesRep').addEventListener('change', loadAreas);
    document.getElementById('area').addEventListener('change', loadCustomers);
    document.getElementById('addBrand').addEventListener('click', addBrandRow);
    document.getElementById('visitForm').addEventListener('submit', submitVisit);
    
    // Set default visit date to today
    document.getElementById('visitDate').valueAsDate = new Date();
  });
}

async function loadSalesReps() {
  try {
    const response = await fetch(`${API_URL}?action=getSalesReps`);
    if (!response.ok) throw new Error("Failed to fetch sales reps");
    
    const reps = await response.json();
    const select = document.getElementById('salesRep');
    
    select.innerHTML = '<option value="">-- Select Rep --</option>';
    reps.forEach(rep => {
      const option = document.createElement('option');
      option.value = rep.id;
      option.textContent = rep.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading sales reps:", error);
    alert("Error loading sales reps. Please check console for details.");
  }
}

async function loadAreas() {
  const repId = this.value;
  const areaSelect = document.getElementById('area');
  areaSelect.innerHTML = '<option value="">-- Select Area --</option>';
  areaSelect.disabled = true;
  
  if (document.getElementById('customer')) {
    document.getElementById('customer').innerHTML = '<option value="">-- Select Customer --</option>';
    document.getElementById('customer').disabled = true;
  }
  
  if (!repId) return;
  
  try {
    const response = await fetch(`${API_URL}?action=getAreasByRep&repId=${repId}`);
    if (!response.ok) throw new Error("Failed to fetch areas");
    
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
    alert("Error loading areas. Please check console for details.");
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
    const response = await fetch(`${API_URL}?action=getCustomersByArea&area=${area}&repId=${repId}`);
    if (!response.ok) throw new Error("Failed to fetch customers");
    
    const customers = await response.json();
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.tradingName;
      option.textContent = customer.tradingName;
      option.dataset.lastVisit = customer.lastVisit;
      customerSelect.appendChild(option);
    });
    
    customerSelect.disabled = false;
  } catch (error) {
    console.error("Error loading customers:", error);
    alert("Error loading customers. Please check console for details.");
  }
}

async function addBrandRow() {
  try {
    const response = await fetch(`${API_URL}?action=getBrands`);
    if (!response.ok) throw new Error("Failed to fetch brands");
    
    const brands = await response.json();
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>
        <select class="brand-select" required>
          <option value="">-- Select Brand --</option>
          ${brands.map(brand => `
            <option value="${brand.id}" 
                    data-name="${brand.name}"
                    data-category1="${brand.category1}" 
                    data-category2="${brand.category2}">
              ${brand.name}
            </option>
          `).join('')}
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
    row.querySelector('.brand-select').addEventListener('change', function() {
      const selected = this.options[this.selectedIndex];
      const categorySelect = row.querySelector('.category-select');
      
      categorySelect.innerHTML = `
        <option value="">-- Select Category --</option>
        <option value="${selected.dataset.category1}">${selected.dataset.category1}</option>
        <option value="${selected.dataset.category2}">${selected.dataset.category2}</option>
      `;
    });
    
    row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
  } catch (error) {
    console.error("Error adding brand row:", error);
    alert("Error adding brand. Please check console for details.");
  }
}

async function submitVisit(event) {
  event.preventDefault();
  
  const repSelect = document.getElementById('salesRep');
  const repName = repSelect.options[repSelect.selectedIndex].textContent;
  
  const formData = {
    salesRepName: repName,
    customer: document.getElementById('customer').value,
    visitDate: document.getElementById('visitDate').value,
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
    
    if (!brandSelect.value || !categorySelect.value) {
      alert("Please complete all brand selections");
      throw new Error("Incomplete brand selection");
    }
    
    formData.brands.push({
      brandId: brandSelect.value,
      brandName: brandOption.dataset.name,
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
    
    if (!response.ok) throw new Error("Failed to save visit");
    
    const result = await response.text();
    alert(result);
    
    // Reset form
    document.getElementById('visitForm').reset();
    document.getElementById('brandTableBody').innerHTML = '';
    document.getElementById('area').disabled = true;
    document.getElementById('customer').disabled = true;
    document.getElementById('visitDate').valueAsDate = new Date();
  } catch (error) {
    console.error("Error submitting visit:", error);
    alert("Failed to save visit. Please check console for details.");
  }
}

async function showWeeklyCycle() {
  const repSelect = document.createElement('select');
  repSelect.id = 'cycleRepSelect';
  repSelect.innerHTML = '<option value="">-- Select Rep --</option>';
  
  try {
    // Load sales reps
    const response = await fetch(`${API_URL}?action=getSalesReps`);
    if (!response.ok) throw new Error("Failed to fetch sales reps");
    
    const reps = await response.json();
    reps.forEach(rep => {
      const option = document.createElement('option');
      option.value = rep.id;
      option.textContent = rep.name;
      repSelect.appendChild(option);
    });
    
    // Show rep selection dialog
    const repId = await new Promise(resolve => {
      const dialog = `
        <div class="dialog-overlay">
          <div class="dialog">
            <h3>Select Sales Representative</h3>
            <div id="repSelectContainer"></div>
            <button id="confirmRep">Show Weekly Cycle</button>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', dialog);
      document.getElementById('repSelectContainer').appendChild(repSelect);
      
      document.getElementById('confirmRep').addEventListener('click', () => {
        document.body.removeChild(document.querySelector('.dialog-overlay'));
        resolve(repSelect.value);
      });
    });
    
    if (!repId) return;
    
    // Get weekly cycle
    const cycleResponse = await fetch(`${API_URL}?action=getWeeklyCycle&repId=${repId}`);
    if (!cycleResponse.ok) throw new Error("Failed to fetch weekly cycle");
    
    const dueCustomers = await cycleResponse.json();
    const resultsDiv = document.getElementById('weeklyCycleResults');
    
    if (dueCustomers.length === 0) {
      resultsDiv.innerHTML = '<p>All customers have been visited recently. No customers due for visit.</p>';
      return;
    }
    
    let html = '<h3>Customers Due for Visit This Week</h3><ul>';
    dueCustomers.forEach(customer => {
      html += `
        <li>
          <strong>${customer.tradingName}</strong> (${customer.area})<br>
          Last Visit: ${customer.lastVisit}
        </li>
      `;
    });
    html += '</ul>';
    
    resultsDiv.innerHTML = html;
  } catch (error) {
    console.error("Error loading weekly cycle:", error);
    alert("Error loading weekly cycle. Please check console for details.");
  }
}
