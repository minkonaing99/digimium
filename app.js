(function () {
  // ========== DOM Helpers ==========
  const $ = (id) => document.getElementById(id);
  const todayDate = () => new Date().toLocaleDateString("en-CA");

  // ========== Form Validation ==========
  function initFormValidation() {
    const inputs = ["product", "customer", "purchase_date", "seller"].map($);
    inputs.forEach((input) => {
      input.addEventListener("input", validateFormFields);
      input.addEventListener("change", validateFormFields);
    });
    validateFormFields(); // Initial validation
  }

  // ========== Navigation ==========
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

  // ========== Add Form Toggle ==========
  function initAddFormToggle() {
    $("addBtn").onclick = () => {
      const row = $("inputRow");
      row.style.display = row.style.display === "none" ? "block" : "none";
    };
  }

  // ========== Date Utilities ==========
  function addMonthsToDate(dateStr, months) {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().split("T")[0];
  }

  // ========== Product Options ==========
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

  // ========== Sold Product Table ==========
  function loadSoldProductTable() {
    fetch("./api/fetch_product_sold.php")
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== "success") return alert(result.message);

        const tbody = document.querySelector("tbody");
        tbody.innerHTML = "";
        const groups = {};

        result.data.forEach((item) => {
          (groups[item.purchase_date] ??= []).push(item);
        });

        Object.entries(groups)
          .sort(([a], [b]) => b.localeCompare(a))
          .forEach(([date, rows]) => {
            let total = 0;
            rows.forEach((item, i) => {
              total += parseFloat(item.price);
              // Conditionally define the delete column
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
    <td>${item.product_name}</td>
    <td>${item.duration}</td>
    <td>${item.customer || ""}</td>
    <td>${item.gmail || ""}</td>
    <td>${item.purchase_date}</td>
    <td>${item.end_date}</td>
    <td>${item.seller || ""}</td>
    <td class="td-scrollable editable-note" data-id="${item.id}">
      <span class="note-text">${item.note || ""}</span>
      <input type="text" class="form-control form-control-sm note-input d-none" value="${
        item.note || ""
      }" />
    </td>
    <td style="text-align: right; padding-right: 1.2rem">${parseFloat(
      item.price
    ).toFixed(0)} Ks</td>
    ${deleteColumn}
  `;

              // Add delete event listener only if admin
              if (IS_ADMIN) {
                tr.querySelector('[aria-label="Delete"]').onclick = () =>
                  handleDelete(item.id);
              }

              tbody.appendChild(tr);
            });

            const totalRow = document.createElement("tr");
            totalRow.innerHTML = `
<td colspan="9" style="text-align:right;font-weight:bold;">Total for ${date}</td>
<td style="text-align:right;font-weight:bold;padding-right:1.2rem;">${total.toLocaleString()} Ks</td>
<td></td>`;
            totalRow.style.backgroundColor = "#f8f9fa";
            tbody.appendChild(totalRow);
          });
      })
      .catch((e) => {
        console.error("Table load error", e);
        alert("Failed to load table.");
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

  // ========== Add Form Logic ==========
  function resetAddForm() {
    const form = document.querySelector("#inputRow form");
    form.reset();

    $("duration").value = "";
    $("end_date").value = "";
    $("purchase_date").value = todayDate();
    $("product").selectedIndex = 0;

    // Re-validate to update label colors
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
            loadSoldProductTable();
          } else alert("Insert failed: " + res.message);
        })
        .catch((e) => {
          console.error(e);
          alert("Error while adding.");
        });
    };
  }

  // ========== Search ==========
  function initSearch() {
    $("searchCustomer").oninput = function () {
      const keyword = this.value.toLowerCase().trim();
      document.querySelectorAll("tbody tr").forEach((tr) => {
        const isTotalRow = tr.innerText.includes("Total for");
        if (!keyword) {
          tr.style.display = "";
        } else if (isTotalRow) {
          tr.style.display = "none";
        } else {
          const customerCell = tr.children[3];
          tr.style.display = customerCell.textContent
            .toLowerCase()
            .includes(keyword)
            ? ""
            : "none";
        }
      });
    };
  }

  // ========== Inline Note Edit ==========
  function initInlineNoteEditing() {
    document.addEventListener("click", (e) => {
      const td = e.target.closest(".editable-note");

      if (!td) return;

      // Cancel (without saving) any other open note
      document.querySelectorAll(".editable-note.editing").forEach((otherTd) => {
        if (otherTd !== td) cancelNote(otherTd);
      });

      // If not already editing, activate this cell
      if (!td.classList.contains("editing")) {
        td.classList.add("editing");
        const input = td.querySelector(".note-input");
        const span = td.querySelector(".note-text");

        // Set input value to current visible text (reset in case of stale value)
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

    // Cancel (revert) when input loses focus
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

    // Revert input value back to original text
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

  // ========== Init ==========
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
