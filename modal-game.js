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
      { id: "video3", src: "3.mp4", srcMob: "3.mp4", step: "step-3", autoNext: true }, // Пометка для автоперехода
      { id: "video4", src: "4.mp4", srcMob: "4.mp4", step: "step-4", loop: true },
      { id: "video5", src: "5.mp4", srcMob: "5.mp4", step: "step-5", autoNext: true }, // Пометка для автоперехода
      { id: "video6", src: "6.mp4", srcMob: "6.mp4", step: "step-6", loop: true },
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
    const video = document.createElement("video");
    video.className = "v-trigger__video";
    video.muted = video.loop = video.autoplay = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
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
      video.preload = "auto"; 
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.dataset.step = step.step;
      video.src = isMobile() ? step.srcMob : step.src;
      if (step.loop) video.setAttribute("data-loop", "");
      vVideos.appendChild(video);
      video.load();

      const quiz = document.createElement("div");
      quiz.className = "v-quiz";
      quiz.id = step.step;
      const btn = document.createElement("button");
      btn.className = "v-quiz__btn";
      if (index === conf.steps.length - 1) btn.dataset.done = "true";
      else btn.dataset.video = conf.steps[index + 1].id;
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

  function playVideo(videoId) {
    const targetVideo = document.getElementById(videoId);
    if (!targetVideo) return;

    const currentVideo = Array.from(allVideos).find(v => v.classList.contains("v-playing"));
    const stepConfig = config.steps.find(s => s.id === videoId);

    // Скрываем все квизы мгновенно
    allQuizzes.forEach((q) => {
      q.classList.remove("is-visible");
      q.style.display = "none";
    });

    targetVideo.style.display = "block";
    targetVideo.style.zIndex = "1";
    targetVideo.currentTime = 0;

    const onPlaying = () => {
      targetVideo.style.zIndex = "2";
      targetVideo.classList.add("v-playing");

      if (currentVideo && currentVideo !== targetVideo) {
        currentVideo.pause();
        currentVideo.style.display = "none";
        currentVideo.style.zIndex = "1";
        currentVideo.classList.remove("v-playing");
        currentVideo.onended = null;
        currentVideo.ontimeupdate = null;
      }
      targetVideo.removeEventListener("playing", onPlaying);
    };

    targetVideo.addEventListener("playing", onPlaying);

    if (targetVideo.hasAttribute("data-loop")) {
      targetVideo.loop = true;
      showQuiz(targetVideo.dataset.step);
    } else {
      targetVideo.loop = false;
      
      // ПОКАЗЫВАЕМ КНОПКУ ТОЛЬКО ЕСЛИ ЭТО НЕ АВТО-ПЕРЕХОД (не 3 и не 5)
      targetVideo.ontimeupdate = () => {
        if (!stepConfig.autoNext && targetVideo.duration > 0 && targetVideo.duration - targetVideo.currentTime <= config.quizAppearanceBeforeEnd) {
          showQuiz(targetVideo.dataset.step);
          targetVideo.ontimeupdate = null;
        }
      };

      // АВТОМАТИЧЕСКИЙ ПЕРЕХОД (для 3 и 5)
      if (stepConfig.autoNext) {
        targetVideo.onended = () => {
          const currentIndex = config.steps.findIndex(s => s.id === videoId);
          const next = config.steps[currentIndex + 1];
          if (next) playVideo(next.id);
        };
      }
    }
    targetVideo.play().catch((e) => console.warn(e));
  }

  function showQuiz(stepId) {
    const quiz = document.getElementById(stepId);
    if (quiz) {
      quiz.style.display = "block";
      quiz.classList.add("is-visible");
    }
  }

  function resetUI() {
    allVideos.forEach((v) => {
      v.pause();
      v.style.display = "none";
      v.currentTime = 0;
      v.classList.remove("v-playing");
      v.style.zIndex = "1";
    });
    const v1 = document.getElementById("video1");
    if (v1) {
      v1.style.display = "block";
      v1.classList.add("v-playing");
      v1.style.zIndex = "2";
    }
    allQuizzes.forEach((q) => {
      q.classList.remove("is-visible");
      q.style.display = "none";
    });
  }

  function setupEventListeners() {
    videoButton.addEventListener("click", () => {
      modalOverlay.style.display = "flex";
      setTimeout(() => {
        modalOverlay.style.opacity = "1";
        modalContent.style.transform = "translateY(0)";
      }, 10);
      document.body.style.overflow = "hidden";
      playVideo("video1");
    });
    closeButton.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
      const btn = e.target.closest(".v-quiz__btn");
      if (!btn) return;
      if (btn.hasAttribute("data-done")) closeModal();
      else playVideo(btn.dataset.video);
    });
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

  function addResponsiveStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .v-trigger { position: fixed; bottom: 110px; right: 20px; width: 130px; height: 130px; background: transparent; border: none; cursor: pointer; border-radius: 50%; z-index: 1039; padding: 0; }
      .v-trigger__inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; border-radius: 50%; }
      .v-trigger__bg { width: 100%; height: 100%; object-fit: contain; position: absolute; z-index: 1; }
      .v-trigger__video { width: 80%; height: 70%; object-fit: contain; z-index: 2; border-radius: 50%; }
      .v-modal__overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 110001; opacity: 0; transition: opacity 0.3s ease; cursor: pointer; }
      .v-modal__modal { background: #000; border-radius: 12px; overflow: hidden; position: relative; transform: translateY(30px); transition: transform 0.3s ease; max-width: 80vw; aspect-ratio: 16/9; width: 100%; }
      .v-modal__container, .v-videos { width: 100%; height: 100%; position: relative; }
      .v-videos video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: none; }
      .v-quiz { position: absolute; inset: 0; z-index: 10; display: none; }
      .v-quiz.is-visible { display: block; }
      .v-quiz__btn { position: absolute; inset: 0; background: transparent; border: 5px solid red; cursor: pointer; }
      .v-modal__close { position: absolute; top: 15px; right: 15px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 24px; z-index: 1110; }
      @media (max-width: 768px) {
        .v-trigger { width: 100px; height: 100px; bottom: 20px; }
        .v-modal__modal { max-width: 95vw; aspect-ratio: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  addResponsiveStyles();
  renderGame();
  setupEventListeners();
})();