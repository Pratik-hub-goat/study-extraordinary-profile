
/* =========================================
   STUDY EXTRAORDINARY
   STUDENT PROFILE ENGINE
   BLOCK 1 — SETUP
========================================= */

import {
  db,
  auth,
  ensureAnonymousUser
} from "./Firebase.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


/* =========================================
   CLOUDINARY CONFIGURATION
========================================= */

const CLOUDINARY_CLOUD_NAME = "dpogbzi0";

const CLOUDINARY_UPLOAD_PRESET =
  "study_extraordinary_profiles";


/* =========================================
   HTML ELEMENTS
========================================= */

const profileForm =
  document.getElementById("profile-form");

const studentName =
  document.getElementById("student-name");

const studentRoll =
  document.getElementById("student-roll");

const studentImage =
  document.getElementById("student-image");

const imagePreview =
  document.getElementById("image-preview");

const previewPlaceholder =
  document.getElementById("preview-placeholder");

const imageStatus =
  document.getElementById("image-status");

const saveBtn =
  document.getElementById("save-btn");

const cancelEditBtn =
  document.getElementById("cancel-edit");

const saveMessage =
  document.getElementById("save-message");

const studentSearch =
  document.getElementById("student-search");

const studentCards =
  document.getElementById("student-cards");

const galleryMessage =
  document.getElementById("gallery-message");

const studentCount =
  document.getElementById("student-count");


/* =========================================
   APPLICATION STATE
========================================= */

let currentUser = null;

let currentProfile = null;

let allStudents = [];

let editingProfile = false;

let selectedImageFile = null;

let temporaryPreviewURL = null;

let applicationReady = false;


/* =========================================
   START APPLICATION
========================================= */

initializeApplication();

async function initializeApplication() {

  /* Enable scroll animations immediately */

  document.documentElement.classList.add(
    "js-ready"
  );

  initializeScrollAnimations();

  try {

    galleryMessage.textContent =
      "Connecting to Study Extraordinary...";

    currentUser = await ensureAnonymousUser();

    console.log(
      "Student identity connected:",
      currentUser.uid
    );

    await loadOwnProfile();

    await loadStudentGallery();

    initialize3DEffects();

    applicationReady = true;

    console.log(
      "Study Extraordinary is ready!"
    );

  } catch (error) {

    console.error(
      "Application initialization error:",
      error
    );

    galleryMessage.textContent =
      "Unable to connect. Please check Firebase settings and try again.";

    saveMessage.textContent =
      "Connection error: " + error.message;

  }

}



/* =========================================
   BLOCK 2 — IMAGE HANDLING
========================================= */

studentImage.addEventListener(
  "change",
  () => {

    const file = studentImage.files[0];

    selectedImageFile = null;

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

      studentImage.value = "";

      imageStatus.textContent =
        "Please select JPG, PNG or WEBP.";

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      studentImage.value = "";

      imageStatus.textContent =
        "Image must be smaller than 5 MB.";

      return;

    }

    selectedImageFile = file;

    if (temporaryPreviewURL) {

      URL.revokeObjectURL(
        temporaryPreviewURL
      );

    }

    temporaryPreviewURL =
      URL.createObjectURL(file);

    imagePreview.src =
      temporaryPreviewURL;

    imagePreview.hidden = false;

    previewPlaceholder.hidden = true;

    imageStatus.textContent =
      "Your new profile picture is ready.";

  }
);


/* =========================================
   IMAGE PREVIEW HELPER
========================================= */

function showProfileImage(url) {

  if (!url) {

    imagePreview.hidden = true;

    imagePreview.removeAttribute("src");

    previewPlaceholder.hidden = false;

    return;

  }

  imagePreview.src = url;

  imagePreview.hidden = false;

  previewPlaceholder.hidden = true;

}


/* =========================================
   CLOUDINARY UPLOAD
========================================= */

