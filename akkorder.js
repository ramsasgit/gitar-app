
const akkordData = {
    "Space Oddity": ["C", "Em", "Am", "D", "G"],
    "Ziggy Stardust": ["G", "D", "C", "Am"],
    "The Man Who Sold The World": ["Am", "D", "C", "G"],
    // Foreløpige testakkorder – må kvalitetssikres mot lovlige kilder.
    "God & Satan": ["G", "C", "D", "Em"],
    "Candy": ["G", "D", "Am", "Em"],
    "Another Love": ["Em", "Bm", "C", "G"],
    "The Night We Met": ["D", "F#m", "A", "E"],
    "How Low": ["F", "Eb", "Bb", "Dbmaj7"],
    "Sloom": ["Db", "Bbm", "Gb"],
    "I Will Follow You into the Dark": ["F", "C", "Dm", "Bb"]
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
