// ========== NAVIGATION TOGGLE ==========
function toggleMenu() {
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  burger.classList.toggle("open");
  navLinks.classList.toggle("active");
}

document.querySelectorAll("#navLinks a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("navLinks").classList.remove("active");
    document.getElementById("burger").classList.remove("open");
  });
});

// ========== SHOW/HIDE ADD FORM ==========
document.getElementById("addBtn").addEventListener("click", function () {
  const inputRow = document.getElementById("inputRow");
  inputRow.style.display = inputRow.style.display === "none" ? "block" : "none";
});

// ========== UTILITIES ==========
function getThailandTodayDate() {
  const today = new Date();
  return today.toLocaleDateString("en-CA"); // returns 'YYYY-MM-DD'
}

function addMonthsToDate(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + parseInt(months));
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ========== LOAD PRODUCT OPTIONS ==========
function loadProductOptions() {
  fetch("./api/fetch_product_options.php")
    .then((res) => res.json())
    .then((data) => {
      const productSelect = document.getElementById("product");
      productSelect.innerHTML = "<option selected disabled>Choose...</option>";
      if (data.status === "success") {
        data.products.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.product_id;
          opt.dataset.duration = p.duration;
          opt.dataset.price = p.retail_price;
          opt.dataset.wcPrice = p.wc_price;
          opt.textContent = `${p.product_name}`;
          productSelect.appendChild(opt);
        });
      }
    })
    .catch((error) => console.error("Failed to load product options:", error));
}