async function uploadImageToCloudinary(file) {

  if (!file) {

    throw new Error(
      "No image selected."
    );

  }

  if (file.size > 5 * 1024 * 1024) {

    throw new Error(
      "Image exceeds the 5 MB limit."
    );

  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

    throw new Error(
      "Unsupported image format."
    );

  }

  const formData = new FormData();

  formData.append("file", file);

  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const endpoint =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(
    endpoint,
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();

  if (!response.ok) {

    throw new Error(
      result.error?.message ||
      "Cloudinary image upload failed."
    );

  }

  if (
    !result.secure_url ||
    !result.secure_url.startsWith(
      "https://res.cloudinary.com/dpogbzi0/"
    )
  ) {

    throw new Error(
      "Invalid image response from Cloudinary."
    );

  }

  return result.secure_url;

}



/* =========================================
   BLOCK 3 — FIREBASE PROFILE LOADING
========================================= */


/* =========================================
   LOAD MY OWN PROFILE
========================================= */

async function loadOwnProfile() {

  const publicRef = doc(
    db,
    "publicProfiles",
    currentUser.uid
  );

  const privateRef = doc(
    db,
    "privateProfiles",
    currentUser.uid
  );

  const publicSnapshot = await getDoc(
    publicRef
  );

  const privateSnapshot = await getDoc(
    privateRef
  );

  if (!publicSnapshot.exists()) {

    currentProfile = null;

    editingProfile = false;

    saveBtn.textContent =
      "✨ Create My Profile";

    return;

  }

  const publicData =
    publicSnapshot.data();

  const privateData =
    privateSnapshot.exists()
      ? privateSnapshot.data()
      : {};

  currentProfile = {

    ...publicData,

    rollNumber:
      privateData.rollNumber || ""

  };

  studentName.value =
    currentProfile.studentName || "";

  studentRoll.value =
    currentProfile.rollNumber;

  showProfileImage(
    currentProfile.imageUrl
  );

  editingProfile = true;

  saveBtn.textContent =
    "🔄 Update My Profile";

  imageStatus.textContent =
    "Your saved profile picture.";

}


/* =========================================
   LOAD PUBLIC STUDENT GALLERY
========================================= */

async function loadStudentGallery() {

  try {

    galleryMessage.textContent =
      "Loading student profiles...";

    const snapshot = await getDocs(
      collection(db, "publicProfiles")
    );

    allStudents = snapshot.docs.map(
      item => ({

        id: item.id,

        ...item.data()

      })
    );

    allStudents.sort(
      (a, b) =>
        (a.studentName || "").localeCompare(
          b.studentName || ""
        )
    );

    renderStudentCards(allStudents);

    galleryMessage.textContent =
      allStudents.length
        ? ""
        : "No student profiles yet. Be the first to join!";

    studentCount.textContent =
      `${allStudents.length} student profile${allStudents.length === 1 ? "" : "s"}`;

  } catch (error) {

    console.error(
      "Gallery loading error:",
      error
    );

    galleryMessage.textContent =
      "Could not load the student gallery.";

  }

}


/* =========================================
   RENDER STUDENT CARDS
========================================= */

function renderStudentCards(students) {

  studentCards.replaceChildren();

  if (students.length === 0) {

    const empty = document.createElement("div");

    empty.className = "empty-gallery";

    empty.textContent =
      "No matching student profiles found.";

    studentCards.appendChild(empty);

    return;

  }

  students.forEach(student => {

    const card = document.createElement("article");

    card.className = "student-card";

    const imageURL =
      typeof student.imageUrl === "string" &&
      student.imageUrl.startsWith(
        "https://res.cloudinary.com/dpogbzi0/"
      )
        ? student.imageUrl
        : "";

    if (imageURL) {

      const img = document.createElement("img");

      img.className = "student-card-image";

      img.src = imageURL;

      img.alt = "Student profile picture";

      img.loading = "lazy";

      img.referrerPolicy = "no-referrer";

      img.onerror = () => {

        const placeholder =
          document.createElement("div");

        placeholder.className =
          "student-card-placeholder";

        placeholder.textContent = "✦";

        img.replaceWith(placeholder);

      };

      card.appendChild(img);

    } else {

      const placeholder =
        document.createElement("div");

      placeholder.className =
        "student-card-placeholder";

      placeholder.textContent = "✦";

      card.appendChild(placeholder);

    }

    const name = document.createElement("h3");

    name.textContent =
      student.studentName || "Student";

    card.appendChild(name);

    const label = document.createElement("span");

    label.className = "profile-label";

    label.textContent = "STUDY EXTRAORDINARY";

    card.appendChild(label);

    const divider =
      document.createElement("div");

    divider.className = "profile-divider";

    card.appendChild(divider);

    const footer =
      document.createElement("p");

    footer.className = "profile-footer";

    footer.textContent =
      "A member of our student community";

    card.appendChild(footer);

    /* Only the actual owner sees these buttons */

    if (
      currentUser &&
      student.id === currentUser.uid
    ) {

      const actions =
        document.createElement("div");

      actions.className = "card-actions";

      const editButton =
        document.createElement("button");

      editButton.type = "button";

      editButton.textContent = "✏️ Edit";

      editButton.addEventListener(
        "click",
        () => openOwnProfileEditor()
      );

      const deleteButton =
        document.createElement("button");

      deleteButton.type = "button";

      deleteButton.className = "delete-button";

      deleteButton.textContent = "🗑 Delete";

      deleteButton.addEventListener(
        "click",
        deleteOwnProfile
      );

      actions.append(
        editButton,
        deleteButton
      );

      card.appendChild(actions);

    }

    studentCards.appendChild(card);

  });

}


/* =========================================
   BLOCK 4 — PROFILE MANAGEMENT
========================================= */


/* =========================================
   CREATE / UPDATE PROFILE
========================================= */

profileForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    if (!applicationReady || !currentUser) {

      saveMessage.textContent =
        "Please wait for Firebase to connect.";

      return;

    }

    const name = studentName.value.trim();

    const roll = studentRoll.value.trim();

    if (!name || !roll) {

      saveMessage.textContent =
        "Please enter your name and roll number.";

      return;

    }

    if (name.length > 60) {

      saveMessage.textContent =
        "Name cannot exceed 60 characters.";

      return;

    }

    if (roll.length > 30) {

      saveMessage.textContent =
        "Roll number cannot exceed 30 characters.";

      return;

    }

    if (!currentProfile && !selectedImageFile) {

      saveMessage.textContent =
        "Please select a profile picture first.";

      return;

    }

    saveBtn.disabled = true;

    saveBtn.textContent =
      "Please wait...";

    saveMessage.textContent =
      "Preparing your student profile...";

    try {

      let imageUrl =
        currentProfile?.imageUrl || "";

      /* Upload a new picture if selected */

      if (selectedImageFile) {

        saveMessage.textContent =
          "Uploading your profile picture...";

        imageUrl =
          await uploadImageToCloudinary(
            selectedImageFile
          );

      }

      if (!imageUrl) {

        throw new Error(
          "A profile picture is required."
        );

      }

      const publicRef = doc(
        db,
        "publicProfiles",
        currentUser.uid
      );

      const privateRef = doc(
        db,
        "privateProfiles",
        currentUser.uid
      );

      const batch = writeBatch(db);

      /* PUBLIC INFORMATION */

      const publicData = {

        ownerUid: currentUser.uid,

        studentName: name,

        imageUrl: imageUrl,

        createdAt:
          currentProfile?.createdAt ||
          serverTimestamp(),

        updatedAt: serverTimestamp()

      };

      /* PRIVATE INFORMATION */

      const privateData = {

        ownerUid: currentUser.uid,

        rollNumber: roll,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp()

      };

      batch.set(
        publicRef,
        publicData
      );

      batch.set(
        privateRef,
        privateData
      );

      saveMessage.textContent =
        "Saving your profile securely...";

      await batch.commit();

      currentProfile = {

        ...publicData,

        rollNumber: roll

      };

      editingProfile = true;

      selectedImageFile = null;

      studentImage.value = "";

      if (temporaryPreviewURL) {

        URL.revokeObjectURL(
          temporaryPreviewURL
        );

        temporaryPreviewURL = null;

      }

      imageStatus.textContent =
        "Your profile picture is saved.";

      cancelEditBtn.hidden = false;

      saveBtn.textContent =
        "🔄 Update My Profile";

      saveMessage.textContent =
        "✅ Your student profile has been saved!";

      await loadOwnProfile();

      await loadStudentGallery();

    } catch (error) {

      console.error(
        "Profile save error:",
        error
      );

      saveMessage.textContent =
        "❌ " + error.message;

    } finally {

      saveBtn.disabled = false;

      saveBtn.textContent =
        currentProfile
          ? "🔄 Update My Profile"
          : "✨ Create My Profile";

    }

  }
);


