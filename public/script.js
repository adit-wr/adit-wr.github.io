document.addEventListener('DOMContentLoaded', function() {
    const elementsLeft = document.querySelectorAll('.fade-in-left');
    const elementsRight = document.querySelectorAll('.fade-in-right');
    const elementsTop = document.querySelectorAll('.fade-in-top');
    const elementsBot = document.querySelectorAll('.fade-in-bot');

    function checkFade() {
        elementsLeft.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('active');
            }
        });
        elementsRight.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('active');
            }
        });
        elementsTop.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('active');
            }
        });
        elementsBot.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('active');
            }
        });
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    checkFade();

    window.addEventListener('scroll', checkFade);
    window.addEventListener('resize', checkFade);
});
