// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Here's an example of using NodeCG's logging API!");

const lowerthird = document.getElementById('lowerthird');
const text = document.getElementById('text');
function show()
{
    lowerthird.classList.add('fade-in');
    setTimeout(() => {
        lowerthird.classList.add('expand');
        setTimeout(() => {
            text.classList.add('fade-in');
        }, 100);
    }, 800);
}

function hide()
{
    text.classList.remove('fade-in');
    setTimeout(() => {
        lowerthird.classList.remove('expand');
        setTimeout(() => {
            lowerthird.classList.remove('fade-in');
        }, 800);
    }, 100);
}

setTimeout(show, 1000);
setTimeout(hide, 10000);