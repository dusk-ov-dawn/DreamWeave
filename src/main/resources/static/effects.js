/* =========================================================
   织梦 DreamWeave · 视觉特效
   粒子星图 / 卡片聚光 / 终端打字机
   ========================================================= */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 粒子星图 ---------- */

    var canvas = document.getElementById("particles");

    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext("2d");
        var COLORS = ["56, 189, 248", "125, 211, 252", "129, 140, 248"];
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var width = 0;
        var height = 0;
        var particles = [];
        var rafId = null;
        var resizeTimer = null;
        var mouse = { x: -9999, y: -9999 };

        function createParticle() {
            var color = COLORS[Math.floor(Math.random() * COLORS.length)];

            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.24,
                vy: (Math.random() - 0.5) * 0.24,
                r: Math.random() * 1.4 + 0.5,
                color: color,
                alpha: Math.random() * 0.35 + 0.15
            };
        }

        function seed() {
            var count = Math.min(100, Math.round(width * height / 17000));
            particles = [];

            for (var i = 0; i < count; i++) {
                particles.push(createParticle());
            }
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            seed();

            if (reduceMotion) {
                draw(false);
            }
        }

        function draw(animate) {
            ctx.clearRect(0, 0, width, height);
            ctx.globalCompositeOperation = "lighter";

            var i;
            var j;
            var p;

            for (i = 0; i < particles.length; i++) {
                p = particles[i];

                if (animate) {
                    p.x += p.vx;
                    p.y += p.vy;

                    if (p.x < -24) p.x = width + 24;
                    if (p.x > width + 24) p.x = -24;
                    if (p.y < -24) p.y = height + 24;
                    if (p.y > height + 24) p.y = -24;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(" + p.color + "," + p.alpha + ")";
                ctx.fill();
            }

            for (i = 0; i < particles.length; i++) {
                for (j = i + 1; j < particles.length; j++) {
                    var a = particles[i];
                    var b = particles[j];
                    var dx = a.x - b.x;
                    var dy = a.y - b.y;
                    var distance2 = dx * dx + dy * dy;

                    if (distance2 < 14400) {
                        var alpha = (1 - Math.sqrt(distance2) / 120) * 0.13;

                        ctx.strokeStyle = "rgba(56, 189, 248," + alpha + ")";
                        ctx.lineWidth = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            if (mouse.x > -1000) {
                for (i = 0; i < particles.length; i++) {
                    p = particles[i];

                    var mdx = p.x - mouse.x;
                    var mdy = p.y - mouse.y;
                    var md2 = mdx * mdx + mdy * mdy;

                    if (md2 < 25600) {
                        var mAlpha = (1 - Math.sqrt(md2) / 160) * 0.22;

                        ctx.strokeStyle = "rgba(125, 211, 252," + mAlpha + ")";
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }

            ctx.globalCompositeOperation = "source-over";
        }

        function loop() {
            draw(true);
            rafId = window.requestAnimationFrame(loop);
        }

        function start() {
            if (rafId !== null) return;
            loop();
        }

        function stop() {
            if (rafId === null) return;
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        window.addEventListener("resize", function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(resize, 160);
        });

        window.addEventListener("pointermove", function (event) {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }, { passive: true });

        window.addEventListener("pointerleave", function () {
            mouse.x = -9999;
            mouse.y = -9999;
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                stop();
            } else if (!reduceMotion) {
                start();
            }
        });

        resize();

        if (!reduceMotion) {
            start();
        }
    }

    /* ---------- 卡片聚光 ---------- */

    var spotlights = document.querySelectorAll(".stat-card, .feature-card, .content-card");

    for (var s = 0; s < spotlights.length; s++) {
        spotlights[s].classList.add("spotlight");
    }

    document.addEventListener("pointermove", function (event) {
        var target = event.target.closest(".spotlight, .option-btn");
        if (!target) return;

        var rect = target.getBoundingClientRect();

        target.style.setProperty("--mx", (event.clientX - rect.left) + "px");
        target.style.setProperty("--my", (event.clientY - rect.top) + "px");
    }, { passive: true });

    /* ---------- 终端打字机 ---------- */

    var statusEl = document.getElementById("terminalStatus");

    if (statusEl) {
        var messages = [
            "AI 学习空间已就绪",
            "正在分析你的知识图谱…",
            "DeepSeek 正在准备题目…",
            "编织你的编程梦想…"
        ];

        if (reduceMotion) {
            statusEl.textContent = messages[0];
        } else {
            var messageIndex = 0;
            var charIndex = 0;
            var deleting = false;

            var type = function () {
                var message = messages[messageIndex];

                if (!deleting) {
                    charIndex++;
                    statusEl.textContent = message.slice(0, charIndex);

                    if (charIndex === message.length) {
                        deleting = true;
                        window.setTimeout(type, 1900);
                        return;
                    }
                } else {
                    charIndex--;
                    statusEl.textContent = message.slice(0, charIndex);

                    if (charIndex === 0) {
                        deleting = false;
                        messageIndex = (messageIndex + 1) % messages.length;
                    }
                }

                window.setTimeout(type, deleting ? 26 : 60 + Math.random() * 50);
            };

            window.setTimeout(type, 800);
        }
    }

    /* ---------- 自定义光标 ---------- */

    var finePointer = window.matchMedia("(pointer: fine)").matches;

    if (finePointer && !reduceMotion) {
        var glow = document.createElement("div");
        var ring = document.createElement("div");
        glow.className = "cursor-glow";
        ring.className = "cursor-ring";
        document.body.appendChild(glow);
        document.body.appendChild(ring);

        var targetX = window.innerWidth / 2;
        var targetY = window.innerHeight / 2;
        var glowX = targetX;
        var glowY = targetY;
        var ringX = targetX;
        var ringY = targetY;
        var cursorRaf = null;
        var cursorVisible = false;

        var cursorLoop = function () {
            glowX += (targetX - glowX) * 0.12;
            glowY += (targetY - glowY) * 0.12;
            ringX += (targetX - ringX) * 0.28;
            ringY += (targetY - ringY) * 0.28;

            glow.style.transform = "translate3d(" + glowX + "px," + glowY + "px,0)";
            ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0)";

            cursorRaf = window.requestAnimationFrame(cursorLoop);
        };

        window.addEventListener("pointermove", function (event) {
            targetX = event.clientX;
            targetY = event.clientY;

            if (!cursorVisible) {
                cursorVisible = true;
                document.body.classList.add("cursor-visible");
                glowX = ringX = targetX;
                glowY = ringY = targetY;
            }
        }, { passive: true });

        document.addEventListener("pointerover", function (event) {
            var interactive = event.target.closest(
                "button, a, input, select, textarea, .feature-card, .option-btn"
            );

            document.body.classList.toggle("cursor-hover", Boolean(interactive));
        });

        document.addEventListener("pointerleave", function () {
            cursorVisible = false;
            document.body.classList.remove("cursor-visible");
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                if (cursorRaf !== null) {
                    window.cancelAnimationFrame(cursorRaf);
                    cursorRaf = null;
                }
            } else if (cursorRaf === null) {
                cursorRaf = window.requestAnimationFrame(cursorLoop);
            }
        });

        cursorRaf = window.requestAnimationFrame(cursorLoop);
    }

    /* ---------- 3D 卡片倾斜 ---------- */

    var tiltCards = document.querySelectorAll(".stat-card, .feature-card");

    if (finePointer && !reduceMotion) {
        var bindTilt = function (card) {
            card.addEventListener("pointermove", function (event) {
                var rect = card.getBoundingClientRect();
                var px = (event.clientX - rect.left) / rect.width - 0.5;
                var py = (event.clientY - rect.top) / rect.height - 0.5;

                card.style.setProperty("--rx", (-py * 5.5).toFixed(2) + "deg");
                card.style.setProperty("--ry", (px * 7).toFixed(2) + "deg");
            });

            card.addEventListener("pointerleave", function () {
                card.style.setProperty("--rx", "0deg");
                card.style.setProperty("--ry", "0deg");
            });
        };

        for (var t = 0; t < tiltCards.length; t++) {
            bindTilt(tiltCards[t]);
        }
    }

    /* ---------- 滚动进入动画 ---------- */

    var revealTargets = document.querySelectorAll(
        ".section-heading, .page-banner, .stat-card, .feature-card, .content-card"
    );

    if (!reduceMotion && "IntersectionObserver" in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-in");
                    entry.target.style.setProperty("--reveal-delay", "0ms");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        for (var r = 0; r < revealTargets.length; r++) {
            var revealEl = revealTargets[r];
            var index = revealEl.parentElement
                ? Array.prototype.indexOf.call(revealEl.parentElement.children, revealEl)
                : 0;

            revealEl.classList.add("reveal");
            revealEl.style.setProperty("--reveal-delay", Math.min(index, 5) * 55 + "ms");
            revealObserver.observe(revealEl);
        }

        var revealVisible = function () {
            for (var i = 0; i < revealTargets.length; i++) {
                var el = revealTargets[i];

                if (el.classList.contains("reveal-in")) continue;

                var rect = el.getBoundingClientRect();

                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add("reveal-in");
                    el.style.setProperty("--reveal-delay", "0ms");
                }
            }
        };

        var originalShowPage = window.showPage;

        if (typeof originalShowPage === "function") {
            window.showPage = function () {
                var result = originalShowPage.apply(this, arguments);
                window.setTimeout(revealVisible, 60);
                return result;
            };
        }

        // 供动态显示的面板调用，避免内容因滚动动画尚未触发而短暂空白
        window.dreamweaveReveal = function (element) {
            if (element) {
                element.classList.add("reveal-in");
                element.style.setProperty("--reveal-delay", "0ms");
            }
        };
    }

    /* ---------- 流星 ---------- */

    var backdrop = document.querySelector(".backdrop");

    if (backdrop && !reduceMotion) {
        for (var m = 0; m < 6; m++) {
            var meteor = document.createElement("span");
            meteor.className = "meteor";
            meteor.style.top = Math.random() * 40 + "%";
            meteor.style.left = 50 + Math.random() * 50 + "%";
            meteor.style.animationDelay = Math.random() * 10 + "s";
            meteor.style.animationDuration = 5 + Math.random() * 5 + "s";
            backdrop.appendChild(meteor);
        }
    }

    /* ---------- 数字滚动 ---------- */

    var statIds = [
        "todayTime", "totalQuestions", "accuracy", "streak",
        "reportTime", "reportQuestions", "reportAccuracy", "reportStreak"
    ];

    var animateNumber = function (el) {
        if (!el || el.classList.contains("counting")) return;

        var match = el.textContent.trim().match(/^(\d+)(.*)$/);
        if (!match) return;

        var target = parseInt(match[1], 10);
        var suffix = match[2] || "";
        var from = parseInt(el.getAttribute("data-count-value") || "0", 10);

        if (from === target) return;

        el.setAttribute("data-count-value", String(target));
        el.classList.add("counting");

        var started = performance.now();
        var duration = 720;

        var step = function (now) {
            var progress = Math.min(1, (now - started) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);

            el.textContent = Math.round(from + (target - from) * eased) + suffix;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                el.textContent = target + suffix;
                el.classList.remove("counting");
            }
        };

        window.requestAnimationFrame(step);
    };

    if (!reduceMotion) {
        ["updateDashboard", "renderReport"].forEach(function (name) {
            var original = window[name];

            if (typeof original === "function") {
                window[name] = function () {
                    var result = original.apply(this, arguments);
                    statIds.forEach(function (id) {
                        animateNumber(document.getElementById(id));
                    });
                    return result;
                };
            }
        });

        window.setTimeout(function () {
            statIds.forEach(function (id) {
                animateNumber(document.getElementById(id));
            });
        }, 350);
    }

    /* ---------- 答对时的彩纸 ---------- */

    window.dreamweaveConfetti = function () {
        if (reduceMotion) return;

        var confetti = document.createElement("canvas");
        confetti.className = "confetti-canvas";
        confetti.width = window.innerWidth;
        confetti.height = window.innerHeight;
        document.body.appendChild(confetti);

        var context = confetti.getContext("2d");
        var colors = ["#38bdf8", "#7dd3fc", "#67e8f9", "#ffffff", "#a5b4fc"];
        var pieces = [];
        var i;

        for (i = 0; i < 90; i++) {
            pieces.push({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 180,
                y: window.innerHeight * 0.34 + (Math.random() - 0.5) * 90,
                vx: (Math.random() - 0.5) * 13,
                vy: (Math.random() - 0.95) * 13,
                size: 6 + Math.random() * 7,
                rotation: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.32,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        var startedAt = performance.now();

        var frame = function (now) {
            var elapsed = now - startedAt;
            var alpha = Math.max(0, 1 - elapsed / 1600);

            context.clearRect(0, 0, confetti.width, confetti.height);

            for (var p = 0; p < pieces.length; p++) {
                var piece = pieces[p];

                piece.vy += 0.22;
                piece.vx *= 0.99;
                piece.x += piece.vx;
                piece.y += piece.vy;
                piece.rotation += piece.spin;

                context.save();
                context.globalAlpha = alpha;
                context.translate(piece.x, piece.y);
                context.rotate(piece.rotation);
                context.fillStyle = piece.color;
                context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
                context.restore();
            }

            if (elapsed < 1600) {
                window.requestAnimationFrame(frame);
            } else {
                confetti.remove();
            }
        };

        window.requestAnimationFrame(frame);
    };

    /* ---------- 按钮水波纹 ---------- */

    if (!reduceMotion) {
        document.addEventListener("pointerdown", function (event) {
            var button = event.target.closest(".primary-btn, .secondary-btn, .option-btn");
            if (!button) return;

            var rect = button.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height) * 1.4;
            var ripple = document.createElement("span");

            ripple.className = "ripple";
            ripple.style.width = size + "px";
            ripple.style.height = size + "px";
            ripple.style.left = (event.clientX - rect.left - size / 2) + "px";
            ripple.style.top = (event.clientY - rect.top - size / 2) + "px";

            button.appendChild(ripple);

            window.setTimeout(function () {
                ripple.remove();
            }, 620);
        });
    }
})();