/* =========================================
   OPEN OWN PROFILE EDITOR
========================================= */

function openOwnProfileEditor() {

  if (!currentProfile) return;

  studentName.value =
    currentProfile.studentName || "";

  studentRoll.value =
    currentProfile.rollNumber || "";

  showProfileImage(
    currentProfile.imageUrl
  );

  editingProfile = true;

  saveMessage.textContent =
    "You are editing your own profile.";

  saveBtn.textContent =
    "🔄 Update My Profile";

  cancelEditBtn.hidden = false;

  document
    .getElementById("create-profile")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================
   CANCEL EDITING
========================================= */

cancelEditBtn.addEventListener(
  "click",
  () => {

    if (temporaryPreviewURL) {

      URL.revokeObjectURL(
        temporaryPreviewURL
      );

      temporaryPreviewURL = null;

    }

    selectedImageFile = null;

    studentImage.value = "";

    if (currentProfile) {

      studentName.value =
        currentProfile.studentName || "";

      studentRoll.value =
        currentProfile.rollNumber || "";

      showProfileImage(
        currentProfile.imageUrl
      );

      saveBtn.textContent =
        "🔄 Update My Profile";

      imageStatus.textContent =
        "Your saved profile picture.";

    }

    saveMessage.textContent =
      "Editing cancelled.";

  }
);


/* =========================================
   DELETE OWN PROFILE
========================================= */

async function deleteOwnProfile() {

  if (!currentUser || !currentProfile) {

    return;

  }

  const confirmed = window.confirm(
    "Are you sure you want to delete your student profile? This cannot be undone."
  );

  if (!confirmed) return;

  try {

    const batch = writeBatch(db);

    batch.delete(
      doc(
        db,
        "publicProfiles",
        currentUser.uid
      )
    );

    batch.delete(
      doc(
        db,
        "privateProfiles",
        currentUser.uid
      )
    );

    await batch.commit();

    currentProfile = null;

    editingProfile = false;

    selectedImageFile = null;

    studentName.value = "";

    studentRoll.value = "";

    studentImage.value = "";

    showProfileImage(null);

    cancelEditBtn.hidden = true;

    saveBtn.textContent =
      "✨ Create My Profile";

    saveMessage.textContent =
      "Your profile has been deleted.";

    imageStatus.textContent =
      "You can create a new profile.";

    await loadStudentGallery();

  } catch (error) {

    console.error(
      "Profile deletion error:",
      error
    );

    saveMessage.textContent =
      "Could not delete your profile. Please try again.";

  }

}


/* =========================================
   STUDENT SEARCH
========================================= */

studentSearch.addEventListener(
  "input",
  () => {

    const searchTerm =
      studentSearch.value
        .trim()
        .toLowerCase();

    const filteredStudents =
      allStudents.filter(student =>

        (student.studentName || "")
          .toLowerCase()
          .includes(searchTerm)

      );

    renderStudentCards(
      filteredStudents
    );

    studentCount.textContent =
      `${filteredStudents.length} of ${allStudents.length} profiles`;

    galleryMessage.textContent =
      filteredStudents.length
        ? ""
        : "No matching students found.";

  }
);


/* =========================================
   BLOCK 5 — ADVANCED ANIMATIONS
========================================= */


/* =========================================
   SCROLL REVEAL ANIMATIONS
========================================= */

function initializeScrollAnimations() {

  const revealElements =
    document.querySelectorAll(".reveal");

  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {

    revealElements.forEach(element => {
      element.classList.add("visible");
    });

    return;

  }

  if (!("IntersectionObserver" in window)) {

    revealElements.forEach(element => {
      element.classList.add("visible");
    });

    return;

  }

  const observer =
    new IntersectionObserver(
      (entries, currentObserver) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            currentObserver.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px"
      }
    );

  revealElements.forEach(element => {

    observer.observe(element);

  });

}


