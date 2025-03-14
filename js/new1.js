import { colors } from "./colors.js";

const settingsModal = document.querySelector(".settings-modal");
const colorsContainer = settingsModal.querySelector(".colors");
const tiersContainer = document.querySelector(".tiers");
const cardsContainer = document.querySelector(".cards");
const saveDownloadBtn = document.querySelector(".save-download-btn");
const previewBox = document.querySelector(".preview-box");
const previewTiers = document.querySelector(".preview-tiers");
const closePreviewBtn = document.querySelector(".close-preview");
const downloadImageBtn = document.querySelector(".download-image-btn");

let activeTier;
let draggedImage = null;
let shadowElement = null;

// Reset tier images
const resetTierImages = (tier) => {
  const images = tier.querySelectorAll(".items img");
  images.forEach((img) => {
    cardsContainer.appendChild(img);
  });
};

// Handle delete tier
const handleDeleteTier = () => {
  if (activeTier) {
    resetTierImages(activeTier);
    activeTier.remove();
    settingsModal.close();
  }
};

// Handle clear tier
const handleClearTier = () => {
  if (activeTier) {
    resetTierImages(activeTier);
    settingsModal.close();
  }
};

// Handle prepend tier
const handlePrependTier = () => {
  if (activeTier) {
    tiersContainer.insertBefore(createTier(), activeTier);
    settingsModal.close();
  }
};

// Handle append tier
const handleAppendTier = () => {
  if (activeTier) {
    tiersContainer.insertBefore(createTier(), activeTier.nextSibling);
    settingsModal.close();
  }
};

// Handle settings click
const handleSettingsClick = (tier) => {
  activeTier = tier;

  // Populate the textarea
  const label = tier.querySelector(".label");
  settingsModal.querySelector(".tier-label").value = label.innerText;

  // Select the color
  const color = getComputedStyle(label).getPropertyValue("--color");
  settingsModal.querySelector(`input[value="${color}"]`).checked = true;

  settingsModal.showModal();
};

// Handle move tier
const handleMoveTier = (tier, direction) => {
  const sibling =
    direction === "up" ? tier.previousElementSibling : tier.nextElementSibling;

  if (sibling) {
    const position = direction === "up" ? "beforebegin" : "afterend";
    sibling.insertAdjacentElement(position, tier);
  }
};

// Handle dragover
const handleDragover = (event) => {
  event.preventDefault(); // Allow drop

  const target = event.target;

  if (target.classList.contains("items")) {
    target.appendChild(draggedImage);
  } else if (target.tagName === "IMG" && target !== draggedImage) {
    const { left, width } = target.getBoundingClientRect();
    const midPoint = left + width / 2;

    if (event.clientX < midPoint) {
      target.before(draggedImage);
    } else {
      target.after(draggedImage);
    }
  }
};

// Handle drop
const handleDrop = (event) => {
  event.preventDefault(); // Prevent default browser handling
};

// Create tier
const createTier = (label = "Change me") => {
  const tierColor = colors[tiersContainer.children.length % colors.length];

  const tier = document.createElement("div");
  tier.className = "tier";
  tier.innerHTML = `
  <div class="label" contenteditable="plaintext-only" style="--color: ${tierColor}">
    <span>${label}</span>
  </div>
  <div class="items"></div>
  <div class="controls">
    <button class="settings"><i class="bi bi-gear-fill"></i></button>
    <button class="moveup"><i class="bi bi-chevron-up"></i></button>
    <button class="movedown"><i class="bi bi-chevron-down"></i></button>
  </div>`;

  // Attach event listeners
  tier
    .querySelector(".settings")
    .addEventListener("click", () => handleSettingsClick(tier));
  tier
    .querySelector(".moveup")
    .addEventListener("click", () => handleMoveTier(tier, "up"));
  tier
    .querySelector(".movedown")
    .addEventListener("click", () => handleMoveTier(tier, "down"));
  tier.querySelector(".items").addEventListener("dragover", handleDragover);
  tier.querySelector(".items").addEventListener("drop", handleDrop);

  return tier;
};

