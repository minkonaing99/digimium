(function () {
  let SOLD_PRODUCT_DATA = []; // 💾 Global reference for all sold product rows
  const $ = (id) => document.getElementById(id);
  const todayDate = () => new Date().toLocaleDateString("en-CA");
  function initFormValidation() {
    const inputs = ["product", "customer", "purchase_date", "seller"].map($);
    inputs.forEach((input) => {
      input.addEventListener("input", validateFormFields);
      input.addEventListener("change", validateFormFields);
    });
    validateFormFields();
  }
  function initNavigationToggle() {
    const burger = $("burger"),
      navLinks = $("navLinks");
    burger.onclick = () => {
      burger.classList.toggle("open");
      navLinks.classList.toggle("active");
    };
    document.querySelectorAll("#navLinks a").forEach((link) =>
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        burger.classList.remove("open");
      })
    );
  }
  function initAddFormToggle() {
    $("addBtn").onclick = () => {
      const row = $("inputRow");
      row.style.display = row.style.display === "none" ? "block" : "none";
    };
  }
  function addMonthsToDate(dateStr, months) {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().split("T")[0];
  }
  function loadProductOptions() {
    fetch("./api/fetch_product_options.php")
      .then((res) => res.json())
      .then((data) => {
        const product = $("product");
        product.innerHTML = `<option selected disabled>Choose...</option>`;
        if (data.status === "success") {
          data.products.forEach((p) => {
            const opt = new Option(p.product_name, p.product_id);
            opt.dataset.duration = p.duration;
            opt.dataset.price = p.retail_price;
            opt.dataset.wcPrice = p.wc_price;
            product.add(opt);
          });
        }
      })
      .catch((e) => console.error("Product options load failed", e));
  }
  function loadSoldProductTable() {
    const cached = sessionStorage.getItem("cachedSoldData");
    const loader = document.getElementById("table-loader");
    const tbody = document.querySelector("tbody");
    const mobileContainer = document.getElementById("mobile-table");

    tbody.innerHTML = "";
    mobileContainer.innerHTML = "";

    if (cached) {
      const parsed = JSON.parse(cached);
      SOLD_PRODUCT_DATA = parsed;
      renderSoldProductTable(parsed);
      return;
    }

    if (loader) loader.style.display = "block";

    fetch("./api/fetch_product_sold.php")
      .then((res) => res.json())
      .then((result) => {
        if (loader) loader.style.display = "none";
        if (result.status !== "success") return alert(result.message);
        SOLD_PRODUCT_DATA = result.data;
        renderSoldProductTable(SOLD_PRODUCT_DATA);

        sessionStorage.setItem("cachedSoldData", JSON.stringify(result.data));
        renderSoldProductTable(result.data);
      })
      .catch((e) => {
        if (loader) loader.style.display = "none";
        console.error("Table load error", e);
        alert("Failed to load table.");
      });
  }

  function renderSoldProductTable(data) {
    const isMobile = window.innerWidth < 768;
    const tbody = document.querySelector("tbody");
    const mobileContainer = document.getElementById("mobile-table");
    const loader = document.getElementById("table-loader");

    tbody.innerHTML = "";
    mobileContainer.innerHTML = "";
    if (loader) loader.style.display = "none";

    const groups = {};
    data.forEach((item) => {
      (groups[item.purchase_date] ??= []).push(item);
    });

    Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, rows]) => {
        let total = 0;
        const fragment = document.createDocumentFragment();

        rows.forEach((item, i) => {
          const price = parseFloat(item.price);
          total += price;

          if (isMobile) {
            const mobileRow = document.createElement("div");
            mobileRow.className = "row p-3 pt-1 border-bottom";
            mobileRow.innerHTML = `
            <div class="col-12 d-flex align-items-center mb-2">
              <span class="me-2">${i + 1}</span>
              <div class="flex-grow-1 border-bottom"></div>
            </div>
            <div class="col-8 product-name">${item.product_name}</div>
            <div class="col-4 text-end">${price.toLocaleString()} Ks</div>
            <div class="col-12">${item.customer}</div>
            <div class="col-12">${item.gmail || "-"}</div>
            <div class="col-6">PD - ${item.purchase_date}</div>
            <div class="col-6 text-end">ED - ${item.end_date}</div>
            <div class="col-2">Notes</div>
            <div class="col-10">${item.note || "-"}</div>
          `;
            fragment.appendChild(mobileRow);
          } else {
            const deleteColumn = IS_ADMIN
              ? `<td style="width:60px; text-align:right;">
                <button class="btn btn-link p-0" aria-label="Delete" data-id="${item.id}">
                  <img src="./assets/delete-svgrepo-com.svg" alt="Delete" style="width: 24px;">
                </button>
              </td>`
              : "<td></td>";

            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${i + 1}</td>
            <td class="td-scrollable">${item.product_name}</td>
            <td class="text-center">${item.duration}</td>
            <td>${item.customer || ""}</td>
            <td>${item.gmail || "-"}</td>
            <td class="text-center nowrap">${item.purchase_date}</td>
            <td class="text-center nowrap">${item.end_date}</td>
            <td>${item.seller || ""}</td>
            <td class="td-scrollable editable-note" data-id="${item.id}">
              <span class="note-text">${item.note || ""}</span>
              <input type="text" class="form-control form-control-sm note-input d-none" value="${
                item.note || ""
              }" />
            </td>
            <td style="text-align:right;padding-right:1.2rem;">${price.toFixed(
              0
            )} Ks</td>
            ${deleteColumn}
          `;
            if (IS_ADMIN) {
              tr.querySelector('[aria-label="Delete"]').onclick = () =>
                handleDelete(item.id);
            }
            fragment.appendChild(tr);
          }
        });

        if (isMobile) {
          const mobileTotal = document.createElement("div");
          mobileTotal.className = "row p-3 pb-1 border-top";
          mobileTotal.innerHTML = `
          <div class="col-7 fw-bold">Total for ${date}</div>
          <div class="col-5 text-end fw-bold">${total.toLocaleString()} Ks</div>
        `;
          fragment.appendChild(mobileTotal);
          mobileContainer.appendChild(fragment);
        } else {
          const totalRow = document.createElement("tr");
          totalRow.innerHTML = `
          <td colspan="9" style="text-align:right;font-weight:bold;">Total for ${date}</td>
          <td style="text-align:right;font-weight:bold;padding-right:1.2rem;">${total.toLocaleString()} Ks</td>
          <td></td>
        `;
          totalRow.style.backgroundColor = "#f8f9fa";
          fragment.appendChild(totalRow);
          tbody.appendChild(fragment);
        }
      });
  }

  function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    fetch("./api/delete_product_sold.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "id=" + encodeURIComponent(id),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") loadSoldProductTable();
        else alert("Delete failed: " + data.message);
        sessionStorage.removeItem("cachedSoldData");
      })
      .catch((e) => {
        console.error(e);
        alert("An error occurred while deleting.");
      });
  }
  function validateFormFields() {
    const required = ["product", "customer", "purchase_date", "seller"].map($);
    required.forEach((input) => {
      const label = input.closest("div").querySelector("label");
      const isInvalid = !input.value.trim() || input.value === "Choose...";
      label.classList.toggle("text-danger", isInvalid);
    });
  }
  function resetAddForm() {
    const form = document.querySelector("#inputRow form");
    form.reset();

    $("duration").value = "";
    $("end_date").value = "";
    $("purchase_date").value = todayDate();
    $("product").selectedIndex = 0;
    validateFormFields();
  }
  function initFormSubmission() {
    const form = document.querySelector("#inputRow form");
    const product = $("product");
    const purchaseDate = $("purchase_date");
    const endDate = $("end_date");
    const duration = $("duration");
    const amount = $("amount");
    purchaseDate.value = todayDate();
    product.onchange = () => {
      const opt = product.selectedOptions[0];
      const dur = opt?.dataset.duration || 0;
      duration.value = dur;
      endDate.value = addMonthsToDate(purchaseDate.value, dur);
    };
    purchaseDate.onchange = () => product.onchange();
    form.onsubmit = (e) => {
      e.preventDefault();
      const opt = product.selectedOptions[0] || {};
      const manual = parseFloat(amount?.value);
      const price = !isNaN(manual)
        ? manual
        : parseFloat(opt.dataset.price || 0);
      const wc = parseFloat(opt.dataset.wcPrice || 0);
      const profit = price - wc;
      const data = new FormData();
      data.append("product_id", product.value);
      data.append("customer", $("customer").value.trim());
      data.append("gmail", $("email").value.trim() || "-");
      data.append("price", price.toFixed(2));
      data.append("profit", profit.toFixed(2));
      data.append("purchase_date", purchaseDate.value);
      data.append("end_date", endDate.value);
      data.append("seller", $("seller").value.trim());
      data.append("note", $("Notes").value.trim() || "-");
      fetch("./api/insert_sold_product.php", {
        method: "POST",
        body: data,
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === "success") {
            $("inputRow").style.display = "none";
            resetAddForm();
            sessionStorage.removeItem("cachedSoldData");
            loadSoldProductTable();
          } else alert("Insert failed: " + res.message);
        })
        .catch((e) => {
          console.error(e);
          alert("Error while adding.");
        });
    };
  }
  function initSearch() {
    const searchInput = document.getElementById("searchCustomer");
    if (!searchInput) return;

    searchInput.addEventListener("keydown", function (e) {
      const keyword = this.value.toLowerCase().trim();

      if (e.key === "Enter") {
        const filtered = !keyword
          ? SOLD_PRODUCT_DATA
          : SOLD_PRODUCT_DATA.filter((item) =>
              (item.customer || "").toLowerCase().includes(keyword)
            );
        renderSoldProductTable(filtered);
      }

      if (e.key === "Escape") {
        this.value = "";
        renderSoldProductTable(SOLD_PRODUCT_DATA);
      }
    });
  }

  function initInlineNoteEditing() {
    document.addEventListener("click", (e) => {
      const td = e.target.closest(".editable-note");
      if (!td) return;
      document.querySelectorAll(".editable-note.editing").forEach((otherTd) => {
        if (otherTd !== td) cancelNote(otherTd);
      });
      if (!td.classList.contains("editing")) {
        td.classList.add("editing");
        const input = td.querySelector(".note-input");
        const span = td.querySelector(".note-text");
        input.value = span.textContent.trim();
        span.classList.add("d-none");
        input.classList.remove("d-none");
        input.focus();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.target.matches(".note-input") && e.key === "Enter") {
        e.preventDefault();
        saveNote(e.target);
      }
    });
    document.addEventListener(
      "blur",
      (e) => {
        if (e.target.matches(".note-input")) {
          setTimeout(() => {
            cancelNote(e.target.closest(".editable-note"));
          }, 100);
        }
      },
      true
    );
  }
  function cancelNote(td) {
    if (!td || !td.classList.contains("editing")) return;
    const input = td.querySelector(".note-input");
    const span = td.querySelector(".note-text");
    input.value = span.textContent.trim();
    td.classList.remove("editing");
    input.classList.add("d-none");
    span.classList.remove("d-none");
  }
  function saveNote(input) {
    const td = input.closest(".editable-note");
    const span = td.querySelector(".note-text");
    const id = td.dataset.id;
    const newNote = input.value.trim();
    if (newNote === span.textContent.trim()) {
      td.classList.remove("editing");
      input.classList.add("d-none");
      span.classList.remove("d-none");
      return;
    }
    span.textContent = newNote;
    td.classList.remove("editing");
    input.classList.add("d-none");
    span.classList.remove("d-none");
    fetch("./api/edit_note.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, note: newNote }),
    }).catch(() => alert("Error saving note"));
  }
  document.addEventListener("DOMContentLoaded", () => {
    initNavigationToggle();
    initAddFormToggle();
    initFormValidation();
    initFormSubmission();
    initSearch();
    initInlineNoteEditing();
    loadSoldProductTable();
    loadProductOptions();
  });
})();
