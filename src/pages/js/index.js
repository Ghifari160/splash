import "../style/index.scss";

function onReady()
{
    // Theme mode normalizations

    // System preference detections
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    if(prefersDarkScheme.matches)
        document.body.classList.add("darkmode");
    else
        document.body.classList.add("lightmode");

    if(document.body.classList.contains("darkmode"))
        document.querySelector(".footer__modeswitch .switch").classList.add("switch--active");

    // End of theme mode normalizations

    // Toggle switch handler
    document.querySelectorAll(".switch").forEach((el) =>
    {
        el.addEventListener("click", (e) =>
        {
            el.classList.toggle("switch--active");
        });
    });

    // Theme mode toggle switch handler
    document.querySelector(".footer__modeswitch .switch").addEventListener("click", (e) =>
    {
        document.body.classList.toggle("lightmode");
        document.body.classList.toggle("darkmode");
    })
}

document.onreadystatechange = () =>
{
    if(document.readyState === "complete")
        onReady();
}
