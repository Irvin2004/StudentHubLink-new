const profileButton =
document.getElementById("profileButton");

const profileDropdown =
document.getElementById("profileDropdown");

if (profileButton && profileDropdown) {

    profileButton.addEventListener("click", () => {

        profileDropdown.classList.toggle("show");

    });

}

window.addEventListener("click", (event) => {

    if(
        profileButton &&
        profileDropdown &&
        !profileButton.contains(event.target) &&
        !profileDropdown.contains(event.target)
    ){

        profileDropdown.classList.remove("show");

    }

});
