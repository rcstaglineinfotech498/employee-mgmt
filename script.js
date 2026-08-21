
const STORAGE_KEY = "employeeManagementRecords";

const form = document.getElementById("employeeForm");
const formMessage = document.getElementById("formMessage");
const employeeTableBody = document.getElementById("employeeTableBody");
const employeeDetails = document.getElementById("employeeDetails");
const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");
const countryFilter = document.getElementById("countryFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const masterCheckbox = document.getElementById("masterCheckbox");
const selectAllBtn = document.getElementById("selectAllBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

const countrySelect = document.getElementById("country");
const stateSelect = document.getElementById("state");
const citySelect = document.getElementById("city");

const resumeInput = document.getElementById("resume");

let employees = loadEmployees();
let selectedIds = new Set();
let sortState = { key: "firstName", direction: "asc" };
let editingId = null;

const locationData = {
  India: {
    Maharashtra: ["Mumbai", "Pune", "Nashik"],
    Karnataka: ["Bengaluru", "Mangaluru"],
    Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  },
  Canada: {
    Ontario: ["Toronto", "Ottawa", "Hamilton"],
    Alberta: ["Calgary", "Edmonton", "Banff"],
    Quebec: ["Montreal", "Quebec City", "Laval"],
  },
  "United States": {
    California: ["Los Angeles", "San Francisco", "San Diego"],
    Texas: ["Houston", "Dallas", "Austin"],
    "New York": ["New York City", "Buffalo", "Albany"],
  },
  "United Kingdom": {
    England: ["London", "Manchester", "Birmingham"],
    Scotland: ["Edinburgh", "Glasgow", "Aberdeen"],
  },
};

function safeText(value) {
  return String(value ?? "");
}

function getFullName(employee) {
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
}

function showError(field, message) {
  const span = document.querySelector(`.error[data-for="${field.id || field.name}"]`);
  if (span) span.textContent = message;
  field.classList.add("invalid");
}

function clearError(field) {
  const span = document.querySelector(`.error[data-for="${field.id || field.name}"]`);
  if (span) span.textContent = "";
  field.classList.remove("invalid");
}

function ageFromDOB(dobStr) {
  if (!dobStr) return 0;
  const dob = new Date(dobStr);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function validateField(field) {
  clearError(field);

  if (field.disabled) return true;

  if (field.required && !field.value) {
    showError(field, "This field is required.");
    return false;
  }

  if (field.type === "email" && field.value && !field.checkValidity()) {
    showError(field, "Enter a valid email.");
    return false;
  }

  if (field.type === "tel" && field.value && !field.checkValidity()) {
    showError(field, "Enter a valid phone number.");
    return false;
  }

  if (field.type === "date" && field.id === "dob" && field.value) {
    if (ageFromDOB(field.value) < 18) {
      showError(field, "Employee must be at least 18 years old.");
      return false;
    }
  }


  if (field.type === "number" && field.value && Number(field.value) < 0) {
    showError(field, "Value must be non-negative.");
    return false;
  }
   if (field.type === "date" && field.id === "startDate" && field.value) {
    const selectedDate = new Date(`${field.value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      showError(field, "Start date cannot be in the future.");
      return false;
    }
  }

  if (field.type === "file" && field.files && field.files[0]) {
    const file = field.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showError(field, "File too large (max 2MB).");
      return false;
    }
    if (file.type && !file.type.includes("pdf")) {
      showError(field, "Only PDF files are allowed.");
      return false;
    }
  }

  clearError(field);
  return true;
}

function validateRadios(groupName) {
  const radios = form.querySelectorAll(`input[name="${groupName}"]`);
  const anyChecked = Array.from(radios).some((radio) => radio.checked);
  const span = document.querySelector(`.error[data-for="${groupName}"]`);

  if (!anyChecked) {
    if (span) span.textContent = "Please select an option.";
    return false;
  }

  if (span) span.textContent = "";
  return true;
}

function loadEmployees() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (error) {
    console.warn("Error reading employees:", error);
  }

  const defaultEmployees = [
    {
      id: "id_1",
      firstName: "ruchit",
      lastName: "sonani",
      email: "sample@example.com",
      phone: "+919876543210",
      dob: "1993-05-14",
      gender: "Male",
      address: "utran , surat",
      country: "India",
      state: "Gujarat",
      city: "Surat",
      postalCode: "39415",
      employeeId: "EMP-1001",
      department: "Engineering",
      jobTitle: "MERN Developer",
      startDate: "2022-06-20",
      empType: "Full-time",
      salary: "85000",
      skills: ["JavaScript", "Project Management"],
      resume: "resume.pdf",
    },
    {
      id: "id_2",
      firstName: "xyz",
      lastName: "abc",
      email: "xyz@example.com",
      phone: "+14155550102",
      dob: "1988-10-09",
      gender: "Male",
      address: "Los Angeles, California",
      country: "United States",
      state: "California",
      city: "Los Angeles",
      postalCode: "90025",
      employeeId: "EMP-1002",
      department: "Sales",
      jobTitle: "QA tester",
      startDate: "2021-02-15",
      empType: "Contract",
      salary: "72000",
      skills: ["SQL"],
      resume: "resume.pdf",
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEmployees));
  return defaultEmployees;
}

function saveEmployees() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function populateCountryOptions() {
  const countries = Object.keys(locationData);
  const currentValue = countrySelect.value;

  countrySelect.innerHTML =
    '<option value="">Select Country</option>' +
    countries
      .map((country) => `<option value="${safeText(country)}">${safeText(country)}</option>`)
      .join("");

  if (currentValue && countries.includes(currentValue)) {
    countrySelect.value = currentValue;
  }
}

function populateLocationFields() {
  const country = countrySelect.value;
  stateSelect.innerHTML = '<option value="">Select State</option>';
  citySelect.innerHTML = '<option value="">Select City</option>';

  if (!country || !locationData[country]) return;

  const states = Object.keys(locationData[country]);
  states.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });
}

function handleCountryChange() {
  populateLocationFields();
  clearError(countrySelect);
  clearError(stateSelect);
  clearError(citySelect);
}

function handleStateChange() {
  const country = countrySelect.value;
  const state = stateSelect.value;
  citySelect.innerHTML = '<option value="">Select City</option>';

  if (!country || !state || !locationData[country][state]) return;

  locationData[country][state].forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  clearError(citySelect);
}

countrySelect.addEventListener("change", handleCountryChange);
stateSelect.addEventListener("change", handleStateChange);

function getEmployeeSearchText(employee) {
  return [
    employee.firstName,
    employee.lastName,
    employee.email,
    employee.department,
    employee.country,
    employee.state,
    employee.city,
    employee.employeeId,
    employee.jobTitle,
  ]
    .join(" ")
    .toLowerCase();
}

function getSortedEmployees(list) {
  const { key, direction } = sortState;
  const sorted = [...list];

  sorted.sort((a, b) => {
    const valA = (key === "fullName" ? getFullName(a) : (a[key] ?? "")).toString().toLowerCase();
    const valB = (key === "fullName" ? getFullName(b) : (b[key] ?? "")).toString().toLowerCase();

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

function buildFilterOptions() {
  const departments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort();
  const countries = [...new Set(employees.map((employee) => employee.country).filter(Boolean))].sort();

  const currentDepartment = departmentFilter.value;
  const currentCountry = countryFilter.value;

  departmentFilter.innerHTML =
    '<option value="">All Departments</option>' +
    departments
      .map((dept) => `<option value="${safeText(dept)}">${safeText(dept)}</option>`)
      .join("");

  countryFilter.innerHTML =
    '<option value="">All Countries</option>' +
    countries
      .map((country) => `<option value="${safeText(country)}">${safeText(country)}</option>`)
      .join("");

  departmentFilter.value = departments.includes(currentDepartment) ? currentDepartment : "";
  countryFilter.value = countries.includes(currentCountry) ? currentCountry : "";
}

function getFilteredEmployees() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const departmentValue = departmentFilter.value;
  const countryValue = countryFilter.value;

  const filtered = employees.filter((employee) => {
    const matchesSearch =
      !searchValue || getEmployeeSearchText(employee).includes(searchValue);

    const matchesDepartment =
      !departmentValue || employee.department === departmentValue;

    const matchesCountry =
      !countryValue || employee.country === countryValue;

    return matchesSearch && matchesDepartment && matchesCountry;
  });

  return getSortedEmployees(filtered);
}

function renderTable() {
  const visibleEmployees = getFilteredEmployees();

  if (!visibleEmployees.length) {
    employeeTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">No employees found.</td></tr>';
    masterCheckbox.checked = false;
    return;
  }

  employeeTableBody.innerHTML = visibleEmployees
    .map((employee) => {
      const id = String(employee.id);
      const selected = selectedIds.has(id);
      const fullName = getFullName(employee);

      return `
        <tr class="${selected ? "selected-row" : ""}" data-id="${safeText(id)}">
          <td>
            <input
              type="checkbox"
              class="row-checkbox"
              data-id="${safeText(id)}"
              ${selected ? "checked" : ""}
              aria-label="Select ${safeText(fullName)}"
            />
          </td>
          <td>${safeText(fullName)}</td>
          <td>${safeText(employee.email)}</td>
          <td>${safeText(employee.department)}</td>
          <td>${safeText(employee.empType)}</td>
          <td>${safeText(employee.country)}</td>
          <td>
            <div class="action-group">
              <button type="button" class="btn" data-action="view" data-id="${safeText(id)}">View</button>
              <button type="button" class="btn btn-edit" data-action="edit" data-id="${safeText(id)}">Edit</button>
              <button type="button" class="btn btn-danger" data-action="delete" data-id="${safeText(id)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const allVisibleSelected = visibleEmployees.every((employee) =>
    selectedIds.has(String(employee.id))
  );
  masterCheckbox.checked = allVisibleSelected && visibleEmployees.length > 0;
}

function renderDetails(employee) {
  if (!employee) {
    employeeDetails.innerHTML =
      '<div class="empty-state">Select an employee to view details.</div>';
    return;
  }

  const detailCards = [
    ["Full Name", getFullName(employee)],
    ["Email", employee.email],
    ["Phone", employee.phone],
    ["DOB", employee.dob],
    ["Gender", employee.gender],
    ["Employee ID", employee.employeeId],
    ["Department", employee.department],
    ["Job Title", employee.jobTitle],
    ["Employment Type", employee.empType],
    ["Country", employee.country],
    ["State", employee.state],
    ["City", employee.city],
    ["Postal Code", employee.postalCode],
    ["Address", employee.address],
    ["Resume", employee.resume || "Not uploaded"],
    ["Skills", (employee.skills || []).join(", ") || "None"],
  ];

  employeeDetails.innerHTML = `
    <div class="detail-grid">
      ${detailCards
        .map(
          ([label, value]) => `
            <div class="detail-card">
              <strong>${safeText(label)}</strong>
              <span>${safeText(value)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function editEmployeeById(employeeId) {
  const employee = employees.find((e) => String(e.id) === String(employeeId));
  if (!employee) return;

  editingId = String(employee.id);

  document.getElementById("firstName").value = employee.firstName || "";
  document.getElementById("lastName").value = employee.lastName || "";
  document.getElementById("email").value = employee.email || "";
  document.getElementById("phone").value = employee.phone || "";
  document.getElementById("dob").value = employee.dob || "";
  document.getElementById("address").value = employee.address || "";
  document.getElementById("postalCode").value = employee.postalCode || "";
  document.getElementById("employeeId").value = employee.employeeId || "";
  document.getElementById("department").value = employee.department || "";
  document.getElementById("jobTitle").value = employee.jobTitle || "";
  document.getElementById("startDate").value = employee.startDate || "";
  document.getElementById("salary").value = employee.salary || "";

  const genderRadio = form.querySelector(`input[name="gender"][value="${employee.gender}"]`);
  if (genderRadio) genderRadio.checked = true;

  const empTypeRadio = form.querySelector(`input[name="empType"][value="${employee.empType}"]`);
  if (empTypeRadio) empTypeRadio.checked = true;

  form.querySelectorAll('input[name="skills"]').forEach((box) => {
    box.checked = (employee.skills || []).includes(box.value);
  });

  countrySelect.value = employee.country || "";
  populateLocationFields();
  stateSelect.value = employee.state || "";
  handleStateChange();
  citySelect.value = employee.city || "";

  formMessage.textContent = `Editing ${getFullName(employee)} (existing resume: ${employee.resume || "none"})`;
  formMessage.className = "info-summary";

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save Changes";

  document.getElementById("firstName").focus();
}

function deleteEmployeeById(employeeId) {
  employees = employees.filter((employee) => String(employee.id) !== String(employeeId));
  selectedIds.delete(String(employeeId));
  saveEmployees();
  buildFilterOptions();
  renderTable();
  renderDetails(employees[0] || null);
}

function submitEmployeeData() {
  const checkedSkills = Array.from(
    form.querySelectorAll('input[name="skills"]:checked')
  ).map((input) => input.value);

  const employeeData = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    dob: document.getElementById("dob").value,
    gender: form.querySelector('input[name="gender"]:checked')?.value || "",
    address: document.getElementById("address").value.trim(),
    country: countrySelect.value,
    state: stateSelect.value,
    city: citySelect.value,
    postalCode: document.getElementById("postalCode").value.trim(),
    employeeId: document.getElementById("employeeId").value.trim(),
    department: document.getElementById("department").value,
    jobTitle: document.getElementById("jobTitle").value.trim(),
    startDate: document.getElementById("startDate").value,
    empType: form.querySelector('input[name="empType"]:checked')?.value || "",
    salary: document.getElementById("salary").value,
    skills: checkedSkills,
    resume: resumeInput.files && resumeInput.files[0] ? resumeInput.files[0].name : "",
  };

  if (editingId) {
    const index = employees.findIndex((employee) => String(employee.id) === String(editingId));
    if (index === -1) return;

    const existing = employees[index];
    employees[index] = {
      ...existing,
      ...employeeData,
      id: existing.id,
    };

    saveEmployees();
    buildFilterOptions();
    renderTable();
    renderDetails(employees[index]);

    formMessage.textContent = "Employee updated successfully.";
    formMessage.className = "success-summary";

    editingId = null;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Register Employee";

    form.reset();
    populateLocationFields();
    return;
  }

  const newEmployee = {
    id: `emp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...employeeData,
  };

  employees.unshift(newEmployee);
  saveEmployees();
  buildFilterOptions();
  renderTable();
  renderDetails(newEmployee);

  form.reset();
  populateLocationFields();

  formMessage.textContent = "Employee registered successfully.";
  formMessage.className = "success-summary";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  formMessage.textContent = "";
  let valid = true;

  const fields = form.querySelectorAll("input, select, textarea");
  fields.forEach((field) => {
    if (field.type === "radio") return;
    if (!validateField(field)) valid = false;
  });

  if (!validateRadios("gender")) valid = false;
  if (!validateRadios("empType")) valid = false;

  if (!valid) {
    formMessage.textContent = "Please fix errors above and resubmit.";
    formMessage.className = "error-summary";
    return;
  }

  submitEmployeeData();
});

form.addEventListener("input", (event) => {
  const target = event.target;
  if (target.type === "radio") {
    validateRadios(target.name);
  } else {
    validateField(target);
  }
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    document.querySelectorAll(".error").forEach((span) => {
      span.textContent = "";
    });
    document.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));
    formMessage.textContent = "";
    formMessage.className = "";
    populateLocationFields();
  }, 0);
});

searchInput.addEventListener("input", renderTable);
departmentFilter.addEventListener("change", renderTable);
countryFilter.addEventListener("change", renderTable);

clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  departmentFilter.value = "";
  countryFilter.value = "";
  renderTable();
});

masterCheckbox.addEventListener("change", () => {
  const visibleEmployees = getFilteredEmployees();

  if (masterCheckbox.checked) {
    visibleEmployees.forEach((employee) => selectedIds.add(String(employee.id)));
  } else {
    visibleEmployees.forEach((employee) => selectedIds.delete(String(employee.id)));
  }

  renderTable();
});

selectAllBtn.addEventListener("click", () => {
  const visibleEmployees = getFilteredEmployees();

  if (!visibleEmployees.length) return;

  const allSelected = visibleEmployees.every((employee) => selectedIds.has(String(employee.id)));

  if (allSelected) {
    visibleEmployees.forEach((employee) => selectedIds.delete(String(employee.id)));
  } else {
    visibleEmployees.forEach((employee) => selectedIds.add(String(employee.id)));
  }

  renderTable();
});

deleteSelectedBtn.addEventListener("click", () => {
  if (!selectedIds.size) {
    alert("Please select at least one employee.");
    return;
  }

  const confirmed = window.confirm(`Delete ${selectedIds.size} selected employee(s)?`);
  if (!confirmed) return;

  employees = employees.filter((employee) => !selectedIds.has(String(employee.id)));
  selectedIds.clear();
  saveEmployees();
  buildFilterOptions();
  renderTable();
  renderDetails(employees[0] || null);
});

employeeTableBody.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");
  const row = event.target.closest("tr[data-id]");
  const employeeId = actionButton?.dataset.id || row?.dataset.id;

  if (!employeeId) return;

  if (actionButton) {
    const employee = employees.find((item) => String(item.id) === String(employeeId));
    if (!employee) return;

    if (actionButton.dataset.action === "view") {
      renderDetails(employee);
      return;
    }

    if (actionButton.dataset.action === "edit") {
      editEmployeeById(employeeId);
      return;
    }

    if (actionButton.dataset.action === "delete") {
      const confirmed = window.confirm(`Delete ${getFullName(employee)}?`);
      if (!confirmed) return;
      deleteEmployeeById(employeeId);
    }
  }

  if (row && !event.target.closest("button") && !event.target.closest("input")) {
    const employee = employees.find((item) => String(item.id) === String(employeeId));
    renderDetails(employee);
  }
});

employeeTableBody.addEventListener("change", (event) => {
  if (!event.target.classList.contains("row-checkbox")) return;

  const id = String(event.target.dataset.id);

  if (event.target.checked) {
    selectedIds.add(id);
  } else {
    selectedIds.delete(id);
  }

  renderTable();
});

document.querySelectorAll("th[data-sort]").forEach((header) => {
  header.addEventListener("click", () => {
    const key = header.dataset.sort;

    if (sortState.key === key) {
      sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
      sortState = { key, direction: "asc" };
    }

    renderTable();
  });
});

populateCountryOptions();
populateLocationFields();
buildFilterOptions();
renderTable();
renderDetails(employees[0] || null);