/* =========================================
   3D STUDENT CARD EFFECTS
========================================= */

function initialize3DEffects() {

  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches ||
    !window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches
  ) {

    return;

  }

  function attachCardEffect(card) {

    if (card.dataset.tiltReady) return;

    card.dataset.tiltReady = "true";

    card.addEventListener(
      "pointermove",
      event => {

        const rect =
          card.getBoundingClientRect();

        const x =
          event.clientX - rect.left;

        const y =
          event.clientY - rect.top;

        const centerX =
          rect.width / 2;

        const centerY =
          rect.height / 2;

        const rotateY =
          ((x - centerX) / centerX) * 5;

        const rotateX =
          ((centerY - y) / centerY) * 5;

        card.style.transform =
          `perspective(1000px) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

      }
    );

    card.addEventListener(
      "pointerleave",
      () => {

        card.style.transform = "";

      }
    );

  }

  document
    .querySelectorAll(".student-card")
    .forEach(attachCardEffect);

  /* Also activate cards added after saving a profile */

  const cardObserver =
    new MutationObserver(() => {

      document
        .querySelectorAll(".student-card")
        .forEach(attachCardEffect);

    });

  cardObserver.observe(
    studentCards,
    {
      childList: true,
      subtree: true
    }
  );

}


/* =========================================
   END OF APPLICATION
========================================= */

console.log(
  "✦ Study Extraordinary profile engine loaded."
);
