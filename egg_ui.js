window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.ui = {
    mixColor(from, to, amount) {
        return Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(from),
            Phaser.Display.Color.ValueToColor(to),
            100,
            amount
        ).color;
    },

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

        this.createAutoDropSwitch();

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

        this.updateTurboVisual();
        this.updateAutoDropSwitchVisual(true);
    },

    createAutoDropSwitch() {
        this.autoDropSwitch = this.add.container(0, 0).setDepth(7000);
        this.uiLayer.add(this.autoDropSwitch);

        this.autoDropPanelShadow = this.add.rectangle(0, 16, 392, 76, 0x000000, 0.22);
        this.autoDropPanel = this.add.rectangle(0, 0, 392, 72, 0x16243f, 0.98)
            .setStrokeStyle(4, 0x35517d);
        this.autoDropTrack = this.add.rectangle(0, 0, 290, 18, 0x0a1017, 1).setStrokeStyle(2, 0x2c3f5a);

        this.autoDropNotches = [-106, 0, 106].map(x => {
            const notch = this.add.circle(x, 0, 5, 0x7183a0, 0.55);
            this.autoDropSwitch.add(notch);
            return notch;
        });

        this.autoDropLabels = [
            this.add.text(-106, 26, "STOP", {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#9cacbe",
                fontStyle: "bold"
            }).setOrigin(0.5),
            this.add.text(0, 26, "EVERY", {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#9cacbe",
                fontStyle: "bold"
            }).setOrigin(0.5),
            this.add.text(106, 26, "RANDOM", {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#9cacbe",
                fontStyle: "bold"
            }).setOrigin(0.5)
        ];

        this.autoDropLever = this.add.container(-106, 0);
        const leverShadow = this.add.ellipse(6, 18, 70, 26, 0x000000, 0.22);
        const leverStem = this.add.rectangle(-2, 2, 12, 34, 0x515f72, 1).setStrokeStyle(3, 0x9aa8bc);
        const leverJoint = this.add.circle(0, 0, 11, 0xc5cfdb, 1).setStrokeStyle(3, 0xffffff);
        const leverHead = this.add.circle(0, -16, 21, 0xc93e3e, 1).setStrokeStyle(4, 0xffd2d2);
        const leverHeadGlow = this.add.circle(-5, -21, 7, 0xffffff, 0.3);
        this.autoDropLever.add([leverShadow, leverStem, leverJoint, leverHead, leverHeadGlow]);
        this.autoDropLeverShadow = leverShadow;
        this.autoDropLeverStem = leverStem;
        this.autoDropLeverJoint = leverJoint;
        this.autoDropLeverHead = leverHead;

        const dragHandle = this.add.rectangle(0, -6, 72, 70, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
        dragHandle.on("pointerdown", pointer => this.beginAutoDropDrag(pointer));
        this.autoDropLever.add(dragHandle);

        this.autoDropSwitch.add([
            this.autoDropPanelShadow,
            this.autoDropPanel,
            this.autoDropTrack,
            this.autoDropLever,
            ...this.autoDropLabels
        ]);

        this.input.on("pointermove", this.updateAutoDropDrag, this);
        this.input.on("pointerup", this.endAutoDropDrag, this);
        this.events.once("shutdown", () => {
            this.input.off("pointermove", this.updateAutoDropDrag, this);
            this.input.off("pointerup", this.endAutoDropDrag, this);
        });
    },

    beginAutoDropDrag(pointer) {
        this.autoDropDragging = true;
        this.updateAutoDropDrag(pointer);
    },

    updateAutoDropDrag(pointer) {
        if (!this.autoDropDragging || !this.autoDropSwitch) return;

        const localX = Phaser.Math.Clamp(
            (pointer.x - this.autoDropSwitch.x) / (this.autoDropSwitch.scaleX || 1),
            -106,
            106
        );

        this.autoDropLever.x = localX;
        this.autoDropLeverShadow.alpha = 0.12;
        this.autoDropPreviewMode = localX < -53 ? 0 : localX < 53 ? 1 : 2;
        this.updateAutoDropSwitchVisual(true, this.autoDropPreviewMode);
    },

    endAutoDropDrag() {
        if (!this.autoDropDragging) return;
        this.autoDropDragging = false;
        const mode = typeof this.autoDropPreviewMode === "number" ? this.autoDropPreviewMode : this.autoDropMode;
        this.autoDropPreviewMode = null;
        this.setAutoDropMode(mode);
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
        const shadow = this.add.rectangle(0, 8, 64, 68, 0x09111f, 0.38).setStrokeStyle(0);
        const face = this.add.container(0, -4);
        const bg = this.add.rectangle(0, 0, 64, 68, 0x12203b, 0.98).setStrokeStyle(4, 0x304a72);
        const txt = this.add.text(0, 0, label, {
            fontFamily: "Arial",
            fontSize: "68px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        face.add([bg, txt]);
        c.add([shadow, face]);

        const press = pressed => {
            face.y = pressed ? 2 : -4;
            shadow.alpha = pressed ? 0.16 : 0.38;
            bg.setFillStyle(pressed ? 0x1d3359 : 0x12203b, 1).setStrokeStyle(4, pressed ? 0x5e8ed2 : 0x304a72);
        };

        bg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => press(true))
            .on("pointerup", () => {
                press(false);
                onClick();
            })
            .on("pointerout", () => press(false));

        return c;
    },

    createPillowButtons() {
        this.pillowButtons = {
            green: this.createPillowButton("green", 0x46c466, 1),
            purple: this.createPillowButton("purple", 0x8e64ff, 2),
            red: this.createPillowButton("red", 0xf04d4d, 5)
        };

        this.uiLayer.add([this.pillowButtons.green, this.pillowButtons.purple, this.pillowButtons.red]);
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

        const switchY = baseY - Math.round(146 * scale);
        this.autoDropSwitch.setScale(scale);
        this.autoDropSwitch.setPosition(this.W * 0.5, switchY);
    },

    createPillowButton(key, color, mult) {
        const c = this.add.container(0, 0).setDepth(7000);
        const sideColor = this.mixColor(color, 0x080808, 56);
        const socketColor = this.mixColor(color, 0x101010, 68);
        const shadow = this.add.ellipse(0, 42, 164, 24, sideColor, 0.22);
        const socket = this.add.rectangle(0, 18, 236, 96, socketColor, 0.95).setStrokeStyle(4, this.mixColor(color, 0xffffff, 24));
        const face = this.add.container(0, -10);
        const body = this.add.rectangle(0, 0, 240, 86, color, 1).setStrokeStyle(4, 0xffffff);
        const gloss = this.add.rectangle(0, -16, 160, 20, 0xffffff, 0.12);
        const txt = this.add.text(0, 0, "0$", {
            fontFamily: "Arial",
            fontSize: "56px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        face.add([body, gloss, txt]);
        c.add([shadow, socket, face]);

        c._key = key;
        c._mult = mult;
        c._txt = txt;
        c._body = body;
        c._gloss = gloss;
        c._face = face;
        c._shadow = shadow;
        c._socket = socket;
        c._baseColor = color;
        c._isSelected = false;
        c._isDisabled = false;
        c._pressDepth = 0;
        c._flash = 0;

        body.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.handlePillowButtonPress(c));

        return c;
    },

    handlePillowButtonPress(btn) {
        if (this.autoDropMode > 0) {
            this.setAutoDropPillow(btn._key);
            return;
        }

        const placed = this.placeLine1Pillow(btn._baseColor, btn._mult);
        this.animatePillowButtonPress(btn, placed);
    },

    animatePillowButtonPress(btn, success = true) {
        if (!btn || btn._isDisabled) return;

        this.tweens.killTweensOf(btn);
        btn._flash = success ? 1 : 0.45;
        this.tweens.add({
            targets: btn,
            _pressDepth: 10,
            duration: 85,
            ease: "Quad.Out",
            yoyo: true,
            onUpdate: () => this.updateSinglePillowButtonVisual(btn)
        });
        this.tweens.add({
            targets: btn,
            _flash: 0,
            duration: 240,
            ease: "Quad.Out",
            onUpdate: () => this.updateSinglePillowButtonVisual(btn)
        });
    },

    updatePillowButtonLabels() {
        for (const key of Object.keys(this.pillowButtons)) {
            const btn = this.pillowButtons[key];
            const cost = this.bet * btn._mult;
            const canAfford = this.balance >= cost;
            const needsSelection = this.autoDropMode > 0;

            btn._txt.setText(`${cost}$`);
            btn._canAfford = canAfford;
            btn._isDisabled = needsSelection ? this.autoDropSelectedKey !== key : !canAfford;
            btn._isSelected = this.autoDropSelectedKey === key && this.autoDropMode > 0;
            this.updateSinglePillowButtonVisual(btn);
        }

        this.balanceText.setText(`$${Math.round(this.balance)}`);
        this.betText.setText(`$${this.bet}`);
        this.updateAutoDropSwitchVisual();
    },

    updateSinglePillowButtonVisual(btn) {
        const selected = !!btn._isSelected;
        const disabled = !!btn._isDisabled;
        const afford = btn._canAfford !== false;
        const pressDepth = btn._pressDepth || 0;
        const flash = btn._flash || 0;

        const topColor = disabled
            ? this.mixColor(btn._baseColor, 0x444444, 60)
            : selected
                ? this.mixColor(btn._baseColor, 0xffffff, 12)
                : this.mixColor(btn._baseColor, 0x161616, 18);
        const sideColor = disabled
            ? this.mixColor(btn._baseColor, 0x222222, 74)
            : this.mixColor(btn._baseColor, 0x070707, selected ? 52 : 62);

        btn._face.y = (selected ? 4 : -10) + pressDepth;
        btn._shadow.y = selected ? 28 : 42;
        btn._shadow.alpha = selected ? 0.08 : 0.22;

        btn._body.setFillStyle(this.mixColor(topColor, 0xffffff, flash * 38), 1);
        btn._body.setStrokeStyle(4, selected || flash > 0.05 ? 0xffffff : this.mixColor(btn._baseColor, 0xffffff, 32));
        btn._socket.setFillStyle(sideColor, 0.98).setStrokeStyle(4, this.mixColor(btn._baseColor, 0xffffff, selected ? 28 : 18));
        btn._gloss.alpha = selected ? 0.24 : 0.11 + flash * 0.12;
        btn._txt.setAlpha(disabled && !selected ? 0.58 : afford ? 1 : 0.72);
        btn._txt.setScale(1 + flash * 0.06);
        btn.setAlpha(disabled && !selected ? 0.72 : 1);
    },

    setAutoDropMode(mode) {
        if (this.autoDropMode === mode) {
            this.updateAutoDropSwitchVisual();
            return;
        }

        this.autoDropMode = mode;
        this.autoDropCheckSlot = null;
        this.autoDropSelectedKey = null;
        this.autoDropSelectedMult = 0;
        this.updatePillowButtonLabels();
    },

    setAutoDropPillow(key) {
        if (this.autoDropMode === 0) return;
        const btn = this.pillowButtons[key];
        if (!btn) return;

        this.autoDropSelectedKey = key;
        this.autoDropSelectedMult = btn._mult;
        this.updatePillowButtonLabels();
        this.animatePillowButtonPress(btn, true);
    },

    updateAutoDropSwitchVisual(immediate = false, previewMode = null) {
        if (!this.autoDropSwitch) return;

        const mode = previewMode ?? this.autoDropMode;
        const xPositions = [-106, 0, 106];
        const fills = [0xc93e3e, 0x54c86b, 0xf0b947];
        const activeX = xPositions[mode] ?? -106;

        if (immediate || this.autoDropDragging) {
            this.autoDropLever.x = activeX;
        } else {
            this.tweens.killTweensOf(this.autoDropLever);
            this.tweens.add({
                targets: this.autoDropLever,
                x: activeX,
                duration: 140,
                ease: "Back.Out"
            });
        }

        this.autoDropLeverHead.setFillStyle(fills[mode] || 0xc93e3e, 1);
        this.autoDropLeverStem.setFillStyle(this.mixColor(fills[mode] || 0xc93e3e, 0x333333, 58), 1);
        this.autoDropLeverShadow.alpha = this.autoDropDragging ? 0.12 : 0.22;

        for (let i = 0; i < this.autoDropLabels.length; i++) {
            this.autoDropLabels[i].setColor(i === mode ? "#ffffff" : "#9cacbe");
            this.autoDropLabels[i].setAlpha(i === mode ? 1 : 0.68);
        }
    },

    addWin() {},

    addLose() {},

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
