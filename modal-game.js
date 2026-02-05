(function () {
  "use strict";

  const config = {
    quizAppearanceBeforeEnd: 1.5,
    trigger: {
      bgImage: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/circle.png",
      previewVideo: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/hello.mp4",
    },
    steps: [
          { id: "video1", src: "1.mp4", srcMob: "1.mp4", step: "step-1", loop: false },
          { id: "video2", src: "2.mp4", srcMob: "2.mp4", step: "step-2", loop: false },
          { id: "video3", src: "3.mp4", srcMob: "3.mp4", step: "step-3", loop: false },
          { id: "video4", src: "4,6.mp4", srcMob: "4,6.mp4", step: "step-4", loop: true },
          { id: "video5", src: "5.mp4", srcMob: "5.mp4", step: "step-5", loop: false },
          { id: "video6", src: "4,6.mp4", srcMob: "4,6.mp4", step: "step-6", loop: true },
          { id: "video7", src: "7.mp4", srcMob: "7.mp4", step: "step-7", loop: false },
        ],
  };

  let modalOverlay, modalContent, videoButton, closeButton, allVideos, allQuizzes;

  const isMobile = () => window.innerWidth <= 768;

  function createTrigger(conf) {
    const btn = document.createElement("button");
    btn.className = "v-trigger";
    const inner = document.createElement("div");
    inner.className = "v-trigger__inner";

    const img = document.createElement("img");
    img.src = conf.trigger.bgImage;
    img.className = "v-trigger__bg";
    img.alt = "Play";

    const video = document.createElement("video");
    video.className = "v-trigger__video";
    video.muted = video.loop = video.autoplay = true;
    video.setAttribute("playsinline", "");

    const source = document.createElement("source");
    source.src = conf.trigger.previewVideo;
    source.type = "video/mp4";

    video.appendChild(source);
    inner.append(img, video);
    btn.appendChild(inner);
    return btn;
  }

  function createModal(conf) {
    const overlay = document.createElement("div");
    overlay.className = "v-modal__overlay";

    const modal = document.createElement("div");
    modal.className = "v-modal__modal";

    const closeBtn = document.createElement("button");
    closeBtn.className = "v-modal__close";
    closeBtn.textContent = "×";

    const container = document.createElement("div");
    container.className = "v-modal__container";

    const vVideos = document.createElement("div");
    vVideos.className = "v-videos";

    const vBtns = document.createElement("div");
    vBtns.className = "v-btns";

    conf.steps.forEach((step, index) => {
      const video = document.createElement("video");
      video.id = step.id;
      video.muted = true;
      video.setAttribute("playsinline", "");
      video.dataset.step = step.step;
      
      // УДАЛИЛИ СМЕНУ SRC В playVideo. Устанавливаем всё сразу здесь.
      video.src = isMobile() ? step.srcMob : step.src;
      video.preload = "auto";

      if (step.loop) video.setAttribute("data-loop", "");
      
      vVideos.appendChild(video);

      const quiz = document.createElement("div");
      quiz.className = "v-quiz";
      quiz.id = step.step;

      const btn = document.createElement("button");
      btn.className = "v-quiz__btn";
      const isLast = index === conf.steps.length - 1;

      if (isLast) {
        btn.dataset.done = "true";
      } else {
        btn.dataset.video = conf.steps[index + 1].id;
      }

      quiz.appendChild(btn);
      vBtns.appendChild(quiz);
    });

    container.append(vVideos, vBtns);
    modal.append(closeBtn, container);
    overlay.appendChild(modal);
    return overlay;
  }

  function renderGame() {
    videoButton = createTrigger(config);
    modalOverlay = createModal(config);

    document.body.append(videoButton, modalOverlay);

    modalContent = modalOverlay.querySelector(".v-modal__modal");
    closeButton = modalOverlay.querySelector(".v-modal__close");
    allVideos = modalOverlay.querySelectorAll("video");
    allQuizzes = modalOverlay.querySelectorAll(".v-quiz");
  }

  function openModal() {
    modalOverlay.style.display = "flex";
    setTimeout(() => {
      modalOverlay.style.opacity = "1";
      modalContent.style.transform = "translateY(0)";
    }, 10);
    document.body.style.overflow = "hidden";
    playVideo("video1");
  }

  function closeModal() {
    modalOverlay.style.opacity = "0";
    modalContent.style.transform = "translateY(30px)";
    setTimeout(() => {
      modalOverlay.style.display = "none";
      document.body.style.overflow = "";
      resetUI();
    }, 300);
  }

  function playVideo(videoId) {
    const targetVideo = document.getElementById(videoId);
    if (!targetVideo) return;

    // Скрываем квизы
    allQuizzes.forEach((q) => q.classList.remove("is-visible"));

    // Переключаем display без перезагрузки src и вызова load()
    allVideos.forEach(v => {
        v.pause();
        v.style.display = "none";
    });

    targetVideo.style.display = "block";
    targetVideo.currentTime = 0;

    if (targetVideo.hasAttribute("data-loop")) {
      targetVideo.loop = true;
      showQuiz(targetVideo.dataset.step);
    } else {
      targetVideo.loop = false;
      targetVideo.ontimeupdate = () => {
        if (targetVideo.duration > 0 && targetVideo.duration - targetVideo.currentTime <= config.quizAppearanceBeforeEnd) {
          showQuiz(targetVideo.dataset.step);
          targetVideo.ontimeupdate = null;
        }
      };
    }
    targetVideo.play().catch(() => {});
  }

  function showQuiz(stepId) {
    const quiz = document.getElementById(stepId);
    if (quiz) quiz.classList.add("is-visible");
  }

  function resetUI() {
    allVideos.forEach((v) => {
      v.pause();
      v.style.display = "none";
      v.loop = false;
      v.ontimeupdate = null;
    });
    // Подготавливаем первое видео к следующему открытию
    const v1 = document.getElementById("video1");
    if (v1) v1.style.display = "block";
    
    allQuizzes.forEach((q) => q.classList.remove("is-visible"));
  }

  function setupEventListeners() {
    videoButton.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
      const btn = e.target.closest(".v-quiz__btn");
      if (!btn) return;
      if (btn.hasAttribute("data-done")) closeModal();
      else playVideo(btn.dataset.video);
    });
  }

  function addResponsiveStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .v-trigger { position: fixed; bottom: 110px; right: 20px; width: 130px; height: 130px; background: transparent; border: none; cursor: pointer; border-radius: 50%; z-index: 1039; box-shadow: 0 0 50px rgba(0,0,0,0.3); padding: 0; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      .v-trigger__inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; border-radius: 50%; }
      .v-trigger__bg { width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; z-index: 1; }
      .v-trigger__video { width: 80%; height: 70%; object-fit: contain; position: absolute; top: 10%; left: 10%; z-index: 2; border-radius: 50%; }
      .v-modal__overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 110001; opacity: 0; transition: opacity 0.3s ease; cursor: pointer; }
      .v-modal__modal { background: #fff; border-radius: 12px; overflow: hidden; position: relative; transform: translateY(30px); transition: transform 0.3s ease; max-width: 80vw; aspect-ratio: 16/9; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .v-modal__container, .v-videos { width: 100%; height: 100%; position: relative; }
      .v-videos { background: #000; width: 100%; height: 100%; }
      .v-videos video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: none; }
      
      .v-videos video#video1 { display: block; }

      .v-quiz { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; visibility: hidden; transition: opacity 0.8s; z-index: 10; ; }
      .v-quiz.is-visible { opacity: 1; visibility: visible; }
      .v-quiz__btn { position: absolute; inset: 0; background: transparent;  border: 5px solid red; cursor: pointer; }
      .v-modal__close { position: absolute; top: 15px; right: 15px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 24px; z-index: 1110; }
      @media (max-width: 768px) {
        .v-trigger { width: 100px; height: 100px; bottom: 20px; right: 20px; }
        .v-modal__modal { max-width: 95vw; aspect-ratio: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    addResponsiveStyles();
    renderGame();
    setupEventListeners();
  }

  document.addEventListener("DOMContentLoaded", init);
})();