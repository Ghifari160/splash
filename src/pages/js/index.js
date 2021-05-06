import "../style/index.scss";

function onReady()
{
    let theme,
        themeSet = false;

    // Theme mode normalizations

    // System preference detections
    if(!themeSet)
    {
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

        if(prefersDarkScheme.matches)
        {
            document.body.classList.add("darkmode");
            theme = "dark";
        }
        else
        {
            document.body.classList.add("lightmode");
            theme = "light";
        }
    }

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

        if(theme == "dark")
            theme = "light";
        else
            theme = "dark";
    });
}

document.onreadystatechange = () =>
{
    if(document.readyState === "complete")
        onReady();
}
