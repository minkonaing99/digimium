document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    try {
      const response = await fetch("./api/login.php", {
        method: "POST",
        body: formData,
      });
      const text = await response.text();
      if (text.trim() === "success") {
        window.location.href = "retail_sales_overview.php";
      } else {
        alert(text);
      }
    } catch (err) {
      alert("Error occurred: " + err.message);
    }
  });
