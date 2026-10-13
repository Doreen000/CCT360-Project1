// Scene 1
const objectHints = {
    portrait: "“Is the person in that portrait the owner of this room...? Could he be the one who kidnapped me?”",
    desk: "“It's locked.”",
    door: "“The door is locked.”",
    background:"“Why are there barely any everyday items in this room...?”"
};

function inspectObject(objectName) {
    const hintTextElement = document.getElementById('hint-text');
    
    if (objectHints[objectName]) {
        hintTextElement.innerHTML = objectHints[objectName];
    }
}

// Scene 2


// Scene office


// Scene 3