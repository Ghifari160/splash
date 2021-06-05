import "../style/index.scss";

const themeNormalizationDelay = 500;

/**
 * Check if storage is supported and available
 * @param {Storage} type Storage type
 * @returns Storage availability
 */
function storageAvailable(type)
{
    let storage;

    try
    {
        storage = window[type];

        let x = "__storage_test__";

        storage.setItem(x, x);
        storage.removeItem(x);

        return true;
    }
    catch (e)
    {
        return e instanceof DOMException && (
            e.code === 22 ||
            e.code === 1014 ||
            e.name === "QuotaExceededError" ||
            e.name === "NS_ERROR_DOM_QUOTA_REACHED"
        ) && (storage && storage.length !== 0);
    }
}

let theme;

function normalizeTheme()
{
    // System preference detections
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

    // User preference detections
    if(storageAvailable("localStorage"))
    {
        let pref = window.localStorage.getItem("theme");

        if(pref !== null && pref == "dark")
        {
            theme = "dark";

            document.body.classList.add("darkmode");
            document.body.classList.remove("lightmode");
        }
        else if(pref !== null && pref == "light")
        {
            theme = "light";

            document.body.classList.add("lightmode");
            document.body.classList.remove("darkmode");
        }
    }

    if(document.body.classList.contains("darkmode"))
        document.querySelector(".footer__modeswitch .switch").classList.add("switch--active");
}

function onReady()
{
    // Theme mode normalizations

    setTimeout(function()
    {
        normalizeTheme();
    }, themeNormalizationDelay);

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

        if(storageAvailable("localStorage"))
            window.localStorage.setItem("theme", theme);
    });
}

document.onreadystatechange = () =>
{
    if(document.readyState === "complete")
        onReady();
}
