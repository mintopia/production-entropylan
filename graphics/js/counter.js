document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('container');
    const number = document.getElementById('number');
    const label = document.getElementById('label');

    const replicant = nodecg.Replicant('counter');

    replicant.on('change', (newValue) => {
        console.log(newValue.visible);
        if (newValue.visible) {
            container.classList.add('fade-in');
        } else {
            container.classList.remove('fade-in');
        }
        number.innerText = newValue.number;
        if (newValue.number === 1) {
            label.innerHTML = newValue.single;
        } else {
            label.innerHTML = newValue.plural;
        }
    });
});