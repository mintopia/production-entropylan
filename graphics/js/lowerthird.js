document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('container');
    const title = document.getElementById('title');
    const subtitle = document.getElementById('subtitle');

    const replicant = nodecg.Replicant('lowerthird');

    replicant.on('change', (newValue) => {
        if (newValue === undefined) {
            return;
        }
        title.innerHTML = newValue.title;
        subtitle.innerHTML = newValue.subtitle;

        if (newValue.visible) {
            container.classList.add('fade-in');
        } else {
            container.classList.remove('fade-in');
        }
    });
});