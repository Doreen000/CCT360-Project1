// Progress (shared by every scene)
// Each scene stays locked until the previous one is finished.
// sessionStorage keeps progress while the tab is open; closing the tab starts a new game.
const PROGRESS_KEY = 'curiousCaseProgress';

function getProgress() {
    return Number(sessionStorage.getItem(PROGRESS_KEY)) || 1;
}

function unlockScene(sceneNumber) {
    if (sceneNumber > getProgress()) {
        sessionStorage.setItem(PROGRESS_KEY, sceneNumber);
    }
}

function resetProgress() {
    sessionStorage.removeItem(PROGRESS_KEY);
}

// Sends anyone who skips ahead (typing the URL, old bookmark) back to the bedroom
const currentScene = Number(document.body.dataset.scene) || 1;
if (currentScene > getProgress()) {
    window.location.replace('index.html');
}

// Grey out nav links for scenes that are still locked
document.querySelectorAll('nav a[data-scene]').forEach(function (link) {
    if (Number(link.dataset.scene) > getProgress()) {
        link.classList.add('locked');
        link.addEventListener('click', function (event) {
            event.preventDefault();
            say("“I can't go there... not yet.”", 'Me');
        });
    }
});

// Shows a line in the hint area; speaker is optional
function say(text, speaker) {
    document.getElementById('hint-text').innerHTML = text;
    if (speaker) {
        document.getElementById('speaker').textContent = speaker;
    }
}

// Fades to black, then loads the next page
let leavingScene = false;

function goTo(page, delay) {
    if (leavingScene) return;
    leavingScene = true;

    setTimeout(function () {
        const fade = document.createElement('div');
        fade.className = 'fade-screen';
        document.body.appendChild(fade);
        void fade.offsetWidth; // let the browser paint it transparent first so the fade animates
        fade.classList.add('active');
        setTimeout(function () {
            window.location.href = page;
        }, 800);
    }, delay);
}


// Scene 1
const objectHints = {
    portrait: "“Is this his room...? Could he be the one who kidnapped me?”",
    desk: "“It's locked.”",
    door: "“Wait... I should figure out where I am before I go out there.”",
    background:"“Why doesn't he have any stuff...?”",
    drawer: "The drawer unlocks, and you find a family photo along with your diary. You finally remember the last thing you wrote to your father. You saw the toll your illness took on your family, and on your memory. You tried to end their suffering, your suffering. It didn't work, but now maybe you think that that is for the better. Maybe one day you'll be as happy as you were in that photo again."
};

// The door only opens once the player has looked at all three
const requiredClues = ['portrait', 'desk', 'background'];
const cluesFound = new Set();

function inspectObject(objectName) {
    if (objectName === 'door') {
        openBedroomDoor();
        return;
    }

    cluesFound.add(objectName);
    if (objectHints[objectName]) {
        say(objectHints[objectName]);
    }
}

function openBedroomDoor() {
    const lookedAround = requiredClues.every(function (clue) {
        return cluesFound.has(clue);
    });

    if (!lookedAround && getProgress() < 2) {
        say(objectHints.door);
        return;
    }

    say("“...It opened? It wasn't even locked.”");
    unlockScene(2);
    goTo('scene2.html', 1500);
}


// Scene 2
// Left door leads down the stairs to scene 3, right door leads to the father's office (game over)
function chooseDoor(side) {
    if (leavingScene) return; // already walking through the other door

    if (side === 'left') {
        say("“Stairs... Maybe this is the way out.”");
        unlockScene(3);
        goTo('scene3.html', 1500);
    } else {
        say("“There's a light on in there... Maybe I can find out where I am.”");
        goTo('office.html', 1500);
    }
}


// Scene office
let noteRead = false;

function readNote() {
    if (noteRead) return;
    noteRead = true;

    say("The note says: <em>“Count from top to bottom.”</em><br>“Count what...? What does that mean?”");
    setTimeout(fatherAppears, 7000); // give the player time to read the hint
}

function fatherAppears() {
    document.getElementById('father').classList.add('visible');
    say("“You shouldn't be out! I'm taking you back.”", 'The man');
    setTimeout(function () {
        document.getElementById('game-over').hidden = false;
    }, 5000); // 3s ghost entrance + time to read his line
}

function playAgain() {
    resetProgress();
    window.location.href = 'index.html';
}


