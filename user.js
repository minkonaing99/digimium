document.addEventListener("DOMContentLoaded", () => {
  const addUserBtn = document.getElementById("addUser");
  const userRow = document.getElementById("userRow");
  const deleteUserRow = document.getElementById("deleteUserRow");
  const userForm = document.getElementById("userForm");
  const deleteUserForm = document.getElementById("deleteUserForm");
  const userList = document.getElementById("userList");
  addUserBtn.addEventListener("click", () => {
    const shouldShow =
      userRow.style.display === "none" || userRow.style.display === "";
    userRow.style.display = shouldShow ? "flex" : "none";
    deleteUserRow.style.display = shouldShow ? "block" : "none";
  });

  function loadUserList() {
    userList.innerHTML =
      '<option selected disabled value="">Choose...</option>';
    fetch("./api/fetch_users.php")
      .then((res) => res.json())
      .then((users) => {
        users.forEach((user) => {
          const option = document.createElement("option");
          option.value = user.id;
          option.textContent = `${user.username} (${user.privilege})`;
          userList.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
      });
  }
  loadUserList();
  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const privilege = document.getElementById("Privilidge").value;
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("privilege", privilege);
    try {
      const res = await fetch("./api/add_user.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.text();
      if (result.trim() === "success") {
        alert("User added successfully!");
        userForm.reset();
        userRow.style.display = "none";
        deleteUserRow.style.display = "none";
        loadUserList(); // refresh user list
      } else {
        alert("Error: " + result);
      }
    } catch (err) {
      alert("Fetch error: " + err.message);
    }
  });
  deleteUserForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userId = userList.value;
    if (!userId) return alert("Please select a user to delete.");
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;
    fetch("./api/delete_user.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        if (data.success) {
          userList.querySelector(`option[value="${userId}"]`)?.remove();
          deleteUserForm.reset();
          userRow.style.display = "none";
          deleteUserRow.style.display = "none";
        }
      })
      .catch((err) => {
        console.error("Error deleting user:", err);
        alert("Something went wrong while deleting the user.");
      });
  });
});
