const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemImageFile = document.getElementById('item-image-file');
const fileChosenText = document.getElementById('file-chosen-text');
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const centerImg = document.getElementById('center-img');
const centerText = document.getElementById('center-text');
const groupNameSpan = document.getElementById('group-name-span');
const groupNameList = document.getElementById('group-name-list');
const contenderListDiv = document.getElementById('contender-list');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editNameInput = document.getElementById('edit-name-input');
const editImageFile = document.getElementById('edit-image-file');
const editFileText = document.getElementById('edit-file-text');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

let currentGroup = 'people';
let editingIndex = null;
let uploadedImageBase64 = '';
let editImageBase64 = '';
let currentRotation = 0;
let isSpinning = false;

// Load Saved Data from localStorage on Startup
let data = JSON.parse(localStorage.getItem('spinWheelData')) || {
    people: [],
    things: []
};

// Save Data to localStorage
function saveData() {
    localStorage.setItem('spinWheelData', JSON.stringify(data));
}

// Handle Image File Selection for New Items
itemImageFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileChosenText.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(evt) { uploadedImageBase64 = evt.target.result; };
        reader.readAsDataURL(file);
    }
});

// Handle Image File Selection for Editing Items
editImageFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        editFileText.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(evt) { editImageBase64 = evt.target.result; };
        reader.readAsDataURL(file);
    }
});

function switchGroup(groupName) {
    if (isSpinning) return;
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

// Add Item
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const image = uploadedImageBase64 || `https://api.dicebear.com/8.x/bottts/svg?seed=${name}`;

    if (name) {
        data[currentGroup].push({ name, image });
        saveData();
        itemNameInput.value = '';
        itemImageFile.value = '';
        fileChosenText.textContent = 'No picture chosen';
        uploadedImageBase64 = '';
        resetCenter();
        updateUI();
    }
});

// Reset Group
resetBtn.addEventListener('click', () => {
    if (isSpinning) return;
    data[currentGroup] = [];
    saveData();
    resetCenter();
    updateUI();
});

function resetCenter() {
    centerImg.classList.add('hidden');
    centerImg.src = '';
    centerText.classList.remove('hidden');
    centerText.textContent = 'SPIN';
    canvas.style.transition = 'none';
    canvas.style.transform = `rotate(0deg)`;
    currentRotation = 0;
}

// Delete Contender
window.deleteContender = function(index) {
    if (isSpinning) return;
    data[currentGroup].splice(index, 1);
    saveData();
    resetCenter();
    updateUI();
};

// Open Edit Modal
window.openEditModal = function(index) {
    if (isSpinning) return;
    editingIndex = index;
    const item = data[currentGroup][index];
    editNameInput.value = item.name;
    editImageBase64 = item.image; // default to existing
    editFileText.textContent = 'Keep current picture';
    editModal.classList.remove('hidden');
};

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
        data[currentGroup][editingIndex].name = editNameInput.value.trim();
        data[currentGroup][editingIndex].image = editImageBase64;
        saveData();
        editModal.classList.add('hidden');
        editingIndex = null;
        resetCenter();
        updateUI();
    }
});

cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingIndex = null;
});

// Update UI and Draw Wheel Canvas
function updateUI() {
    drawWheel();

    contenderListDiv.innerHTML = '';
    const items = data[currentGroup];

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `
            <div class="mini-info">
                <img src="${item.image}">
                <span>${item.name}</span>
            </div>
            <div class="mini-actions">
                <button class="btn btn-edit" onclick="openEditModal(${index})">Edit</button>
                <button class="btn btn-delete" onclick="deleteContender(${index})">Delete</button>
            </div>
        `;
        contenderListDiv.appendChild(div);
    });

    spinBtn.disabled = items.length < 2;
}

// Draw Wheel with Canvas (Images on Outer Perimeter touching the Center Circle)
function drawWheel() {
    const items = data[currentGroup];
    const n = items.length;
    const centerX = 180;
    const centerY = 180;
    const outerRadius = 175;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (n === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = "bold 18px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Add items to start!", centerX, centerY);
        return;
    }

    const arcSize = (Math.PI * 2) / n;
    const colors = ['#e94560', '#0f3460', '#533483', '#16213e', '#e94560', '#0f3460'];

    // 1. Draw Slices
    for (let i = 0; i < n; i++) {
        const angle = i * arcSize;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, angle, angle + arcSize);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();
    }

    // 2. Draw Images and Names around the Outer Ring
    items.forEach((item, i) => {
        const angle = i * arcSize + arcSize / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        // Position image near the outer edge
        const imgDist = 125; 
        const imgSize = 40;

        // Draw text name
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Segoe UI";
        ctx.fillText(item.name, outerRadius - 10, 5);

        // Draw image asset if loaded
        if (!item.imgObj) {
            item.imgObj = new Image();
            item.imgObj.src = item.image;
            item.imgObj.onload = () => drawWheel(); // Redraw once loaded
        } else if (item.imgObj.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(imgDist, 0, imgSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(item.imgObj, imgDist - imgSize / 2, -imgSize / 2, imgSize, imgSize);
            ctx.restore();
            
            // Gold border around picture
            ctx.beginPath();
            ctx.arc(imgDist, 0, imgSize / 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffd700';
            ctx.stroke();
        }

        ctx.restore();
    });

    // 3. Mask Center Hole matching CSS size (Radius 75 matches 150px width)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();
}

// Spin Wheel Physics Action
spinBtn.addEventListener('click', () => {
    const items = data[currentGroup];
    if (items.length < 2 || isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    resetCenter();

    const n = items.length;
    const sliceAngle = 360 / n;
    
    // Pick random winner index
    const winningIndex = Math.floor(Math.random() * n);
    
    // Calculate rotation angle so pointer lands on winning slice
    const randomFullSpins = 5 * 360; // 5 full rotations
    const targetAngleFromTop = (n - winningIndex) * sliceAngle - (sliceAngle / 2);
    const totalRotation = currentRotation + randomFullSpins + (targetAngleFromTop - (currentRotation % 360));

    currentRotation = totalRotation;
    canvas.style.transition = 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)';
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    // Reveal winner after spin completes
    setTimeout(() => {
        const winner = items[winningIndex];
        centerText.classList.add('hidden');
        centerImg.src = winner.image;
        centerImg.classList.remove('hidden');
        isSpinning = false;
        spinBtn.disabled = false;
    }, 4000);
});

// Initial load
updateUI();
