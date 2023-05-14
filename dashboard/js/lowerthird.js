document.addEventListener("DOMContentLoaded", () => {
    const visible = document.getElementById('visible');
    const title = document.getElementById('title');
    const subtitle = document.getElementById('subtitle');
    const update = document.getElementById('update');

    const replicant = nodecg.Replicant('lowerthird');

    replicant.on('change', (newValue, oldValue) => {
        if (newValue !== null) {
            updateData(newValue);
        }
    });

    visible.addEventListener('change', (evt) => {
        replicant.value.visible = evt.target.checked;
    });

    update.addEventListener('click', (evt) => {
        replicant.value.title = title.value;
        replicant.value.subtitle = subtitle.value;
    });

    function updateData(newValue)
    {
        title.value = newValue.title;
        subtitle.value = newValue.subtitle;
        visible.checked = newValue.visible;
    }
});
