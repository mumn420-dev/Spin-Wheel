const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemImageFile = document.getElementById('item-image-file');
const fileChosenText = document.getElementById('file-chosen-text');
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const centerImg = document.getElementById('center-img');
const centerText = document.getElementById('center-text');
const groupNameSpan = document.getElementById('group-name-span');
const groupNameList = document.getElementById('group-name-list');
const contenderListDiv = document.getElementById('contender-list');

let currentGroup = 'people';
const data = {
    people: [],
    things: []
};

let uploadedImageBase64 = '';

// Handle Image File Selection
itemImageFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileChosenText.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            uploadedImageBase64 = uploadEvent.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fileChosenText.textContent = 'No picture chosen';
        uploadedImageBase64 = '';
    }
});

// Switch Groups
function switchGroup(groupName) {
    currentGroup = groupName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(groupName)) btn.classList.add('active');
    });

    groupNameSpan.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);
    groupNameList.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);

    resetCenter();
    updateUI();
}

// Add Item Form Submit
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    // Fallback avatar if no image uploaded
    const image = uploadedImageBase64 || `https://api.dicebear.com/8.x/bottts/svg?seed=${name}`;

    if (name) {
        data[currentGroup].push({ name, image });
        itemNameInput.value = '';
        itemImageFile.value = '';
        fileChosenText.textContent = 'No picture chosen';
        uploadedImageBase64 = '';
        resetCenter();
        updateUI();
    }
});

// Reset Group Data
resetBtn.addEventListener('click', () => {
    data[currentGroup] = [];
    resetCenter();
    updateUI();
});

function resetCenter() {
    centerImg.classList.add('hidden');
    centerImg.src = '';
    centerText.classList.remove('hidden');
    centerText.textContent = 'SPIN';
}

// Update UI & Distribute items around circumference
function updateUI() {
    wheel.innerHTML = '';
    contenderListDiv.innerHTML = '';

    const items = data[currentGroup];
    const n = items.length;

    items.forEach((item, index) => {
        // 1. Populate Circumference Wheel Nodes
        const angle = (index / n) * 360;
        const radius = 105; // Distance from center
        
        // Trigonometry to place items in a circular layout
        const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
        const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;

        const node = document.createElement('div');
        node.className = 'wheel-item';
        node.style.transform = `translate(${x}px, ${y}px)`;
        node.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
        wheel.appendChild(node);

        // 2. Populate Small Contender List below
        const mini = document.createElement('div');
        mini.className = 'mini-item';
        mini.innerHTML = `<img src="${item.image}"> ${item.name}`;
        contenderListDiv.appendChild(mini);
    });

    spinBtn.disabled = n < 2;
}

// Spin Animation Logic (Shining sequential lights)
spinBtn.addEventListener('click', () => {
    const items = data[currentGroup];
    if (items.length < 2) return;

    spinBtn.disabled = true;
    resetCenter();

    const nodeElements = wheel.querySelectorAll('.wheel-item');
    let currentIndex = 0;
    let loops = 0;
    const maxLoops = 3;
    let speed = 60;
    const totalSteps = (maxLoops * items.length) + Math.floor(Math.random() * items.length);
    let currentStep = 0;

    function runShining() {
        // Remove shine from all nodes
        nodeElements.forEach(el => el.classList.remove('shine'));

        // Add shine to current node
        nodeElements[currentIndex].classList.add('shine');

        currentIndex = (currentIndex + 1) % items.length;
        currentStep++;

        if (currentStep < totalSteps) {
            // Gradually slow down the lighting effect
            speed += 8;
            setTimeout(runShining, speed);
        } else {
            // Landed on final winner (previous index before moving forward)
            const winningIndex = (currentIndex - 1 + items.length) % items.length;
            const winner = items[winningIndex];

            nodeElements.forEach(el => el.classList.remove('shine'));
            nodeElements[winningIndex].classList.add('shine');

            // Show winner in the center circle
            setTimeout(() => {
                centerText.classList.add('hidden');
                centerImg.src = winner.image;
                centerImg.classList.remove('hidden');
                spinBtn.disabled = false;
            }, 400);
        }
    }

    runShining();
});
