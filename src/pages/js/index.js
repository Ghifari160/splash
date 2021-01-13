import "../style/index.scss";

function onReady()
{
    // Theme mode normalizations
    document.body.classList.add("lightmode");

    if(document.body.classList.contains("darkmode"))
        document.querySelector(".footer__modeswitch .switch").classList.add("switch--active");

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
