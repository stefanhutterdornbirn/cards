document.addEventListener('DOMContentLoaded', function () {
    const menuItems = document.querySelectorAll('.has-submenu > a');
    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('active');
        });
    });
});
