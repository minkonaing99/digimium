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
        <div class="logo" aria-label="Home"><a href="#"><img src="./assets/logo_digimium.png" alt=""></a></div>
        <nav>
            <div class="nav-links" id="navLinks">
                <a href="./home.php" aria-label="Home">Home</a>
                <?php if (isset($_SESSION['privilege']) && $_SESSION['privilege'] === 'admin'): ?>
                    <a href="./admin.php" aria-label="Admin">Admin</a>
                <?php endif; ?>
                <a href="./summary.php" aria-label="Summary">Summary</a>
                <button class="contact-btn" onclick="window.location.href='./api/logout.php'" aria-label="LogOut">Log
                    Out</button>
            </div>
            <div class="burger" id="burger" onclick="toggleMenu()" aria-label="Menu Toggle">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </nav>

    </header>
    <div class="container-fluid">
        <section class="menu-bar p-5 py-3">
            <div class="row d-flex justify-content-between align-items-center">
                <div class="col text-start">
                    <h1>Product Sold</h1>
                </div>
                <div class="col d-flex justify-content-end">
                    <div class="btn-group">
                        <input type="text" id="searchCustomer" class="form-control-sm me-md-4"
                            placeholder="Search by customer name..." />

                        <button class="contact-btn menu-btn" id="addBtn">Add Sale</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="table-section">
            <div id="inputRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                <!-- form staring point -->
                <form>
                    <div class="d-flex flex-wrap align-items-end gap-3 justify-content-evenly">
                        <div style="min-width: 180px; max-width: 300px; flex-grow: 1;">
                            <label for="product" class="form-label">Product List</label>
                            <select class="form-select form-select-sm" id="product">
                                <option selected disabled>Choose...</option>
                                <!-- Options will be added via JS -->
                            </select>
                        </div>

                        <div style="min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="customer" class="form-label">Customer</label>
                            <input type="text" class="form-control form-control-sm" id="customer" placeholder="Name">
                        </div>
                        <div style="min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="text" class="form-label">Email</label>
                            <input type="text" class="form-control form-control-sm" id="email"
                                placeholder="...@gmail.com">
                        </div>

                        <div style="min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="purchase_date" class="form-label">Purchase Date</label>
                            <input type="date" class="form-control form-control-sm" id="purchase_date">
                        </div>

                        <div style=" min-width: 200px; max-width: 300px; flex-grow: 1;">
                            <label for="seller" class="form-label">Seller</label>
                            <input type="text" class="form-control form-control-sm" id="seller" placeholder="seller"
                                value="Kaung Lin Thant">
                        </div>

                        <div style="min-width: 250px; max-width: 300px; flex-grow: 1;">
                            <label for="Notes" class="form-label">Notes</label>
                            <input type="text" class="form-control form-control-sm" id="Notes" placeholder="Note"
                                autocomplete="off">
                        </div>

                        <div style="min-width: 80px; flex-shrink: 0;">
                            <button type="submit" class=" contact-btn menu-btn mt-2 w-100">Save</button>
                        </div>

                    </div>
                    <input type="hidden" id="duration"> <!-- Hidden, used for end_date calculation -->
                    <input type="hidden" id="end_date"> <!-- Hidden, gets submitted with the form -->

                </form>
            </div>
            <div id="editRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">

            </div>




            <!-- Table Section -->
            <div class="table-responsive">
                <table class="table align-middle table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Duration</th>
                            <th>Customer</th>
                            <th>Gmail</th>
                            <th>Purchase Date</th>
                            <th>End Date</th>
                            <th>Seller</th>
                            <th>Note</th>
                            <th style="text-align: right; padding-right: 1.2rem">Price</th>
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

</body>

</html>