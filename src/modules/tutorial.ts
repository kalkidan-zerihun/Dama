/**
 * 📖 TUTORIAL MODULE
 * Interactive 9-lesson Ethiopian Damma tutorial with canvas animated board.
 * Loaded dynamically on-demand when user opens Tutorial tab or How to Play.
 */

export const TutorialManager = {
    currentRule: 'egregna',
    currentStep: 0,
    animationId: null as number | null,
    animProgress: 0,
    userBoardState: null as any,
    userSelectedPiece: null as any,
    stepCompleted: false,
    stepSubStage: 1,
    slidingPiece: null as any,
    victoryState: false,

    init() {
        this.currentRule = localStorage.getItem('damma-selected-rule') || 'egregna';
        this.bindEvents();
        this.renderStep(0);
    },

    setRule(rule: string) {
        if (rule !== 'egregna' && rule !== 'toregna') return;
        this.currentRule = rule;
        localStorage.setItem('damma-selected-rule', rule);
        
        const egregnaBtn = document.getElementById('tut-rule-egregna');
        const toregnaBtn = document.getElementById('tut-rule-toregna');
        if (egregnaBtn) egregnaBtn.classList.toggle('active', rule === 'egregna');
        if (toregnaBtn) toregnaBtn.classList.toggle('active', rule === 'toregna');

        document.querySelectorAll('.rule-variant-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-rule') === rule);
        });

        this.renderStep(this.currentStep);
    },

    getStepData() {
        return this.currentRule === 'toregna' ? this.getToregnaSteps() : this.getEgregnaSteps();
    },

    getEgregnaSteps() {
        return [
            {
                tag: "LESSON 1 / 9 (EGREGNA)",
                title: "Board Setup & Objective",
                desc: "Damma (Egregna) is played on an 8x8 grid on <strong>dark squares</strong>. Gold pieces start on rows 5–7 and Dark pieces on rows 0–2.",
                highlight: "💡 <strong>Objective:</strong> Capture all opponent pieces OR block them so they have zero legal moves left!",
                initialBoard: () => [
                    [0,-1,0,-1,0,-1,0,-1],
                    [-1,0,-1,0,-1,0,-1,0],
                    [0,-1,0,-1,0,-1,0,-1],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [1,0,1,0,1,0,1,0],
                    [0,1,0,1,0,1,0,1],
                    [1,0,1,0,1,0,1,0]
                ],
                feedback: "💡 Tap any Gold starting piece to explore the Egregna board layout!"
            },
            {
                tag: "LESSON 2 / 9 (EGREGNA)",
                title: "Moving Normal Pieces",
                desc: "Normal pieces move <strong>1 diagonal square forward</strong> toward the opponent's side. Backward moves are strictly forbidden.",
                highlight: "👣 <strong>Movement Rule:</strong> Tap your Gold piece at (5,3) to reveal legal destinations, then perform your move!",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 4, c: 2 }, { r: 4, c: 4 }],
                arrows: [
                    { fromR: 5, fromC: 3, toR: 4, toC: 2, label: "Diag Left" },
                    { fromR: 5, fromC: 3, toR: 4, toC: 4, label: "Diag Right" }
                ],
                feedback: "👉 Tap your glowing Gold piece at (5,3) to reveal legal target spots!"
            },
            {
                tag: "LESSON 3 / 9 (EGREGNA)",
                title: "Capturing Enemy Pieces",
                desc: "Capture an opponent piece by <strong>jumping diagonally over an adjacent enemy</strong> into an empty landing square directly behind it!",
                highlight: "🎯 <strong>Adjacent Jump:</strong> Leap over an adjacent enemy to eliminate them from play.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    b[4][4] = -1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 3, c: 5 }],
                arrows: [
                    { fromR: 5, fromC: 3, toR: 3, toC: 5, label: "Leap & Capture" }
                ],
                feedback: "⚡ Tap Gold piece at (5,3) then jump to green square (3,5) to capture!"
            },
            {
                tag: "LESSON 4 / 9 (EGREGNA)",
                title: "Mandatory Capture Rule",
                desc: "In official Ethiopian Damma, <strong>captures are strictly mandatory</strong>! If a jump capture exists, you MUST take it.",
                highlight: "⚠️ <strong>Strict Rule:</strong> Failing to capture an exposed piece is illegal under official tournament rules.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    b[4][4] = -1;
                    b[5][1] = 1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 3, c: 5 }],
                feedback: "⚠️ You cannot move (5,1)! Tap (5,3) and take the mandatory capture!"
            },
            {
                tag: "LESSON 5 / 9 (EGREGNA)",
                title: "Multiple Captures (Chain Jumps)",
                desc: "If your landing square exposes another jump, you <strong>MUST continue leaping</strong> in a single turn until no jumps remain!",
                highlight: "💥 <strong>Double Jump:</strong> Perform consecutive leaps to sweep multiple enemy pieces in one turn.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][2] = 1;
                    b[5][3] = -1;
                    b[3][5] = -1;
                    return b;
                },
                source: { r: 6, c: 2 },
                targets: [{ r: 4, c: 4 }, { r: 2, c: 6 }],
                feedback: "🔥 Tap (6,2), jump to (4,4), then execute second jump to (2,6)!"
            },
            {
                tag: "LESSON 6 / 9 (EGREGNA)",
                title: "King Promotion",
                desc: "When a piece reaches the opponent's farthest row (row 0), it is instantly crowned as a <strong>King (Negus)</strong>!",
                highlight: "👑 <strong>King Power:</strong> Kings move and capture BOTH forward and backward!",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[1][3] = 1;
                    return b;
                },
                source: { r: 1, c: 3 },
                targets: [{ r: 0, c: 4 }],
                feedback: "👑 Tap (1,3) and step into row 0 to earn your Golden Crown!"
            },
            {
                tag: "LESSON 7 / 9 (EGREGNA)",
                title: "Egregna Short-Range King Rules",
                desc: "In Egregna, Kings move <strong>1 square diagonally in any direction</strong> and jump over adjacent enemy pieces.",
                highlight: "👑 <strong>Short-Range King:</strong> Powerful backward & forward diagonal leaps.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[4][4] = 2; // King
                    b[3][5] = -1;
                    return b;
                },
                source: { r: 4, c: 4 },
                targets: [{ r: 2, c: 6 }],
                feedback: "👑 Tap King at (4,4) then jump to (2,6) to eliminate enemy piece!"
            },
            {
                tag: "LESSON 8 / 9 (EGREGNA)",
                title: "Winning Conditions",
                desc: "You win by either <strong>capturing all opponent pieces</strong> or blocking them so they have no legal moves left.",
                highlight: "🏆 <strong>Victory:</strong> Master position control to isolate and wipe out enemy forces.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][2] = 1;
                    b[4][3] = -1;
                    return b;
                },
                source: { r: 5, c: 2 },
                targets: [{ r: 3, c: 4 }],
                feedback: "⚔️ Tap (5,2) and jump to (3,4) to deliver the knockout victory strike!"
            },
            {
                tag: "LESSON 9 / 9 (EGREGNA)",
                title: "Ethiopian Master Tactical Sacrifice",
                desc: "Master players purposefully <strong>sacrifice a piece to bait the opponent</strong> into an exposed line, setting up a multi-piece counter-sweep!",
                highlight: "🧠 <strong>Tactical Trap:</strong> Bait the enemy to launch a decisive winning counter-attack.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1; // Bait piece A
                    b[6][1] = 1; // Counter piece B
                    b[2][5] = -1; // Opponent attacker
                    b[4][3] = 0;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 3, c: 4 }],
                feedback: "🧠 Step 1: Move piece at (5,3) to (3,4) as sacrifice bait!"
            }
        ];
    },

    getToregnaSteps() {
        return [
            {
                tag: "LESSON 1 / 9 (TOREGNA)",
                title: "Flying King Variant",
                desc: "Toregna features <strong>Flying Kings (Long-Distance Kings)</strong> that can glide across any length of empty diagonal squares!",
                highlight: "🚀 <strong>Flying King:</strong> Moves and captures across long diagonal corridors.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][0] = 2; // Flying King
                    b[4][3] = -1;
                    return b;
                },
                source: { r: 7, c: 0 },
                targets: [{ r: 2, c: 5 }],
                feedback: "🚀 Tap Flying King at (7,0) then leap long-distance to (2,5)!"
            }
        ];
    },

    bindEvents() {
        const egregnaBtn = document.getElementById('tut-rule-egregna');
        const toregnaBtn = document.getElementById('tut-rule-toregna');
        if (egregnaBtn) egregnaBtn.addEventListener('click', () => this.setRule('egregna'));
        if (toregnaBtn) toregnaBtn.addEventListener('click', () => this.setRule('toregna'));

        const prevBtn = document.getElementById('tut-prev-btn');
        const nextBtn = document.getElementById('tut-next-btn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());

        const canvas = document.getElementById('tutorial-demo-canvas') as HTMLCanvasElement | null;
        if (canvas) {
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const touchX = e.clientX - rect.left;
                const touchY = e.clientY - rect.top;
                const c = Math.floor((touchX / rect.width) * 8);
                const r = Math.floor((touchY / rect.height) * 8);
                this.handleBoardClick(r, c);
            });
        }
    },

    renderStep(stepIdx: number) {
        const steps = this.getStepData();
        if (stepIdx < 0 || stepIdx >= steps.length) return;

        this.currentStep = stepIdx;
        const step = steps[stepIdx];

        this.userBoardState = step.initialBoard();
        this.userSelectedPiece = null;
        this.stepCompleted = false;
        this.stepSubStage = 1;
        this.slidingPiece = null;
        this.victoryState = false;

        const tag = document.getElementById('tut-step-tag');
        const title = document.getElementById('tut-step-title');
        const desc = document.getElementById('tut-step-desc');
        const highlight = document.getElementById('tut-step-highlight');
        const badge = document.getElementById('tut-feedback-badge');

        if (tag) tag.textContent = step.tag;
        if (title) title.textContent = step.title;
        if (desc) desc.innerHTML = step.desc;
        if (highlight) highlight.innerHTML = step.highlight;
        if (badge) badge.innerHTML = step.feedback;

        const prevBtn = document.getElementById('tut-prev-btn') as HTMLButtonElement | null;
        const nextBtn = document.getElementById('tut-next-btn') as HTMLButtonElement | null;
        if (prevBtn) prevBtn.disabled = stepIdx === 0;
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = stepIdx === steps.length - 1 ? "Finish Tutorial 🎉" : "Next Lesson ➔";
        }

        this.startCanvasLoop();
    },

    handleBoardClick(r: number, c: number) {
        if (r < 0 || r >= 8 || c < 0 || c >= 8) return;
        const feedbackBadge = document.getElementById('tut-feedback-badge');

        if (this.currentStep === 0) {
            if (this.userBoardState[r][c] === 1) {
                this.userSelectedPiece = { r, c };
                if (feedbackBadge) feedbackBadge.textContent = `✨ Selected Gold piece at (${r},${c}). Try moving forward diagonally in Lesson 2!`;
            }
            return;
        }

        if (this.currentStep === 1) {
            if (r === 5 && c === 3) {
                this.userSelectedPiece = { r, c };
                if (feedbackBadge) feedbackBadge.textContent = "👉 Tap green target spot (4,2) or (4,4) to move!";
            } else if (this.userSelectedPiece && r === 4 && (c === 2 || c === 4)) {
                this.animateSlide(5, 3, r, c, null, false, () => {
                    this.stepCompleted = true;
                    if (feedbackBadge) feedbackBadge.textContent = "✅ Excellent! Normal pieces advance 1 diagonal step forward.";
                });
                this.userSelectedPiece = null;
            }
            return;
        }

        if (this.currentStep === 2 || this.currentStep === 3) {
            if (r === 5 && c === 3) {
                this.userSelectedPiece = { r, c };
                if (feedbackBadge) feedbackBadge.textContent = "⚡ Tap green target square (3,5) to leap over enemy piece!";
            } else if (this.userSelectedPiece && r === 3 && c === 5) {
                this.animateSlide(5, 3, 3, 5, { r: 4, c: 4 }, false, () => {
                    this.stepCompleted = true;
                    if (feedbackBadge) feedbackBadge.textContent = "💥 Enemy piece captured! Jump capture executed successfully.";
                });
                this.userSelectedPiece = null;
            }
            return;
        }
    },

    animateSlide(fromR: number, fromC: number, toR: number, toC: number, removeCap: any, promoteToKing: boolean, onComplete: () => void) {
        this.slidingPiece = { fromR, fromC, toR, toC, progress: 0, removeCap, promoteToKing, onComplete };
    },

    startCanvasLoop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const canvas = document.getElementById('tutorial-demo-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            this.animProgress += 0.015;
            if (this.animProgress > 100) this.animProgress = 0;

            if (this.slidingPiece) {
                this.slidingPiece.progress += 0.05;
                if (this.slidingPiece.progress >= 1) {
                    const sp = this.slidingPiece;
                    let pVal = this.userBoardState[sp.fromR][sp.fromC];
                    if (sp.promoteToKing) pVal = 2;
                    this.userBoardState[sp.fromR][sp.fromC] = 0;
                    this.userBoardState[sp.toR][sp.toC] = pVal;
                    if (sp.removeCap) this.userBoardState[sp.removeCap.r][sp.removeCap.c] = 0;
                    const cb = sp.onComplete;
                    this.slidingPiece = null;
                    if (cb) cb();
                }
            }

            this.drawBoardState(ctx, canvas);
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    },

    drawBoardState(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        const size = canvas.width;
        const cellSize = size / 8;
        ctx.clearRect(0, 0, size, size);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isDark = (r + c) % 2 === 1;
                ctx.fillStyle = isDark ? '#322316' : '#d2a679';
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.slidingPiece && r === this.slidingPiece.fromR && c === this.slidingPiece.fromC) continue;
                const pVal = this.userBoardState[r][c];
                if (pVal !== 0) {
                    this.drawTutorialPiece(ctx, (c + 0.5) * cellSize, (r + 0.5) * cellSize, cellSize * 0.36, pVal);
                }
            }
        }
    },

    drawTutorialPiece(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, val: number) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = val > 0 ? '#ffd700' : '#8b0000';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    },

    nextStep() {
        const steps = this.getStepData();
        if (this.currentStep < steps.length - 1) {
            this.renderStep(this.currentStep + 1);
        } else {
            // Close tutorial or navigate to main menu
            const modal = document.getElementById('settings-modal');
            if (modal) modal.classList.remove('active');
        }
    },

    prevStep() {
        if (this.currentStep > 0) {
            this.renderStep(this.currentStep - 1);
        }
    }
};

export function initTutorialModule() {
    TutorialManager.init();
}
