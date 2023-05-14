document.addEventListener("DOMContentLoaded", () => {
    const interval = document.getElementById('interval');
    const visible = document.getElementById('visible');

    const replicant = nodecg.Replicant('carousel');

    replicant.on('change', (newValue, oldValue) => {
        updateData(newValue);
    });

    interval.addEventListener('keyup', (evt) => {
        replicant.value.interval = parseInt(evt.target.value);
    });

    visible.addEventListener('change', (evt) => {
        replicant.value.visible = evt.target.checked;
    });

    function updateData(newValue)
    {
        interval.value = newValue.interval;
        visible.checked = newValue.visible;
    }
});
