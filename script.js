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

let employees = loadEmployees();
let selectedIds = new Set();
let sortState = { key: "fullName", direction: "asc" };

function  safeText(value) {
  return String(value ?? "")
}

function showError(field, message) {
  const span = document.querySelector(
    `.error[data-for="${field.id || field.name}"]`,
  );
  if (span) span.textContent = message;
  field.classList.add("invalid");
}

function clearError(field) {
  const span = document.querySelector(
    `.error[data-for="${field.id || field.name}"]`,
  );
  if (span) span.textContent = "";
  field.classList.remove("invalid");
}

function ageFromDOB(dobStr) {
  if (!dobStr) return 0;
  const dob = new Date(dobStr);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return console.log(Math.abs(ageDate.getUTCFullYear() - 1970)) ;
}

function validateField(field) {
  clearError(field);
  if (field.disabled) return true;

  if (field.required && !field.value) {
    showError(field, "This field is required.");
    return false;
  }

  if (field.type === "email" && field.value) {
    if (!field.checkValidity()) {
      showError(field, "Enter a valid email.");
      return false;
    }
  }

  if (field.type === "tel" && field.value) {
    if (!field.checkValidity()) {
      showError(field, "Enter a valid phone (digits, optional +).");
      return false;
    }
  }

  if (field.type === "date" && field.id === "dob" && field.value) {
    const age = ageFromDOB(field.value);
    if (age < 18) {
      showError(field, "Employee must be at least 18 years old.");
      return false;
    }
  }

  if (field.type === "file" && field.files && field.files[0]) {
    const file = field.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showError(field, "File too large (max 2MB).");
      return false;
    }
    if (field.accept && !file.type.includes("pdf")) {
      showError(field, "Only PDF allowed.");
      return false;
    }
  }

  if (field.type === "number" && field.value) {
    if (Number(field.value) < 0) {
      showError(field, "Value must be non-negative.");
      return false;
    }
  }

  if (field.pattern && field.value) {
    const regex = new RegExp(field.pattern);
    if (!regex.test(field.value)) {
      showError(field, "Invalid format.");
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
  console.log(anyChecked)
  console.log(span)

  if (span) span.textContent = "";
  return true;
}

function loadEmployees() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (error) {
    console.warn("Error reading local storage", error);
  }

  const sample = [
    {
      id: "id_1",
      firstName: "ruchit",
      lastName: "sonani",
      email: "sample@example.com",
      phone: "+919876543210",
      dob: "1993-05-14",
      gender: "male",
      address: "utran , surat",
      country: "India",
      state: "gujrat",
      city: "surat",
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  return sample;
}

function saveEmployees() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}
//for country
function populateCountryOptions() {
  const countries = Object.keys(locationData);
  const currentValue = countrySelect.value;
  
  countrySelect.innerHTML =
  '<option value="">Select Country</option>' +
  countries
  .map(
    (country) =>
      `<option value="${safeText(country)}">${safeText(country)}</option>`,
  )
  .join("");
  
  if (currentValue && countries.includes(currentValue)) {
    countrySelect.value = currentValue;
  }
}

//for state
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

//for city
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

function getFullName(employee) {
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
}

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
    const valA = (a[key] ?? "").toString().toLowerCase();
    const valB = (b[key] ?? "").toString().toLowerCase();

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;

    return 0;
  });

  return sorted;
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
    const matchesCountry = !countryValue || employee.country === countryValue;

    return matchesSearch && matchesDepartment && matchesCountry;
  });
  return getSortedEmployees(filtered);
}

function buildFilterOptions() {
  const departments = [
    ...new Set(
      employees.map((employee) => employee.department).filter(Boolean),
    ),
  ].sort();
  console.log(departments)
  const countries = [
    ...new Set(employees.map((employee) => employee.country).filter(Boolean)),
  ].sort();

  const currentDepartment = departmentFilter.value;
  const currentCountry = countryFilter.value;

  departmentFilter.innerHTML =
    '<option value="">All Departments</option>' +
    departments
      .map(
        (dept) =>
          `<option value="${safeText(dept)}">${safeText(dept)}</option>`,
      )
      .join("");

  countryFilter.innerHTML =
    '<option value="">All Countries</option>' +
    countries
      .map(
        (country) =>
          `<option value="${safeText(country)}">${safeText(country)}</option>`,
      )
      .join("");

  departmentFilter.value = departments.includes(currentDepartment)
    ? currentDepartment
    : "";
  countryFilter.value = countries.includes(currentCountry)
    ? currentCountry
    : "";
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
              <button type="button" class="btn btn-secondary" data-action="view" data-id="${safeText(id)}">View</button>
              <button type="button" class="btn btn-danger" data-action="delete" data-id="${safeText(id)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const allVisibleSelected = visibleEmployees.every((employee) =>
    selectedIds.has(String(employee.id)),
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
    ["Skills", (employee.skills || []).join(",") || "None"],
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
          `,
        )
        .join("")}
    </div>
  `;
}


