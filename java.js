const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemImageInput = document.getElementById('item-image');
const centerImg = document.getElementById('center-img');
const centerText = document.getElementById('center-text');
const groupNameSpan = document.getElementById('group-name-span');
const groupNameList = document.getElementById('group-name-list');
const contenderListDiv = document.getElementById('contender-list');

// --- Data Management ---
let currentGroup = 'people'; // Default active group
const data = {
    people: [],
    things: []
};

// Visual settings for the wheel
const wheelColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', '#F5FF33'];
let currentRotation = 0;
let isSpinning = false;

// --- Initialization ---
function init() {
    updateUI();
}

// --- Switch Groups ---
function switchGroup(groupName) {
    currentGroup = groupName;
    
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(groupName)) btn.classList.add('active');
    });

    // Update text placeholders
    groupNameSpan.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);
    groupNameList.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);

    resetCenterWinner();
    updateUI();
}

// --- Add Item ---
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    // Use placeholder if empty, though form is set to required for name
    const image = itemImageInput.value.trim() || `https://api.dicebear.com/8.x/shapes/svg?seed=${name}`;

    if (name) {
        data[currentGroup].push({ name, image });
        itemNameInput.value = '';
        itemImageInput.value = '';
        resetCenterWinner();
        updateUI();
    }
});

// --- Reset Group ---
resetBtn.addEventListener('click', () => {
    data[currentGroup] = [];
    resetCenterWinner();
    updateUI();
});

// Reset the center display
function resetCenterWinner() {
    centerImg.classList.add('hidden');
    centerImg.src = '';
    centerText.classList.remove('hidden');
    centerText.textContent = 'SPIN';
    canvas.style.transition = 'none';
    canvas.style.transform = `rotate(0deg)`;
    currentRotation = 0;
}

// --- Main UI Update (Redraws wheel and list) ---
function updateUI() {
    drawWheel();
    
    // Update small list below
    contenderListDiv.innerHTML = '';
    data[currentGroup].forEach(item => {
        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `<img src="${item.image}" alt="${item.name}"> ${item.name}`;
        contenderListDiv.appendChild(div);
    });

    // Enable/Disable spin button
    spinBtn.disabled = data[currentGroup].length < 2;
}

// --- DRAWING THE WHEEL (Advanced) ---
function drawWheel() {
    const items = data[currentGroup];
    const n = items.length;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (n === 0) {
        // Draw empty wheel state
        ctx.beginPath();
        ctx.arc(200, 200, 190, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 5;
        ctx.stroke();
        drawText(200, 130, "Add items", "20px Arial", "#fff", 0);
        drawText(200, 170, "to get", "20px Arial", "#fff", 0);
        drawText(200, 210, "started!", "20px Arial", "#fff", 0);
        return;
    }

    const arcSize = (Math.PI * 2) / n;

    for (let i = 0; i < n; i++) {
        const angle = startAngle = i * arcSize;
        
        // 1. Draw Slice
        ctx.beginPath();
        ctx.moveTo(200, 200); // Center
        ctx.arc(200, 200, 190, angle, angle + arcSize);
        ctx.closePath();
        ctx.fillStyle = wheelColors[i % wheelColors.length];
        ctx.fill();
        ctx.stroke();

        // 2. Draw Image and Text (Complex Math)
        saveAndDraw(angle, arcSize, items[i], i);
    }
    
    // Masks the center hole (drawn over images/text)
    ctx.beginPath();
    ctx.arc(200, 200, 102, 0, Math.PI * 2); 
    ctx.fillStyle = '#1a1a2e'; // Matches CSS background
    ctx.fill();
}

// Rotates canvas context, draws image/text, restores context
function saveAndDraw(angle, arcSize, item, index) {
    ctx.save();
    
    // Rotate to the middle of the slice
    ctx.translate(200, 200);
    ctx.rotate(angle + arcSize / 2);

    // --- Draw Text ---
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Segoe UI";
    
    // Move position out along radius, then adjust for aesthetics
    const textRadius = 150; 
    // Draw text slightly curved (generalized as straight for simplicity here, curved is math-heavy)
    ctx.fillText(item.name, textRadius, 6); 

    // --- Draw Image ---
    // Requires loading image object externally or using an image loader utility
    // For this example, we assume images are pre-loaded or cached by browser
    if (item.imgObj) {
        const imgSize = 30;
        const imgRadius = 115; // Just outside the center hole
        ctx.save();
            // Images are drawn top-left aligned to coordinate, so adjust
            ctx.drawImage(item.imgObj, imgRadius, -imgSize/2, imgSize, imgSize);
        ctx.restore();
    }

    ctx.restore();
}

// Utility to preload images before drawing
function preloadImages(callback) {
    let loadedCounter = 0;
    const items = data[currentGroup];
    const n = items.length;

    if (n === 0) { callback(); return; }

    items.forEach((item, index) => {
        item.imgObj = new Image();
        item.imgObj.src = item.image;
        // CrossOrigin required for some external URLs, though might fail locally
        item.imgObj.cross
