const API = "http://localhost:3000";

function register() {
  fetch(`${API}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("userId", data.userId);
        window.location.href = "dashboard.html";;
      } else {
        alert(data.message);
      }
    });
}

function login() {
  fetch(`${API}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("userId", data.user.id);
        window.location.href = "dashboard.html";
      } else {
        alert(data.message);
      }
    });
}

function livePreview() {
  const form = document.getElementById("portfolioForm");
  const preview = document.getElementById("preview");

  const fullName = form.full_name.value || "Your Name";
  const title = form.title.value || "Your Title";
  const about = form.about.value || "Your about section will appear here.";
  const skills = form.skills.value || "HTML, CSS, JavaScript";
  const projects = form.projects.value || "Your projects here";
  const theme = form.theme.value;

  preview.className = `preview-card ${theme}`;

  preview.innerHTML = `
    <h2>${fullName}</h2>
    <h3>${title}</h3>
    <p>${about}</p>
    <p><b>Skills:</b> ${skills}</p>
    <p><b>Projects:</b> ${projects}</p>
  `;
}

const portfolioForm = document.getElementById("portfolioForm");

if (portfolioForm) {
  portfolioForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(portfolioForm);
    formData.append("user_id", localStorage.getItem("userId"));

    fetch(`${API}/api/portfolio`, {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Portfolio Published Successfully");
          window.location.href = `portfolio.html?id=${data.portfolioId}`;
        } else {
          alert(data.message);
        }
      });
  });
}

let allPortfolios = [];

function loadGallery() {
  fetch(`${API}/api/gallery`)
    .then(res => res.json())
    .then(data => {
      allPortfolios = data;
      displayGallery(data);
    });
}

function displayGallery(data) {
  const gallery = document.getElementById("gallery");

  if (data.length === 0) {
    gallery.innerHTML = "<h2>No portfolios found</h2>";
    return;
  }

  gallery.innerHTML = data.map(item => `
    <div class="portfolio-card">
      ${item.photo ? `<img src="${item.photo}">` : ""}
      <h2>${item.full_name}</h2>
      <h3>${item.title}</h3>
      <p>${item.about}</p>

      <div class="card-actions">
        <span>👁 ${Math.floor(Math.random() * 500) + 50}</span>
        <span>❤️ ${Math.floor(Math.random() * 100) + 10}</span>
      </div>

      <a class="btn" href="portfolio.html?id=${item.id}">View Portfolio</a>
    </div>
  `).join("");
}

function searchGallery() {
  const keyword = document.getElementById("searchBox").value.toLowerCase();

  const filtered = allPortfolios.filter(item =>
    item.full_name.toLowerCase().includes(keyword) ||
    item.title.toLowerCase().includes(keyword) ||
    item.skills.toLowerCase().includes(keyword)
  );

  displayGallery(filtered);
}

function loadPortfolio() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  fetch(`${API}/api/portfolio/${id}`)
    .then(res => res.json())
    .then(item => {
      console.log(item);

      document.getElementById("portfolioView").innerHTML = `
        <div class="full-portfolio">
          ${item.photo ? `<img src="${item.photo}">` : ""}
          <h1>${item.full_name}</h1>
          <h2>${item.title}</h2>
          <p>${item.about}</p>

          <h3>Skills</h3>
          <p>${item.skills}</p>

          <h3>Projects</h3>
          <p>${item.projects}</p>

          <p>👁 ${item.views || 0} ❤️ ${item.likes || 0}</p>

          <p>
            <a href="${item.github}" target="_blank">GitHub</a> |
            <a href="${item.linkedin}" target="_blank">LinkedIn</a>
          </p>
        </div>
      `;
    });
}

<a class="btn" href="portfolio.html?id=${item.id}">View Portfolio</a>