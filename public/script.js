document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
      threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    document.querySelectorAll('.fade-in-left, .fade-in-right, .fade-in-top, .fade-in-bot, .fade').forEach(el => {
      observer.observe(el);
    });
  });