function fallbackCopy(value) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
}

function exportEmployeeAsText(employee) {
  return [
    `Name: ${getFullName(employee)}`,
    `Email: ${employee.email}`,
    `Phone: ${employee.phone}`,
    `Department: ${employee.department}`,
    `Job Title: ${employee.jobTitle}`,
    `Employee ID: ${employee.employeeId}`,
    `Gender: ${employee.gender}`,
    `Country: ${employee.country}`,
    `State: ${employee.state}`,
    `City: ${employee.city}`,
    `Address: ${employee.address}`,
    `Employment Type: ${employee.empType}`,
    `Skills: ${(employee.skills || []).join(", ") || "None"}`,
  ].join("\n");
}

function deleteEmployeeById(employeeId) {
  employees = employees.filter(
    (employee) => String(employee.id) !== String(employeeId),
  );
  selectedIds.delete(String(employeeId));
  saveEmployees();
  buildFilterOptions();
  renderTable();
  renderDetails(employees[0] || null);
}

function submitEmployeeData() {
  const checkedSkills = Array.from(
    form.querySelectorAll('input[name="skills"]:checked'),
  ).map((input) => input.value);

  const employee = {
    id: `emp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    dob: form.dob.value,
    gender: form.querySelector('input[name="gender"]:checked')?.value || "",
    address: form.address.value.trim(),
    country: form.country.value,
    state: form.state.value,
    city: form.city.value,
    postalCode: form.postalCode.value.trim(),
    employeeId: form.employeeId.value.trim(),
    department: form.department.value,
    jobTitle: form.jobTitle.value.trim(),
    startDate: form.startDate.value,
    empType: form.querySelector('input[name="empType"]:checked')?.value || "",
    salary: form.salary.value,
    skills: checkedSkills,
    resume:
      form.resume.files && form.resume.files[0]
        ? form.resume.files[0].name
        : "",
  };

  employees.unshift(employee);
  saveEmployees();
  buildFilterOptions();
  renderTable();
  renderDetails(employee);
  form.reset();
  populateLocationFields();
  formMessage.textContent = "Employee registered successfully.";
  formMessage.className = "success-summary";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  let valid = true;

  const controls = form.querySelectorAll("input, select, textarea");
  controls.forEach((control) => {
    if (control.type === "radio") return;
    if (!validateField(control)) valid = false;
  });

  if (!validateRadios("gender")) valid = false;
  if (!validateRadios("empType")) valid = false;

  if (!valid) {
    formMessage.textContent = "Please fix errors above and resubmit.";
    formMessage.className = "error-summary";
    const firstInvalid = form.querySelector(
      ".invalid, .error:empty ~ input.invalid",
    );
    if (firstInvalid) firstInvalid.focus();
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
    document
      .querySelectorAll(".invalid")
      .forEach((field) => field.classList.remove("invalid"));
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
    visibleEmployees.forEach((employee) =>
      selectedIds.add(String(employee.id)),
    );
  } else {
    visibleEmployees.forEach((employee) =>
      selectedIds.delete(String(employee.id)),
    );
  }
  renderTable();
});

selectAllBtn.addEventListener("click", () => {
  const visibleEmployees = getFilteredEmployees();
  if (!visibleEmployees.length) return;

  const allSelected = visibleEmployees.every((employee) =>
    selectedIds.has(String(employee.id)),
  );

  if (allSelected) {
    visibleEmployees.forEach((employee) =>
      selectedIds.delete(String(employee.id)),
    );
  } else {
    visibleEmployees.forEach((employee) =>
      selectedIds.add(String(employee.id)),
    );
  }

  renderTable();
});


deleteSelectedBtn.addEventListener("click", () => {
  if (!selectedIds.size) {
    alert("Please select at least one employee to delete.");
    return;
  }

  const confirmed = window.confirm(
    `Delete ${selectedIds.size} selected employee(s)?`,
  );
  if (!confirmed) return;

  employees = employees.filter(
    (employee) => !selectedIds.has(String(employee.id)),
  );
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
    const employee = employees.find(
      (item) => String(item.id) === String(employeeId),
    );

    if (!employee) return;

    if (actionButton.dataset.action === "view") {
      renderDetails(employee);
      return;
    }

    if (actionButton.dataset.action === "delete") {
      const confirmed = window.confirm(`Delete ${getFullName(employee)}?`);
      if (!confirmed) return;
      deleteEmployeeById(employeeId);
    }
  }

  if (
    row &&
    !event.target.closest("button") &&
    !event.target.closest("input")
  ) {
    const employee = employees.find(
      (item) => String(item.id) === String(employeeId),
    );
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
