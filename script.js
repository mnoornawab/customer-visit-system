// Load customers with territory check
async function loadCustomers() {
  const repName = this.value;
  if (!repName) return;

  try {
    const response = await fetch(`${API_URL}?action=getCustomersByRep&rep=${encodeURIComponent(repName)}`);
    const customers = await response.json();
    
    const customerDropdown = document.getElementById('customer');
    customerDropdown.innerHTML = '<option value="">-- Select Customer --</option>';
    
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.tradingName;
      option.textContent = `${customer.tradingName} (${customer.territory})`;
      option.dataset.area = customer.area;
      option.dataset.lastVisit = customer.lastVisit;
      customerDropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

// Add category filter to brands
async function addBrandRow() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <select class="brand-category" onchange="loadBrands(this)">
        <option value="">All Categories</option>
        <option value="Footwear">Footwear</option>
        <option value="Apparel">Apparel</option>
      </select>
      <select class="brand-select">
        <option value="">-- Select Brand --</option>
      </select>
    </td>
    <td><input type="number" class="units-input" min="0"></td>
    <td><button type="button" class="remove-btn">✕</button></td>
  `;
  
  document.getElementById('brandTableBody').appendChild(row);
  await loadBrands(row.querySelector('.brand-select'));
  
  row.querySelector('.remove-btn').addEventListener('click', () => {
    row.remove();
  });
}

async function loadBrands(selectElement, category = '') {
  try {
    const url = category 
      ? `${API_URL}?action=getBrandsByCategory&category=${encodeURIComponent(category)}`
      : `${API_URL}?action=getBrands`;
    
    const response = await fetch(url);
    const brands = await response.json();
    
    selectElement.innerHTML = '<option value="">-- Select Brand --</option>';
    brands.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand[0]; // Brand ID
      option.textContent = `${brand[1]} (${brand[2]})`; // Name (Category)
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading brands:", error);
  }
}
