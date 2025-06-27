function navigateToLogin() {
  fetch('/auth/login-page')
    .then(res => res.text())
    .then(html => document.getElementById('content').innerHTML = html);
}

function navigateToUser() {
  fetch('/auth/user')
    .then(res => res.text())
    .then(html => document.getElementById('content').innerHTML = html);
}

function logout() {
  fetch('/auth/logout')
    .then(() => location.reload());
}