// Initialize color options
const initColorOptions = () => {
  colors.forEach((color) => {
    const label = document.createElement("label");
    label.style.setProperty("--color", color);
    label.innerHTML = `<input type="radio" name="color" value="${color}" />`;
    colorsContainer.appendChild(label);
  });
};

// Initialize default tier list
const initDefaultTierList = () => {
  ["S", "A", "B", "C", "D"].forEach((label) => {
    tiersContainer.appendChild(createTier(label));
  });
};

// Initialize draggables
const initDraggables = () => {
  const images = cardsContainer.querySelectorAll("img");
  images.forEach((img) => {
    img.draggable = true;

    // Mouse events
    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", "");
      img.classList.add("dragging");
      draggedImage = img;
    });

    img.addEventListener("dragend", () => {
      img.classList.remove("dragging");
      draggedImage = null;
    });

    img.addEventListener("dblclick", () => {
      if (img.parentElement !== cardsContainer) {
        cardsContainer.appendChild(img);
        cardsContainer.scrollLeft = cardsContainer.scrollWidth;
      }
    });

    // Enable scrolling while dragging
    img.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        const startX = e.clientX;
        const startY = e.clientY;

        const handleMouseMove = (e) => {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          // Scroll the container if the mouse moves near the edges
          const scrollSpeed = 10;
          if (deltaY < -50) {
            cardsContainer.scrollBy(0, -scrollSpeed); // Scroll up
          } else if (deltaY > 50) {
            cardsContainer.scrollBy(0, scrollSpeed); // Scroll down
          }
          if (deltaX < -50) {
            cardsContainer.scrollBy(-scrollSpeed, 0); // Scroll left
          } else if (deltaX > 50) {
            cardsContainer.scrollBy(scrollSpeed, 0); // Scroll right
          }
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    });

    // Touch events
    img.addEventListener("touchstart", (e) => {
      e.preventDefault();
      draggedImage = img;
      img.classList.add("dragging");

      // Create a shadow element
      shadowElement = img.cloneNode(true);
      shadowElement.style.position = "fixed";
      shadowElement.style.top = `${e.touches[0].clientY}px`;
      shadowElement.style.left = `${e.touches[0].clientX}px`;
      shadowElement.style.pointerEvents = "none";
      shadowElement.style.opacity = "0.5";
      shadowElement.style.zIndex = "1000";
      shadowElement.style.transform = "translate(-50%, -50%)";
      document.body.appendChild(shadowElement);

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    img.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (draggedImage && shadowElement) {
        const touch = e.touches[0];
        shadowElement.style.top = `${touch.clientY}px`;
        shadowElement.style.left = `${touch.clientX}px`;
      }
    });

    img.addEventListener("touchend", (e) => {
      e.preventDefault();
      if (draggedImage && shadowElement) {
        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

        if (targetElement && targetElement.classList.contains("items")) {
          targetElement.appendChild(draggedImage);
        }

        // Clean up
        shadowElement.remove();
        shadowElement = null;
        draggedImage.classList.remove("dragging");
        draggedImage = null;
      }
    });
  });
};

// Show preview box and populate tiers
saveDownloadBtn.addEventListener("click", () => {
  previewBox.classList.add("active");
  previewTiers.innerHTML = tiersContainer.innerHTML; // Copy tiers to preview
});

// Close preview box
closePreviewBtn.addEventListener("click", () => {
  previewBox.classList.remove("active");
});

// Download preview as PNG
downloadImageBtn.addEventListener("click", () => {
  html2canvas(previewTiers).then((canvas) => {
    const link = document.createElement("a");
    link.download = "tierlist.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});

// Initialize
initDraggables();
initDefaultTierList();
initColorOptions();
