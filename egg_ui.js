window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.ui = {
    createBottomUI() {
        this.bottomUI = this.add.container(0, 0).setDepth(7000);
        this.uiLayer.add(this.bottomUI);

        this.balanceBg = this.add.rectangle(0, 0, 240, 68, 0x12203b, 0.98)
            .setStrokeStyle(4, 0x304a72)
            .setOrigin(0, 0.5);
        this.balanceBg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                this.balance += 100;
                this.updatePillowButtonLabels();
            });

        this.balanceText = this.add.text(120, 0, "$1000", {
            fontFamily: "Arial",
            fontSize: "52px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.turboBtn = this.add.container(0, 0);
        this.turboCircle = this.add.circle(0, 0, 32, 0x4e5a71, 1).setStrokeStyle(4, 0x9ca9c3);
        this.turboIcon = this.add.text(0, 0, "\u26A1", {
            fontFamily: "Arial",
            fontSize: "56px",
            color: "#ffd84f",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.turboBtn.add([this.turboCircle, this.turboIcon]);

        this.minusBtn = this.createMiniButton("-", () => this.changeBet(-1));
        this.plusBtn = this.createMiniButton("+", () => this.changeBet(1));

        this.betBg = this.add.rectangle(0, 0, 140, 68, 0x12203b, 0.98)
            .setStrokeStyle(4, 0x304a72)
            .setOrigin(0, 0.5);

        this.betText = this.add.text(70, 0, "$1", {
            fontFamily: "Arial",
            fontSize: "52px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.infoBtn = this.add.container(0, 0);
        const infoEgg = this.add.ellipse(0, 0, 48, 58, 0xeaeef8, 1).setStrokeStyle(3, 0xffffff);
        const infoBadge = this.add.circle(14, -10, 14, 0x5b80ff, 1).setStrokeStyle(2, 0xffffff);
        const infoTxt = this.add.text(14, -10, "i", {
            fontFamily: "Arial",
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.infoBtn.add([infoEgg, infoBadge, infoTxt]);

        this.winPanel = this.add.container(0, 0);
        const winBg = this.add.rectangle(0, 0, 220, 50, 0x17301f, 0.95).setStrokeStyle(3, 0x2f6a45);
        this.winText = this.add.text(0, 0, "WIN: 0", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#a7ffc0",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.winPanel.add([winBg, this.winText]);

        this.losePanel = this.add.container(0, 0);
        const loseBg = this.add.rectangle(0, 0, 220, 50, 0x3a1b1b, 0.95).setStrokeStyle(3, 0x7e3a3a);
        this.loseText = this.add.text(0, 0, "LOSE: 0", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#ffb2b2",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.losePanel.add([loseBg, this.loseText]);

        infoEgg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.toggleEggInfo(true));

        this.turboCircle.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                this.turboIndex = (this.turboIndex + 1) % 3;
                this.updateTurboVisual();
            });

        this.bottomUI.add([
            this.balanceBg, this.balanceText,
            this.turboBtn,
            this.minusBtn,
            this.betBg, this.betText,
            this.plusBtn,
            this.infoBtn
        ]);
        this.uiLayer.add([this.winPanel, this.losePanel]);

        this.updateTurboVisual();
        this.updateWinLoseLabels();
    },

    layoutBottomUI() {
        const y = this.H - 156;
        let x = 60;

        this.bottomUI.setPosition(0, y);

        this.balanceBg.setPosition(x, 0);
        this.balanceText.setPosition(x + 120, 0);
        x += 240 + 28;

        this.turboBtn.setPosition(x + 32, 0);
        x += 64 + 24;

        this.minusBtn.setPosition(x + 32, 0);
        x += 64 + 16;

        this.betBg.setPosition(x, 0);
        this.betText.setPosition(x + 70, 0);
        x += 140 + 16;

        this.plusBtn.setPosition(x + 32, 0);
        x += 64 + 24;

        this.infoBtn.setPosition(x + 28, 0);

        const totalW = x + 60;
        const maxW = this.W - 40;
        const scale = Math.min(1, maxW / totalW);
        this.bottomUI.setScale(scale);
        this.bottomUI.x = Math.max(16, (this.W - totalW * scale) * 0.5);
    },

    createMiniButton(label, onClick) {
        const c = this.add.container(0, 0);
        const bg = this.add.rectangle(0, 0, 64, 68, 0x12203b, 0.98)
            .setStrokeStyle(4, 0x304a72);
        const txt = this.add.text(0, 0, label, {
            fontFamily: "Arial",
            fontSize: "68px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        c.add([bg, txt]);

        bg.setInteractive({ useHandCursor: true })
            .on("pointerdown", onClick);

        return c;
    },

    createPillowButtons() {
        this.pillowButtons = {
            green: this.createPillowButton(0x46c466, 1),
            purple: this.createPillowButton(0x8e64ff, 2),
            red: this.createPillowButton(0xf04d4d, 5)
        };

        this.uiLayer.add([
            this.pillowButtons.green,
            this.pillowButtons.purple,
            this.pillowButtons.red
        ]);

        this.layoutPillowButtons();
        this.updatePillowButtonLabels();
    },

    layoutPillowButtons() {
        const baseW = 240;
        const baseGap = 32;
        const totalBase = baseW * 3 + baseGap * 2;
        const targetW = this.W - 60;
        const scale = Phaser.Math.Clamp((targetW / totalBase) * 1.15, 0.82, 1.22);
        const w = baseW * scale;
        const gap = baseGap * scale;
        const total = w * 3 + gap * 2;
        const baseY = this.bottomUI.y - Math.round(126 * scale);
        const startX = (this.W - total) * 0.5 + w * 0.5;

        this.pillowButtons.green.setScale(scale);
        this.pillowButtons.purple.setScale(scale);
        this.pillowButtons.red.setScale(scale);

        this.pillowButtons.green.setPosition(startX, baseY);
        this.pillowButtons.purple.setPosition(startX + w + gap, baseY);
        this.pillowButtons.red.setPosition(startX + (w + gap) * 2, baseY);

        const panelY = baseY - Math.round(86 * scale);
        this.winPanel.setScale(scale);
        this.losePanel.setScale(scale);
        this.winPanel.setPosition(this.W * 0.5 - (110 * scale + 12), panelY);
        this.losePanel.setPosition(this.W * 0.5 + (110 * scale + 12), panelY);
    },

    createPillowButton(color, mult) {
        const c = this.add.container(0, 0).setDepth(7000);

        const shadow = this.add.ellipse(0, 34, 150, 22, 0x000000, 0.28);
        const body = this.add.rectangle(0, 0, 240, 86, color, 1)
            .setStrokeStyle(4, 0xffffff);

        const gloss = this.add.rectangle(0, -16, 160, 20, 0xffffff, 0.12);

        const txt = this.add.text(0, 0, "0$", {
            fontFamily: "Arial",
            fontSize: "56px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        c.add([shadow, body, gloss, txt]);
        c._mult = mult;
        c._txt = txt;
        c._body = body;
        c._baseColor = color;

        body.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.placeLine1Pillow(color, mult));

        return c;
    },

    updatePillowButtonLabels() {
        for (const key of Object.keys(this.pillowButtons)) {
            const btn = this.pillowButtons[key];
            const cost = this.bet * btn._mult;
            const canAfford = this.balance >= cost;
            btn._txt.setText(`${cost}$`);
            btn._body.setFillStyle(canAfford ? btn._baseColor : 0x7a7a7a, 1);
            btn.setAlpha(canAfford ? 1 : 0.86);
            btn._txt.setAlpha(canAfford ? 1 : 0.82);
        }

        this.balanceText.setText(`$${Math.round(this.balance)}`);
        this.betText.setText(`$${this.bet}`);
        this.updateWinLoseLabels();
    },

    updateWinLoseLabels() {
        if (!this.winText || !this.loseText) return;
        this.winText.setText(`WIN: ${Math.round(this.winTotal)}$`);
        this.loseText.setText(`LOSE: ${Math.round(this.loseTotal)}$`);
    },

    addWin(amount) {
        if (amount <= 0) return;
        this.winTotal += amount;
        this.updateWinLoseLabels();
    },

    addLose(amount) {
        if (amount <= 0) return;
        this.loseTotal += amount;
        this.updateWinLoseLabels();
    },

    changeBet(dir) {
        this.betIndex = Phaser.Math.Clamp(this.betIndex + dir, 0, this.betSteps.length - 1);
        this.bet = this.betSteps[this.betIndex];
        this.updatePillowButtonLabels();
    },

    updateTurboVisual() {
        if (this.turboIndex === 0) {
            this.turboCircle.setFillStyle(0x4e5a71, 1).setStrokeStyle(4, 0x9ca9c3);
        } else if (this.turboIndex === 1) {
            this.turboCircle.setFillStyle(0xe7c33a, 1).setStrokeStyle(4, 0xffefab);
        } else {
            this.turboCircle.setFillStyle(0xd84d4d, 1).setStrokeStyle(4, 0xffb1b1);
        }
    },

    getTurboMultiplier() {
        return this.turboValues[this.turboIndex] || 1;
    },

    createEggInfoPopup() {
        this.infoPopup = this.add.container(0, 0).setDepth(9000);
        this.popupLayer.add(this.infoPopup);

        this.infoOverlay = this.add.rectangle(0, 0, this.BASE_W, this.BASE_H, 0x000000, 0.55)
            .setOrigin(0, 0)
            .setInteractive();

        this.infoBg = this.add.rectangle(0, 0, 780, 620, 0x13213b, 0.98)
            .setStrokeStyle(4, 0x39547e);

        this.infoTitle = this.add.text(0, 0, "Egg Types", {
            fontFamily: "Arial",
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.infoClose = this.add.text(0, 0, "X", {
            fontFamily: "Arial",
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.infoClose.on("pointerdown", () => this.toggleEggInfo(false));
        this.infoOverlay.on("pointerdown", () => this.toggleEggInfo(false));

        this.infoRows = [];
        for (const egg of this.eggTypes) {
            const row = this.add.container(0, 0);
            const icon = this.add.ellipse(0, 0, 36, 46, egg.color, 1).setStrokeStyle(2, egg.stroke);
            const txt = this.add.text(40, -16, `${egg.label} - ${egg.mult}x`, {
                fontFamily: "Arial",
                fontSize: "30px",
                color: Phaser.Display.Color.IntegerToColor(egg.color).rgba,
                fontStyle: "bold"
            });
            row.add([icon, txt]);
            this.infoRows.push(row);
        }

        this.infoPopup.add([
            this.infoOverlay,
            this.infoBg,
            this.infoTitle,
            this.infoClose,
            ...this.infoRows
        ]);

        this.toggleEggInfo(false);
    },

    layoutInfoPopup() {
        const cx = this.W * 0.5;
        const cy = this.H * 0.5;

        this.infoOverlay.width = this.W;
        this.infoOverlay.height = this.H;

        this.infoBg.setPosition(cx, cy);
        this.infoTitle.setPosition(cx, cy - 240);
        this.infoClose.setPosition(cx + 330, cy - 240);

        let y = cy - 160;
        for (const row of this.infoRows) {
            row.setPosition(cx - 230, y);
            y += 72;
        }
    },

    toggleEggInfo(show) {
        this.infoPopup.setVisible(show);
    },

    createMusicSafe() {
        if (this.bgm) return;

        this.bgm = this.sound.add("bgm_main", {
            loop: true,
            volume: 0.35
        });

        const tryPlay = () => {
            if (!this.bgm || this.bgm.isPlaying) return;
            this.bgm.play();
        };

        tryPlay();
        this.input.once("pointerdown", tryPlay);
        this.sound.once("unlocked", tryPlay);

        this.events.once("shutdown", () => {
            if (!this.bgm) return;
            this.bgm.stop();
            this.bgm.destroy();
            this.bgm = null;
        });
    }
};
