document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('container');

    const replicant = nodecg.Replicant('carousel');
    let interval = 30;

    const images = container.getElementsByTagName('img');
    let pointer = images.length - 1;
    let timeout = null;

    const updateVisibility = (visible) => {
        if (visible) {
            if (container.classList.contains('fade-in')) {
                return;
            }

            if (timeout) {
                clearTimeout(timeout);
            }
            for (const image of images) {
                image.classList.remove('fade-in');
            }
            pointer = images.length - 1;
            container.classList.add('fade-in');
            updateImage();

        } else {
            if (!container.classList.contains('fade-in')) {
                return;
            }
            if (timeout !== null) {
                clearTimeout(timeout);
            }
            for (const image of images) {
                image.classList.remove('fade-in');
            }
            container.classList.remove('fade-in');
            pointer = images.length - 1;
        }
    }

    replicant.on('change', (newValue) => {
        if (newValue === undefined) {
            return;
        }

        updateVisibility(newValue.visible);
        interval = newValue.interval;
    });

    const updateImage = () => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        const current = images[pointer];
        pointer++;
        if (pointer >= images.length) {
            pointer = 0;
        }
        const next = images[pointer];
        current.classList.remove('fade-in');
        next.classList.add('fade-in');
        timeout = setTimeout(updateImage, interval * 1000);
    }
    updateImage();
});