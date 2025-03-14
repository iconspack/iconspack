import { colors } from "./colors.js";

const settingsModal = document.querySelector(".settings-modal");
const colorsContainer = settingsModal.querySelector(".colors");
const tiersContainer = document.querySelector(".tiers");
const cardsContainer = document.querySelector(".cards");

let activeTier;
let draggedImage = null;
let shadowElement = null;


const resetTierImages = (tier) => {
  const images = tier.querySelectorAll(".items img");
  images.forEach((img) => {
    cardsContainer.appendChild(img);
  });
};

const handleDeleteTier = () => {
  if (activeTier) {
    resetTierImages(activeTier);
    activeTier.remove();
    settingsModal.close();
  }
};

const handleClearTier = () => {
  if (activeTier) {
    resetTierImages(activeTier);
    settingsModal.close();
  }
};

const handlePrependTier = () => {
  if (activeTier) {
    tiersContainer.insertBefore(createTier(), activeTier);
    settingsModal.close();
  }
};

const handleAppendTier = () => {
  if (activeTier) {
    tiersContainer.insertBefore(createTier(), activeTier.nextSibling);
    settingsModal.close();
  }
};

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

const handleMoveTier = (tier, direction) => {
  const sibling =
    direction === "up" ? tier.previousElementSibling : tier.nextElementSibling;

  if (sibling) {
    const position = direction === "up" ? "beforebegin" : "afterend";
    sibling.insertAdjacentElement(position, tier);
  }
};

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

const handleDrop = (event) => {
  event.preventDefault(); // Prevent default browser handling
};

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

const initColorOptions = () => {
  colors.forEach((color) => {
    const label = document.createElement("label");
    label.style.setProperty("--color", color);
    label.innerHTML = `<input type="radio" name="color" value="${color}" />`;
    colorsContainer.appendChild(label);
  });
};

const initDefaultTierList = () => {
  ["S", "A", "B", "C", "D"].forEach((label) => {
    tiersContainer.appendChild(createTier(label));
  });
};

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

initDraggables();
initDefaultTierList();
initColorOptions();

// Event listeners

document.querySelector("h10").addEventListener("click", () => {
  tiersContainer.appendChild(createTier());
});

settingsModal.addEventListener("click", (event) => {
  // If the clicked element is the settings modal, close it
  if (event.target === settingsModal) {
    settingsModal.close();
  } else {
    const action = event.target.id;
    const actionMap = {
      delete: handleDeleteTier,
      clear: handleClearTier,
      prepend: handlePrependTier,
      append: handleAppendTier,
    };

    if (action && actionMap[action]) {
      actionMap[action]();
    }
  }
});

settingsModal.addEventListener("close", () => (activeTier = null));

settingsModal
  .querySelector(".tier-label")
  .addEventListener("input", (event) => {
    if (activeTier) {
      activeTier.querySelector(".label span").textContent = event.target.value;
    }
  });

colorsContainer.addEventListener("change", (event) => {
  if (activeTier) {
    activeTier
      .querySelector(".label")
      .style.setProperty("--color", event.target.value);
  }
});

cardsContainer.addEventListener("dragover", (event) => {
  event.preventDefault();

  if (draggedImage) {
    cardsContainer.appendChild(draggedImage);
  }
});

cardsContainer.addEventListener("drop", (event) => {
  event.preventDefault();
  cardsContainer.scrollLeft = cardsContainer.scrollWidth;
});













// Save or Download Button
const saveDownloadBtn = document.getElementById("save-download");
const previewDialog = document.getElementById("preview-dialog");
const previewImage = document.getElementById("preview-image");
const downloadBtn = document.getElementById("download-btn");
const closePreviewBtn = document.getElementById("close-preview");

saveDownloadBtn.addEventListener("click", async () => {
  // Capture the tiers container as an image
  const tiersContainer = document.querySelector(".tiers");
  const canvas = await html2canvas(tiersContainer, {
    scale: 2, // Increase scale for better quality
    logging: true,
    useCORS: true,
  });

  // Convert canvas to image URL
  const imageUrl = canvas.toDataURL("image/png");

  // Display the image in the preview dialog
  previewImage.src = imageUrl;
  previewDialog.showModal();

  // Download the image when the download button is clicked
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "tierlist.png";
    link.click();
  });
});

// Close the preview dialog
closePreviewBtn.addEventListener("click", () => {
  previewDialog.close();
});


        // Toggle hamburger menu and navigation links
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const stellarNav = document.getElementById('stellarNav');

        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            stellarNav.classList.toggle('active');
        });
