<?php
session_start();

if (!isset($_SESSION['username']) && isset($_COOKIE['username'], $_COOKIE['privilege'], $_COOKIE['logincode'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

$allowedPrivileges = ['admin', 'owner'];
$allowedLogincodes = ['200068'];

if (
    isset($_SESSION['privilege'], $_SESSION['logincode']) &&
    in_array($_SESSION['privilege'], $allowedPrivileges) &&
    in_array($_SESSION['logincode'], $allowedLogincodes)
) {
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
    <title>Admin Dashboard</title>
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
                <?php if (isset($_SESSION['privilege']) && ($_SESSION['privilege'] === 'admin' || $_SESSION['privilege'] === 'owner')): ?>
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
                    <h1>Retail Product Catalog | <a href="./wc_product_page.php" class="title_link">WC</a></h1>
                </div>
                <div class="col d-flex justify-content-end">
                    <div class="btn-group">
                        <button class="contact-btn menu-btn" id="addUser">Edit User</button>
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
                    <div class="row g-3 align-items-end ps-5">
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
            <div id="deleteUserRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                <form id="deleteUserForm">
                    <div class="row g-3 align-items-end ps-5">
                        <div style="min-width: 180px; max-width: 300px; flex-grow: 1;">
                            <label for="userList" class="form-label">User List</label>
                            <select class="form-select form-select-sm" id="userList">
                                <option selected disabled>Choose...</option>
                                <!-- Options will be added via JS -->
                            </select>
                        </div>
                        <div class="col-12 col-md-auto">
                            <button type="submit" class="contact-btn menu-btn" id="deleteUser">Delete User</button>
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
                        <!-- ---table content will be here---- -->
                    </tbody>
                </table>
            </div>

        </section>
    </div>


    <script src="admin.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const addUserBtn = document.getElementById('addUser');
            const userRow = document.getElementById('userRow');
            const deleteUserRow = document.getElementById('deleteUserRow');
            const userForm = document.getElementById('userForm');
            const deleteUserForm = document.getElementById('deleteUserForm');
            const userList = document.getElementById('userList');

            // Toggle user forms visibility
            addUserBtn.addEventListener('click', () => {
                const shouldShow = userRow.style.display === 'none' || userRow.style.display === '';
                userRow.style.display = shouldShow ? 'flex' : 'none';
                deleteUserRow.style.display = shouldShow ? 'block' : 'none';
            });

            // Load users into the dropdown
            function loadUserList() {
                userList.innerHTML = '<option selected disabled value="">Choose...</option>';
                fetch('./api/fetch_users.php')
                    .then(res => res.json())
                    .then(users => {
                        users.forEach(user => {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = `${user.username} (${user.privilege})`;
                            userList.appendChild(option);
                        });
                    })
                    .catch(err => {
                        console.error('Failed to load users:', err);
                    });
            }

            // Initial user list load
            loadUserList();

            // Handle Add User submission
            userForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                const privilege = document.getElementById('Privilidge').value;

                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                formData.append('privilege', privilege);

                try {
                    const res = await fetch('./api/add_user.php', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await res.text();

                    if (result.trim() === 'success') {
                        alert('User added successfully!');
                        userForm.reset();
                        userRow.style.display = 'none';
                        deleteUserRow.style.display = 'none';
                        loadUserList(); // refresh user list
                    } else {
                        alert('Error: ' + result);
                    }
                } catch (err) {
                    alert('Fetch error: ' + err.message);
                }
            });

            // Handle Delete User submission
            deleteUserForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const userId = userList.value;
                if (!userId) return alert('Please select a user to delete.');

                if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

                fetch('./api/delete_user.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            user_id: userId
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        alert(data.message);
                        if (data.success) {
                            userList.querySelector(`option[value="${userId}"]`)?.remove();
                            deleteUserForm.reset();
                            userRow.style.display = 'none';
                            deleteUserRow.style.display = 'none';
                        }
                    })
                    .catch(err => {
                        console.error('Error deleting user:', err);
                        alert('Something went wrong while deleting the user.');
                    });
            });
        });
    </script>




</body>

</html>