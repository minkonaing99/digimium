<?php
session_start();

if (!isset($_SESSION['username']) && isset($_COOKIE['username'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

// Allow list
$allowedPrivileges = ['admin', 'staff'];
$allowedLogincodes = ['200068', '200038'];

if (
    (isset($_SESSION['privilege']) && in_array($_SESSION['privilege'], $allowedPrivileges)) ||
    (isset($_SESSION['logincode']) && in_array($_SESSION['logincode'], $allowedLogincodes))
) {
    // allow access
} else {
    header("Location: index.php");
    exit();
}

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Home</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    <link rel="stylesheet" href="style.css">

</head>

<body>
    <header id="navbar">
        <div class="logo" aria-label="Home"><a href="./index.php"><img src="./assets/logo_digimium.png" alt=""></a></div>

        <nav>
            <?php $currentPage = basename($_SERVER['PHP_SELF']); ?>
            <div class="nav-links" id="navLinks">
                <a href="./retail_sales_overview.php"
                    class="<?= ($currentPage === 'retail_sales_overview.php' || $currentPage === 'wholesale_sales_overview.php') ? 'active' : '' ?>">
                    Sales Overview
                </a>

                <?php if (isset($_SESSION['privilege']) && ($_SESSION['privilege'] === 'admin' || $_SESSION['privilege'] === 'owner')): ?>
                    <a href="./retail_product_catalog.php"
                        class="<?= $currentPage === 'retail_product_catalog.php' ? 'active' : '' ?>"
                        aria-label="Product Catalog">Product Catalog</a>
                    <a href="./summary.php"
                        class="<?= $currentPage === 'summary.php' ? 'active' : '' ?>"
                        aria-label="Summary">Summary</a>
                <?php endif; ?>

                <button class="contact-btn" onclick="window.location.href='./api/logout.php'" aria-label="LogOut">
                    Log Out
                </button>
            </div>
            <div class="burger" id="burger" onclick="toggleMenu()" aria-label="Menu Toggle">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </nav>

    </header>
    <div class="container-fluid">
        <section class="menu-bar p-md-5 py-md-3 p-1">
            <div class="row d-flex justify-content-between align-items-center">
                <div class="col-12 col-md text-center text-md-start">
                    <h1>
                        Retail |
                        <a href="./wholesale_sales_overview.php" class="title_link">Wholesale</a>
                    </h1>
                </div>
                <div class="col d-flex justify-content-end">
                    <div class="btn-group">
                        <?php if (isset($_SESSION['privilege']) && ($_SESSION['privilege'] === 'admin' || $_SESSION['privilege'] === 'owner')): ?>
                            <button class="contact-btn menu-btn order-2 order-md-1 d-none d-md-inline" id="downloadBtn" style="border: none; background: none; padding: 0;">
                                <img src="./assets/download-svgrepo-com.svg" alt="" width="24px" style="border: none;">
                            </button>
                        <?php endif; ?>
                        <input type="text" id="searchCustomer"
                            class="form-control-sm custom-input mx-md-4 order-1 order-md-2 d-none d-md-inline"
                            style="max-width: 250px;"
                            placeholder="Search by customer name..." />
                        <button class="contact-btn menu-btn mobile-btn order-3" id="addBtn"><span class="d-none d-md-inline">Add Product</span><img src="./assets/add-icon.svg" alt="" width="24px" style="border: none;" class="m-2 m-md-0 d-md-none"></button>



                    </div>
                </div>
            </div>
        </section>

        <section class="table-section">
            <div id="inputRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                <form>
                    <div class="row gy-3 gx-4">
                        <div class="col-12 col-md-6 col-lg">
                            <label for="product" class="form-label text-danger">Product List</label>
                            <select class="form-select form-select-sm" id="product">
                                <option selected disabled>Choose...</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-6 col-lg">
                            <label for="customer" class="form-label text-danger">Customer</label>
                            <input type="text" class="form-control form-control-sm" id="customer" placeholder="Name">
                        </div>

                        <div class="col-12 col-md-6 col-lg">
                            <label for="email" class="form-label">Email</label>
                            <input type="text" class="form-control form-control-sm" id="email" placeholder="...@....">
                        </div>

                        <div class="col-12 col-md-6 col-lg">
                            <label for="purchase_date" class="form-label text-danger">Purchase Date</label>
                            <input type="date" class="form-control form-control-sm" id="purchase_date">
                        </div>

                        <div class="col-12 col-md-6 col-lg">
                            <label for="seller" class="form-label">Manager</label>
                            <input type="text" class="form-control form-control-sm" id="seller"
                                value="<?= isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : '' ?>"
                                placeholder="seller">
                        </div>

                        <div class="col-12 col-md-6 col-lg">
                            <label for="amount" class="form-label">Amount</label>
                            <input type="number" class="form-control form-control-sm" id="amount" step="1" placeholder="Enter price (optional)">
                        </div>

                        <div class="col-12 col-md-6 col-lg">
                            <label for="Notes" class="form-label">Notes</label>
                            <input type="text" class="form-control form-control-sm" id="Notes" placeholder="Note" autocomplete="off">
                        </div>

                        <div class="col-12 col-md-6 col-lg d-grid">
                            <label class="invisible">Save</label>
                            <button type="submit" class="contact-btn menu-btn">Save</button>
                        </div>
                    </div>

                    <!-- Hidden fields -->
                    <input type="hidden" id="duration">
                    <input type="hidden" id="end_date">
                </form>



                <!-- <form>
                    <div class="d-flex flex-wrap align-items-end gap-3 justify-content-evenly">
                        <div style="min-width: 180px; max-width: 300px; flex-grow: 1;">
                            <label for="product" class="form-label">Product List</label>
                            <select class="form-select form-select-sm" id="product">
                                <option selected disabled>Choose...</option>
                            </select>
                        </div>
                        <div style="min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="customer" class="form-label">Customer</label>
                            <input type="text" class="form-control form-control-sm" id="customer" placeholder="Name">
                        </div>
                        <div style="min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="text" class="form-label">Email</label>
                            <input type="text" class="form-control form-control-sm" id="email"
                                placeholder="...@....">
                        </div>
                        <div style="min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="purchase_date" class="form-label">Purchase Date</label>
                            <input type="date" class="form-control form-control-sm" id="purchase_date">
                        </div>
                        <div style=" min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="seller" class="form-label">Manager</label>
                            <input type="text" class="form-control form-control-sm" id="seller" placeholder="seller"
                                value="<?= isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : '' ?>">

                        </div>
                        <div style=" min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="amount" class="form-label">Amount</label>
                            <input type="number" id="amount" class="form-control form-control-sm" step="1" placeholder="Enter price (optional)">
                        </div>
                        <div style="min-width: 250px; max-width: 300px; flex-grow: 1;">
                            <label for="Notes" class="form-label">Notes</label>
                            <input type="text" class="form-control form-control-sm" id="Notes" placeholder="Note"
                                autocomplete="off">
                        </div>
                        <div style="min-width: 80px; flex-shrink: 0;">
                            <button type="submit" class="contact-btn menu-btn mt-2 w-100" id="submitBtn" id="submitBtn">Save</button>
                        </div>
                    </div>
                    <input type="hidden" id="duration"> 
                <input type="hidden" id="end_date"> 
                </form> -->

            </div>
            <div id="editRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
            </div>


            <!-- ✅ This is the correct wrapper -->
            <div id="mobile-table" class="d-md-none"></div>

            <!-- <div class="row p-3 d-flex d-md-none " id="mobile-table">
                <div class="col-8">Total for 2025-07-20</div>
                <div class="col-4 text-end">350000KS</div>
                <div class="col-12 d-flex align-items-center">
                    <span class="me-2">${count}</span>
                    <div class="flex-grow-1 border-bottom"></div>
                </div>
                <div class="col-8 product-name">${item.product_name}</div>
                <div class="col-4 text-end">Price</div>
                <div class="col-12">${item.customer}</div>
                <div class="col-12">${item.gmail ?? "-"}</div>
                <div class="col-6">PD - 2025-07-20</div>
                <div class="col-6 text-end">ED - 2025-07-21</div>
                <div class="col-2">Notes</div>
                <div class="col-10">This is note demo</div>
            </div> -->
            <!-- Spinner Loader -->
            <div id="table-loader" style="display: none; text-align: center; margin: 1rem;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table align-middle table-hover d-none d-md-table table-font">
                    <thead class="table-light">
                        <tr>
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 40px;">#</th> <!-- Small index column -->
                                    <th style="min-width: 200px;">Product</th> <!-- Flexible product name -->
                                    <th style="width: 60px;">Dur</th> <!-- Tight duration -->
                                    <th style="min-width: 180px;">Customer</th> <!-- Customer name wider -->
                                    <th style="min-width: 150px;">Email</th> <!-- Give email room -->
                                    <th class="text-center no-wrap">Purchased</th>
                                    <th class="text-center no-wrap">End Date</th>
                                    <th style="min-width: 180px;">Manager</th> <!-- Manager wide -->
                                    <th style="width: 100px;">Note</th> <!-- Fixed width for note -->
                                    <th style="white-space: nowrap; text-align: right; padding: 0rem 1rem">Price</th>
                                    <th style="width: 25px;"></th> <!-- Optional: Delete button column -->
                                </tr>
                            </thead>
                            <!-- changes to price -->
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                    </tbody>
                </table>
            </div>







        </section>
    </div>
    <script src="app.js"></script>
    <script>
        const IS_ADMIN = <?= isset($_SESSION['privilege']) && $_SESSION['privilege'] === 'admin' ? 'true' : 'false' ?>;
        console.log(IS_ADMIN);
        document.getElementById("downloadBtn").addEventListener("click", () => {
            if (confirm("Do you want to download the product sold data as CSV?")) {
                window.location.href = "./api/download_product_sold.php";
            }
        });
    </script>
</body>

</html>