document.addEventListener("DOMContentLoaded", () => {
    const number = document.getElementById('number');
    const visible = document.getElementById('visible');
    const single = document.getElementById('single');
    const plural = document.getElementById('plural');
    const add = document.getElementById('add');
    const subtract = document.getElementById('subtract');

    const replicant = nodecg.Replicant('counter');

    replicant.on('change', (newValue, oldValue) => {
        updateData(newValue);
    });

    single.addEventListener('keyup', (evt) => {
        replicant.value.single = evt.target.value;
    });

    plural.addEventListener('keyup', (evt) => {
        replicant.value.plural = evt.target.value;
    });

    number.addEventListener('keyup', (evt) => {
        replicant.value.number = parseInt(evt.target.value);
    });

    add.addEventListener('click', (evt) => {
        replicant.value.number++;
        number.value = replicant.value.number;
    });

    subtract.addEventListener('click', (evt) => {
        replicant.value.number--;
        number.value = replicant.value.number;
    });

    visible.addEventListener('change', (evt) => {
        replicant.value.visible = evt.target.checked;
    });

    function updateData(newValue)
    {
        number.value = newValue.number;
        single.value = newValue.single;
        plural.value = newValue.plural;
        visible.checked = newValue.visible;
    }
});