// ========== LOAD TABLE DATA ==========
function loadSoldProductTable() {
  fetch("./api/fetch_product_sold.php")
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "success") {
        const tbody = document.querySelector("tbody");
        tbody.innerHTML = "";

        const groupedByDate = {};
        result.data.forEach((item) => {
          const date = item.purchase_date;
          if (!groupedByDate[date]) groupedByDate[date] = [];
          groupedByDate[date].push(item);
        });

        Object.keys(groupedByDate)
          .sort((a, b) => b.localeCompare(a))
          .forEach((date) => {
            const group = groupedByDate[date];
            let groupTotal = 0;

            group.forEach((item, index) => {
              groupTotal += parseFloat(item.price);

              const row = document.createElement("tr");
              row.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${item.product_name}</td>
                            <td>${item.duration}</td>
                            <td>${item.customer || ""}</td>
                            <td>${item.gmail || ""}</td>
                            <td>${item.purchase_date}</td>
                            <td>${item.end_date}</td>
                            <td>${item.seller || ""}</td>
                            <td class="td-scrollable">
                            <button type="button" class="btn btn-link p-0 edit-note-btn" data-id="${
                              item.id
                            }" aria-label="Edit Note">
                              <img src="./assets/edit-svgrepo-com.svg" alt="Edit" style="width: 24px;">
                            </button>
                            <span class="note-text">${item.note || ""}</span>
                            <div class="d-flex align-items-center gap-2 mt-1 d-none note-edit-wrapper">
                              <input type="text" class="form-control form-control-sm note-input" value="${
                                item.note || ""
                              }" />
                              <button type="button" class="btn btn-link p-0 save-note-btn" data-id="${
                                item.id
                              }" aria-label="Save Note">
                                <img src="./assets/tick-square-svgrepo-com.svg" alt="Save" style="width: 20px;">
                              </button>
                            </div>
                            </td>
                            <td style="text-align: right; padding-right: 1.2rem">${parseFloat(
                              item.price
                            ).toFixed(0)} Ks</td>
                            <td style="width: 60px; text-align: right; white-space: nowrap;">
                                
                                <button type="button" class="btn btn-link p-0" aria-label="Delete" data-id="${
                                  item.id
                                }">
                                    <img src="./assets/delete-svgrepo-com.svg" alt="Delete" style="width: 24px;">
                                </button>
                            </td>
                        `;
              tbody.appendChild(row);

              // DELETE HANDLER
              row
                .querySelector('[aria-label="Delete"]')
                .addEventListener("click", () => {
                  const id = row.querySelector('[aria-label="Delete"]').dataset
                    .id;
                  if (confirm("Are you sure you want to delete this entry?")) {
                    fetch("./api/delete_product_sold.php", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                      },
                      body: "id=" + encodeURIComponent(id),
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.status === "success") loadSoldProductTable();
                        else alert("Delete failed: " + data.message);
                      })
                      .catch((err) => {
                        console.error(err);
                        alert("An error occurred while deleting.");
                      });
                  }
                });
            });

            // Add subtotal row for this date group
            const totalRow = document.createElement("tr");
            totalRow.innerHTML = `
    <td colspan="9" style="text-align: right; font-weight: bold;">Total for ${date} </td>
    <td style="text-align: right; padding-right: 1.2rem; font-weight: bold;">${groupTotal.toLocaleString()} Ks</td>
    <td></td>
`;

            totalRow.style.backgroundColor = "#f8f9fa";
            tbody.appendChild(totalRow);
          });
      } else {
        alert("Error: " + result.message);
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      alert("Failed to load data.");
    });
}

function resetAddForm() {
  const form = document.querySelector("#inputRow form");
  form.reset();

  document.getElementById("duration").value = "";
  document.getElementById("end_date").value = "";
  document.getElementById("purchase_date").value = getThailandTodayDate();
  const productSelect = document.getElementById("product");
  productSelect.selectedIndex = 0;
}

// ========== INITIATE FORM BEHAVIOR ==========
document.addEventListener("DOMContentLoaded", () => {
  loadSoldProductTable();
  loadProductOptions();

  const purchaseDateInput = document.getElementById("purchase_date");
  const endDateInput = document.getElementById("end_date");
  const durationInput = document.getElementById("duration");
  const productSelect = document.getElementById("product");

  purchaseDateInput.value = getThailandTodayDate();

  productSelect.addEventListener("change", () => {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const duration = selectedOption.dataset.duration || 0;
    durationInput.value = duration;
    endDateInput.value = addMonthsToDate(purchaseDateInput.value, duration);
  });

  purchaseDateInput.addEventListener("change", () => {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    if (selectedOption) {
      const duration = selectedOption.dataset.duration || 0;
      endDateInput.value = addMonthsToDate(purchaseDateInput.value, duration);
    }
  });

  document
    .querySelector("#inputRow form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const selectedOption =
        document.getElementById("product").selectedOptions[0];
      const priceRaw = selectedOption?.dataset.price;
      const wcPriceRaw = selectedOption?.dataset.wcPrice;

      const price = priceRaw && !isNaN(priceRaw) ? parseFloat(priceRaw) : 0;
      const wcPrice =
        wcPriceRaw && !isNaN(wcPriceRaw) ? parseFloat(wcPriceRaw) : 0;
      const profit = price - wcPrice;
      const formData = new FormData();
      formData.append("product_id", document.getElementById("product").value);
      formData.append(
        "customer",
        document.getElementById("customer").value.trim()
      );
      formData.append(
        "gmail",
        document.getElementById("email").value.trim() || "-"
      );
      formData.append("price", price.toFixed(2));
      formData.append("profit", profit.toFixed(2));
      formData.append(
        "purchase_date",
        document.getElementById("purchase_date").value
      );
      formData.append("end_date", document.getElementById("end_date").value);
      formData.append("seller", document.getElementById("seller").value.trim());
      formData.append(
        "note",
        document.getElementById("Notes").value.trim() || "-"
      );
      fetch("./api/insert_sold_product.php", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            document.getElementById("inputRow").style.display = "none";
            resetAddForm();
            loadSoldProductTable();
          } else {
            alert("Insert failed: " + data.message);
          }
        })
        .catch((err) => {
          console.error(err);
          alert("An error occurred while adding.");
        });
    });
});
document
  .getElementById("searchCustomer")
  .addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();
    const rows = document.querySelectorAll("tbody tr");
    let withinMatchGroup = false;
    rows.forEach((row) => {
      const isSubtotalRow = row.innerText.includes("Total for");
      if (searchTerm === "") {
        row.style.display = "";
      } else if (isSubtotalRow) {
        row.style.display = "none";
      } else {
        const customerCell = row.children[3];
        const matches =
          customerCell &&
          customerCell.textContent.toLowerCase().includes(searchTerm);
        row.style.display = matches ? "" : "none";
      }
    });
  });
document.addEventListener("click", function (e) {
  if (e.target.closest(".edit-note-btn")) {
    const btn = e.target.closest(".edit-note-btn");
    const td = btn.closest("td");

    td.querySelector(".note-text").classList.add("d-none");
    td.querySelector(".note-edit-wrapper").classList.remove("d-none");
    btn.classList.add("d-none");
  }
  if (e.target.closest(".save-note-btn")) {
    const btn = e.target.closest(".save-note-btn");
    const td = btn.closest("td");
    const input = td.querySelector(".note-input");
    const note = input.value.trim();
    const noteText = td.querySelector(".note-text");
    noteText.textContent = note;
    td.querySelector(".note-edit-wrapper").classList.add("d-none");
    noteText.classList.remove("d-none");
    td.querySelector(".edit-note-btn").classList.remove("d-none");
    fetch("./api/edit_note.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        note,
      }),
    }).then((res) => {
      if (!res.ok) {
        alert("Failed to update note!");
      }
    });
  }
});
