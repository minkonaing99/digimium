<?php
session_start();

if (!isset($_SESSION['username']) && isset($_COOKIE['username'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

// Allow list
$allowedPrivileges = ['admin'];
$allowedLogincodes = ['200068'];

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
    <title>Product Page</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    <link rel="stylesheet" href="style.css">

</head>

<body>
    <header id="navbar">
        <div class="logo" aria-label="Home"><a href="./index.php"><img src="./assets/logo_digimium.png" alt=""></a></div>

        <nav>
            <div class="nav-links" id="navLinks">
                <a href="./home.php" aria-label="Home">Home</a>
                <?php if (isset($_SESSION['privilege']) && $_SESSION['privilege'] === 'admin'): ?>
                    <a href="./admin.php" aria-label="Admin">Admin</a>
                    <a href="./summary.php" aria-label="Summary">Summary</a>
                <?php endif; ?>
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
            <div class="row d-flex align-items-center">
                <div class="col text-start">
                    <h1>Product Page</h1>
                </div>
                <div class="col d-flex justify-content-end">
                    <div class="btn-group">
                        <button class="contact-btn menu-btn" id="addUser">Add User</button>
                        <button class="contact-btn menu-btn" id="addBtn">Add Product</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="table-section">
            <div id="inputRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                <!-- form staring point -->
                <form>
                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-md">
                            <label for="product" class="form-label">Product</label>
                            <input type="text" class="form-control form-control-sm" id="product" placeholder="Product">
                        </div>

                        <div class="col-12 col-md">
                            <label for="duration" class="form-label">Duration</label>
                            <input type="number" class="form-control form-control-sm" id="duration"
                                placeholder="Duration">
                        </div>

                        <div class="col-12 col-md">
                            <label for="supplier" class="form-label">Supplier</label>
                            <input type="text" class="form-control form-control-sm" id="supplier"
                                placeholder="Supplier">
                        </div>

                        <div class="col-12 col-md">
                            <label for="wc_price" class="form-label">WC Price</label>
                            <input type="number" class="form-control form-control-sm" id="wc_price">
                        </div>

                        <div class="col-12 col-md">
                            <label for="retail_price" class="form-label">Retail Price</label>
                            <input type="number" class="form-control form-control-sm" id="retail_price">
                        </div>

                        <div class="col-12 col-md">
                            <label for="Notes" class="form-label">Notes</label>
                            <input type="text" class="form-control form-control-sm" id="Notes" placeholder="Note"
                                autocomplete="off">
                        </div>

                        <div class="col-12 col-md">
                            <label for="link" class="form-label">Link</label>
                            <input type="text" class="form-control form-control-sm" id="link" placeholder="Link"
                                autocomplete="off">
                        </div>

                        <div class="col-12 col-md-auto">
                            <button type="submit" class="contact-btn menu-btn">Save</button>
                        </div>
                    </div>
                </form>




            </div>
            <div id="editRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
            </div>
            <div id="userRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                <form id="userForm">
                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-md">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control form-control-sm" id="username" placeholder="Username">
                        </div>

                        <div class="col-12 col-md">
                            <label for="password" class="form-label">Password</label>
                            <input type="text" class="form-control form-control-sm" id="password" placeholder="Password">
                        </div>

                        <div class="col-12 col-md">
                            <label for="Privilidge" class="form-label">Privilege</label>
                            <select class="form-select form-select-sm" id="Privilidge">
                                <option selected>Staff</option>
                                <option>Admin</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-auto">
                            <button type="submit" class="contact-btn menu-btn">Add User</button>
                        </div>
                    </div>
                </form>
            </div>





            <!-- Table Section -->
            <div class="table-responsive">
                <table class="table align-middle table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Duration</th>
                            <th>Supplier</th>
                            <th>Note</th>
                            <th>Link</th>
                            <th style="text-align: right; padding-right: 1.2rem">WC Price</th>
                            <th style="text-align: right; padding-right: 1.2rem">Retail Price</th>
                            <th>Set</th>
                        </tr>
                    </thead>
                    <tbody id="productTableBody">

                    </tbody>
                </table>
            </div>

        </section>
    </div>


    <script src="admin.js"></script>
    <script>
        document.getElementById('addUser').addEventListener('click', function() {
            const userRow = document.getElementById('userRow');

            if (userRow.style.display === 'none' || userRow.style.display === '') {
                userRow.style.display = 'flex'; // or 'block' depending on layout
            } else {
                userRow.style.display = 'none';
            }
        });
    </script>
    <script>
        // Get the form element
        const userForm = document.getElementById('userForm');

        // Define the handler function
        async function handleUserFormSubmit(e) {
            e.preventDefault();

            // Manually get input values
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const privilege = document.getElementById('Privilidge').value;

            // Create a FormData object manually
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('privilege', privilege);

            try {
                const response = await fetch('./api/add_user.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.text();

                if (result.trim() === 'success') {
                    alert('User added successfully!');
                    userForm.reset(); // Clear the form
                } else {
                    alert('Error: ' + result);
                }
            } catch (err) {
                alert('Fetch error: ' + err.message);
            }
        }

        // Attach the event listener
        userForm.addEventListener('submit', handleUserFormSubmit);
    </script>



</body>

</html>