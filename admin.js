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
document.getElementById("addBtn").addEventListener("click", function () {
  const inputRow = document.getElementById("inputRow");
  inputRow.style.display = inputRow.style.display === "none" ? "block" : "none";
});
function loadProductTable() {
  fetch("./api/fetching_productlist.php")
    .then((response) => response.json())
    .then((result) => {
      const tableBody = document.getElementById("productTableBody");
      tableBody.innerHTML = "";

      if (result.status === "success") {
        result.data.forEach((item, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${item.product_name}</td>
                        <td>${item.duration}</td>
                        <td>${item.supplier || ""}</td>
                        <td class="td-scrollable">${item.notes || ""}</td>
                        <td class="td-scrollable">
  ${
    item.link
      ? `
    <span class="copy-link" data-link="${item.link}" style="text-decoration: underline; color: blue; cursor: pointer;">
      ${item.link}
    </span>
  `
      : ""
  }
</td>
                        <td style="text-align: right; padding-right: 1.2rem">${parseFloat(
                          item.wc_price
                        ).toFixed(0)} Ks</td>
                        <td style="text-align: right; padding-right: 1.2rem">${parseFloat(
                          item.retail_price
                        ).toFixed(0)} Ks</td>
                        <td style="width: 60px; text-align: right; white-space: nowrap;">
                            <button type="button" class="btn btn-link p-0 me-2 edit-btn" aria-label="Edit"
                                data-id="${item.product_id}"
                                data-product="${item.product_name}"
                                data-duration="${item.duration}"
                                data-supplier="${item.supplier}"
                                data-wc_price="${item.wc_price}"
                                data-retail_price="${item.retail_price}"
                                data-notes="${item.notes}"
                                data-link="${item.link}">
                                <img src="./assets/edit-svgrepo-com.svg" alt="Edit" style="width: 24px;">
                            </button>
                            <button type="button" class="btn btn-link p-0 delete-btn" aria-label="Delete" data-id="${
                              item.product_id
                            }">
                                <img src="./assets/delete-svgrepo-com.svg" alt="Delete" style="width: 24px;">
                            </button>
                        </td>`;
          tableBody.appendChild(row);
        });
      } else {
        alert("Error fetching data: " + result.message);
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      alert("Failed to fetch product list.");
    });
}
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("copy-link")) {
    const linkText = e.target.getAttribute("data-link");
    navigator.clipboard
      .writeText(linkText)
      .then(() => {
        e.target.style.color = "green";
        setTimeout(() => {
          e.target.style.color = "blue";
        }, 1000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }
});
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();
  const product = document.getElementById("product").value.trim();
  const duration = document.getElementById("duration").value.trim();
  const supplier = document.getElementById("supplier").value.trim();
  const wc_price = document.getElementById("wc_price").value.trim();
  const retail_price = document.getElementById("retail_price").value.trim();
  const notes = document.getElementById("Notes").value.trim() || "-";
  const link = document.getElementById("link").value.trim() || "-";

  if (!product || !duration || !supplier || !wc_price || !retail_price) {
    alert("Please fill in all required fields.");
    return;
  }
  const product_name =
    product +
    " (" +
    duration +
    " " +
    (duration == 1 ? "Month" : "Months") +
    ")";
  const formData = new FormData();
  formData.append("product_name", product_name);
  formData.append("duration", duration);
  formData.append("supplier", supplier);
  formData.append("wc_price", wc_price);
  formData.append("retail_price", retail_price);
  formData.append("notes", notes);
  formData.append("link", link);
  fetch("./api/insert_product.php", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        this.reset();
        loadProductTable();
      } else {
        alert("Failed to add product: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Insert error:", error);
      alert("An error occurred while inserting.");
    });
});
document.addEventListener("click", function (e) {
  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");
  if (editBtn) {
    const editRow = document.getElementById("editRow");
    editRow.style.display = "block";
    editRow.innerHTML = `
        <form id="editForm">
            <input type="hidden" id="edit_id" value="${editBtn.dataset.id}">
            <div class="row g-3 align-items-end">
                <div class="col-12 col-md"><label class="form-label">Product</label><input type="text" class="form-control form-control-sm" id="edit_product" value="${editBtn.dataset.product}"></div>
                <div class="col-12 col-md"><label class="form-label">Duration</label><input type="text" class="form-control form-control-sm" id="edit_duration" value="${editBtn.dataset.duration}"></div>
                <div class="col-12 col-md"><label class="form-label">Supplier</label><input type="text" class="form-control form-control-sm" id="edit_supplier" value="${editBtn.dataset.supplier}"></div>
                <div class="col-12 col-md"><label class="form-label">WC Price</label><input type="number" class="form-control form-control-sm" id="edit_wc_price" value="${editBtn.dataset.wc_price}"></div>
                <div class="col-12 col-md"><label class="form-label">Retail Price</label><input type="number" class="form-control form-control-sm" id="edit_retail_price" value="${editBtn.dataset.retail_price}"></div>
                <div class="col-12 col-md"><label class="form-label">Notes</label><input type="text" class="form-control form-control-sm" id="edit_Notes" value="${editBtn.dataset.notes}"></div>
                <div class="col-12 col-md"><label class="form-label">Link</label><input type="text" class="form-control form-control-sm" id="edit_link" value="${editBtn.dataset.link}"></div>
                <div class="col-12 col-md-auto"><button type="submit" class="btn btn-primary btn-sm mt-2 w-100">Save</button></div>
            </div>
        </form>`;
  }
  if (deleteBtn) {
    const productId = deleteBtn.getAttribute("data-id");
    if (confirm("Are you sure you want to delete this product?")) {
      fetch("./api/delete_product.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `product_id=${encodeURIComponent(productId)}`,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            loadProductTable();
          } else {
            alert("Failed to delete product: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          alert("An error occurred while deleting.");
        });
    }
  }
});
document.addEventListener("submit", function (e) {
  if (e.target.id === "editForm") {
    e.preventDefault();
    const formData = new FormData();
    formData.append("product_id", document.getElementById("edit_id").value);
    formData.append(
      "product_name",
      document.getElementById("edit_product").value.trim()
    );
    formData.append(
      "duration",
      document.getElementById("edit_duration").value.trim()
    );
    formData.append(
      "supplier",
      document.getElementById("edit_supplier").value.trim()
    );
    formData.append(
      "wc_price",
      document.getElementById("edit_wc_price").value.trim()
    );
    formData.append(
      "retail_price",
      document.getElementById("edit_retail_price").value.trim()
    );
    formData.append(
      "notes",
      document.getElementById("edit_Notes").value.trim() || "-"
    );
    formData.append(
      "link",
      document.getElementById("edit_link").value.trim() || "-"
    );

    fetch("./api/update_product.php", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          document.getElementById("editRow").style.display = "none";
          loadProductTable();
        } else {
          alert("Failed to update product: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Update error:", error);
        alert("An error occurred while updating.");
      });
  }
});
document.addEventListener("DOMContentLoaded", loadProductTable);
