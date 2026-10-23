
const akkordData = {
    "Space Oddity": ["C", "Em", "Am", "D", "G"],
    "Ziggy Stardust": ["G", "D", "C", "Am"],
    "The Man Who Sold The World": ["Am", "D", "C", "G"]
};



function beregnVanskelighet(akkorder) {
    const enkleAkkorder = [
        "E", "A", "D", "Am", "C", "F", "Dm", "G", "Em"
    ];

    const vanskeligeAkkorder = [
        "F#m", "C#m", "G#m", "Bbm", "Eb", "Ab"
    ];

    if (akkorder.every(akkord =>
        enkleAkkorder.includes(akkord)
    )) {
        return "enkel";
    }

    if (akkorder.some(akkord =>
        vanskeligeAkkorder.includes(akkord)
    )) {
        return "vanskelig";
    }

    return "middels";
}
