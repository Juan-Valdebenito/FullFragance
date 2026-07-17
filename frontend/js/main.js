(async function init() {
  const token = getToken();
  if (!token) return;

  try {
    const { user } = await Api.me();
    currentUser = user;
    document.getElementById("logoutBtn").style.display = "inline";
    afterAuthSuccess(user);
  } catch (err) {
    clearToken();
  }
})();