// Scene 3

// Password = what you count from top to bottom: 1 light, 2 closets, 1 box, 5 chairs
const BOX_PASSWORD = '1215';
let enteredCode = '';
let wrongTries = 0;
let boxOpened = false;
let hasKey = false;

function inspectBox() {
    if (hasKey) {
        say("“It's empty now.”");
    } else if (boxOpened) {
        showBoxContents();
    } else {
        document.getElementById('keypad').hidden = false;
    }
}

function pressKey(digit) {
    if (enteredCode.length >= 4) return;
    enteredCode += digit;
    updateKeypadDisplay();

    if (enteredCode.length === 4) {
        setTimeout(checkCode, 300); // let the 4th digit show before checking
    }
}

function deleteKey() {
    enteredCode = enteredCode.slice(0, -1);
    updateKeypadDisplay();
}

function clearCode() {
    enteredCode = '';
    updateKeypadDisplay();
}

function updateKeypadDisplay() {
    document.getElementById('keypad-display').textContent = enteredCode.padEnd(4, '_');
}

function checkCode() {
    const message = document.getElementById('keypad-message');

    if (enteredCode === BOX_PASSWORD) {
        boxOpened = true;
        closeKeypad();
        document.getElementById('box').src = 'box_open.PNG';
        say("“It opened! There's something inside...”");
        return;
    }

    wrongTries++;
    message.textContent = wrongTries >= 3
        ? "“Wrong again... Maybe the numbers are hidden somewhere in this room.”"
        : "“Wrong...”";

    // restart the shake animation even if it played last time
    const display = document.getElementById('keypad-display');
    display.classList.remove('shake');
    void display.offsetWidth;
    display.classList.add('shake');

    enteredCode = '';
    setTimeout(updateKeypadDisplay, 400);
}

function closeKeypad() {
    document.getElementById('keypad').hidden = true;
    document.getElementById('keypad-message').textContent = '';
    clearCode();
}

// Lets the player type the password on the keyboard too
document.addEventListener('keydown', function (event) {
    const keypad = document.getElementById('keypad');
    if (!keypad || keypad.hidden) return;

    if (event.key >= '0' && event.key <= '9') {
        pressKey(event.key);
    } else if (event.key === 'Backspace') {
        deleteKey();
    } else if (event.key === 'Escape') {
        closeKeypad();
    }
});

// The twist: the reflection turns into the face from the portrait in scene 1
// Each click on the overlay shows the next line; "show" is which mirror picture is visible
const mirrorLines = [
    { text: "“A mirror... and a key.”", show: 'mirror-plain' },
    { text: "“Is that... me? Why is my hair white...?”", show: 'reflection-white' },
    { text: "“Wait... these freckles... I've seen this face before.”", show: 'reflection-white' },
    { text: "“The boy in the portrait...! He has the same face as me.”", show: 'reflection-red' },
    { text: "“Was that portrait... of me?”", show: 'reflection-red' },
    { text: "You take the key.", show: 'reflection-red', takeKey: true }
];
let mirrorStep = 0;

function showBoxContents() {
    mirrorStep = 0;
    document.getElementById('mirror-view').hidden = false;
    showMirrorLine();
}

function showMirrorLine() {
    const line = mirrorLines[mirrorStep];
    document.getElementById('mirror-text').innerHTML = line.text;

    document.querySelectorAll('.reflection').forEach(function (picture) {
        picture.classList.toggle('visible', picture.id === line.show);
    });

    if (line.takeKey) {
        document.getElementById('box-key').classList.add('taken');
    }
}

function nextMirrorLine() {
    mirrorStep++;

    if (mirrorStep < mirrorLines.length) {
        showMirrorLine();
        return;
    }

    document.getElementById('mirror-view').hidden = true;
    hasKey = true;
    document.getElementById('inventory').hidden = false;
    say("“I have the key... Now, the door.”");
}

function tryExitDoor() {
    if (!hasKey) {
        say("“It's locked... I need a key.”");
        return;
    }

    say("“The key fits...! It's open. I'm getting out of here.”");
    unlockScene(4);
    goTo('scene4.html', 2000);
}

function showEndImage() {
    const el = document.getElementById('endImages');
    if (!el) {
        console.error('endImages element not found');
        return;
    }
    el.hidden = false;
}

