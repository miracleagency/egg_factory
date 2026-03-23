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

        this.midHud = this.add.container(0, 0).setDepth(7000);
        this.uiLayer.add(this.midHud);
        this.roundHudLeft = this.add.container(0, 0);
        this.roundHudRight = this.add.container(0, 0);
        this.eggsPanel = this.add.rectangle(0, 0, 250, 186, 0x16243f, 0.98)
            .setStrokeStyle(4, 0x35517d);
        this.eggsLeftLabel = this.add.text(0, -42, "EGGS LEFT:", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#9cb6d8",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.eggsLeftText = this.add.text(0, 24, "20", {
            fontFamily: "Arial",
            fontSize: "72px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.eggsHud = this.add.container(0, 0);
        this.eggsHud.add([this.eggsPanel, this.eggsLeftLabel, this.eggsLeftText]);

        this.winPanel = this.add.rectangle(0, 0, 250, 186, 0x16243f, 0.98)
            .setStrokeStyle(4, 0x35517d);
        this.winLabel = this.add.text(0, -42, "WIN:", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#9cb6d8",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.winAmountText = this.add.text(0, 24, "0$", {
            fontFamily: "Arial",
            fontSize: "72px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#101010",
            strokeThickness: 6
        }).setOrigin(0.5);
        this.winHud = this.add.container(0, 0);
        this.winHud.add([this.winPanel, this.winLabel, this.winAmountText]);

        this.balanceText = this.add.text(0, -44, "BALANCE: $1000", {
            fontFamily: "Arial",
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0, 0.5);

        this.turboBtn = this.add.container(0, 0);
        this.turboCircle = this.add.circle(0, 0, 32, 0x4e5a71, 1).setStrokeStyle(4, 0x9ca9c3);
        this.turboIcon = this.add.text(0, 0, "\u26A1", {
            fontFamily: "Arial",
            fontSize: "56px",
            color: "#ffd84f",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.turboBtn.add([this.turboCircle, this.turboIcon]);

        this.betText = this.add.text(0, 44, "BET: 1$", {
            fontFamily: "Arial",
            fontSize: "38px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(1, 0.5);

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
        this.pauseBtn = this.createPopupActionButton("PAUSE", () => this.toggleManualPause(), {
            bodyColor: 0x9159ff,
            socketColor: 0x4f2b88,
            strokeColor: 0xe0d1ff,
            textStroke: "#23153d",
            width: 310,
            fontSize: 36,
            pulse: false
        });

        infoEgg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.toggleEggInfo(true));

        this.turboCircle.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                this.turboIndex = (this.turboIndex + 1) % 3;
                this.updateTurboVisual();
            });

        this.roundHudLeft.add([this.balanceText, this.betText]);
        this.roundHudRight.add([this.turboBtn, this.infoBtn]);
        this.bottomUI.add([this.roundHudLeft, this.roundHudRight]);
        this.midHud.add([this.eggsHud, this.winHud, this.pauseBtn]);

        this.updateTurboVisual();
        this.createRoundSetupPopup();
        this.createRoundEndPopup();
        this.updatePillowButtonLabels();
    },

    createDebugOverlay() {
        this.debugLogs = [];
        this.debugOverlay = this.add.container(0, 0).setDepth(9800).setVisible(false);
        this.popupLayer.add(this.debugOverlay);

        this.debugOverlayBg = this.add.rectangle(0, 0, 940, 520, 0x120f18, 0.96)
            .setStrokeStyle(4, 0xff8f6b);
        this.debugOverlayTitle = this.add.text(0, 0, "Debug Log", {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#ffd8c9",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.debugOverlayText = this.add.text(0, 0, "", {
            fontFamily: "Courier New",
            fontSize: "20px",
            color: "#fff1ea",
            lineSpacing: 6,
            wordWrap: { width: 860 }
        }).setOrigin(0, 0);
        this.debugOverlayClose = this.add.text(0, 0, "CLOSE", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            fontStyle: "bold",
            backgroundColor: "#a43d2c"
        }).setPadding(12, 8, 12, 8).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.debugOverlayClose.on("pointerdown", () => this.toggleDebugOverlay(false));

        this.debugOverlay.add([
            this.debugOverlayBg,
            this.debugOverlayTitle,
            this.debugOverlayText,
            this.debugOverlayClose
        ]);
    },

    addDebugLog(message) {
        const stamp = new Date().toISOString().slice(11, 19);
        this.debugLogs = this.debugLogs || [];
        this.debugLogs.push(`[${stamp}] ${message}`);
        if (this.debugLogs.length > 18) this.debugLogs.shift();
        if (this.debugOverlayText) {
            this.debugOverlayText.setText(this.debugLogs.join("\n"));
        }
    },

    toggleDebugOverlay(show) {
        if (!this.debugOverlay) return;
        this.debugOverlay.setVisible(show);
        if (show && this.debugOverlayText) {
            this.debugOverlayText.setText((this.debugLogs || []).join("\n"));
        }
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
            this.input.off("pointerup", this.handleGlobalPillowPointerUp, this);
            this.input.off("gameout", this.handleGlobalPillowPointerCancel, this);
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
        const y = this.H - 168;
        const scale = Phaser.Math.Clamp(this.W / 1080, 0.82, 1.02);
        this.bottomUI.setScale(scale);
        this.bottomUI.setPosition(0, y);
        this.roundHudLeft.setPosition(0, 0);
        this.roundHudRight.setPosition(this.W / scale - 130, -82);
        this.balanceText.setPosition(34, 30);
        this.betText.setPosition(this.W / scale - 34, 30);
        this.turboBtn.setPosition(-56, 0).setScale(1.2);
        this.infoBtn.setPosition(46, 0).setScale(1.2);

        const hudTop = (this.lines && this.lines.line1)
            ? this.lines.line1.y + this.lines.line1.h + 80
            : this.H * 0.56;
        const hudBottom = y - 120;
        const midY = Math.round((hudTop + hudBottom) * 0.5) - 42;
        this.midHud.setPosition(this.W * 0.5, midY);
        this.eggsHud.setPosition(-150, 0);
        this.winHud.setPosition(150, 0);
        this.pauseBtn.setPosition(0, 168);
        this.eggsLeftLabel.setPosition(0, -52);
        this.eggsLeftText.setPosition(0, 12);
        this.winLabel.setPosition(0, -52);
        this.winAmountText.setPosition(0, 12);

        if (this.roundEndPopup) {
            const cx = this.W * 0.5;
            const cy = this.H * 0.5;
            this.roundEndPopupBg.setPosition(cx, cy);
            this.roundEndPopupGlow.setPosition(cx, cy);
            this.roundEndPopupSubtitle.setPosition(cx, cy - 104);
            this.roundEndPopupValue.setPosition(cx, cy - 14);
            this.roundEndPopupButton.setPosition(cx, cy + 198);
            this.roundEndPopupSparkles.forEach((spark, index) => {
                const positions = [
                    [-310, -220], [300, -210], [-330, 26], [330, 52], [-242, 226], [260, 216]
                ];
                const [sx, sy] = positions[index] || [0, 0];
                spark.setPosition(cx + sx, cy + sy);
            });
            this.layoutRoundEndTitle(cx, cy - 222);
        }

        this.layoutRoundSetupPopup();
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
        this.pillowButtons = {};
    },

    layoutPillowButtons() {
        return;
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
        c._manualDown = false;
        c._bounceScale = 1;
        c._pointerDown = false;

        body.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.onPillowButtonDown(c))
            .on("pointerout", () => this.onPillowButtonOut(c));

        return c;
    },

    onPillowButtonDown(btn) {
        if (!btn || btn._isDisabled) return;
        this.stopPillowButtonBounce(btn);
        btn._manualDown = true;
        btn._pointerDown = true;
        btn._pressDepth = 16;
        btn._flash = 0.04;
        btn._bounceScale = 0.985;
        this.updateSinglePillowButtonVisual(btn);
    },

    onPillowButtonUp(btn, cancelled = false) {
        if (!btn || btn._isDisabled) return;
        const wasDown = btn._pointerDown;
        btn._pointerDown = false;
        btn._manualDown = false;
        if (!wasDown) return;
        if (cancelled) {
            btn._pressDepth = 0;
            btn._bounceScale = 1;
            this.updateSinglePillowButtonVisual(btn);
            return;
        }
        this.handlePillowButtonPress(btn);
    },

    onPillowButtonOut(btn) {
        if (!btn) return;
        if (!btn._pointerDown && !btn._bounceEvent) {
            this.stopPillowButtonBounce(btn);
            btn._manualDown = false;
            btn._pressDepth = 0;
            btn._bounceScale = 1;
            this.updateSinglePillowButtonVisual(btn);
        }
    },

    handleGlobalPillowPointerUp() {
        if (!this.pillowButtons) return;
        for (const key of Object.keys(this.pillowButtons)) {
            const btn = this.pillowButtons[key];
            if (btn && btn._pointerDown) {
                this.onPillowButtonUp(btn, false);
            }
        }
    },

    handleGlobalPillowPointerCancel() {
        if (!this.pillowButtons) return;
        for (const key of Object.keys(this.pillowButtons)) {
            const btn = this.pillowButtons[key];
            if (btn && btn._pointerDown) {
                this.onPillowButtonUp(btn, false);
            }
        }
    },

    stopPillowButtonBounce(btn) {
        if (!btn) return;
        this.tweens.killTweensOf(btn);
        this.tweens.killTweensOf(btn._txt);
        if (btn._bounceEvent) {
            btn._bounceEvent.remove();
            btn._bounceEvent = null;
        }
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

        this.stopPillowButtonBounce(btn);
        btn._manualDown = false;
        btn._pointerDown = false;
        btn._flash = success ? 0.16 : 0.08;
        btn._pressDepth = 15;
        btn._bounceScale = 0.985;
        this.updateSinglePillowButtonVisual(btn);

        const amp = success ? 15 : 8;
        const fHz = success ? 5.8 : 4.8;
        const decay = success ? 6.6 : 7.5;
        const t0 = this.time.now / 1000;

        btn._bounceEvent = this.time.addEvent({
            loop: true,
            delay: 16,
            callback: () => {
                const t = this.time.now / 1000 - t0;
                const offset = amp * Math.cos(2 * Math.PI * fHz * t) * Math.exp(-decay * t);
                btn._pressDepth = Math.max(-7, offset);
                btn._bounceScale = 1 + Math.max(0, -offset) * 0.004;
                btn._flash = (success ? 0.1 : 0.05) * Math.exp(-5.4 * t);
                this.updateSinglePillowButtonVisual(btn);

                        if (Math.abs(offset) < 0.22 || t > 1.6) {
                            btn._bounceEvent.remove();
                            btn._bounceEvent = null;
                            btn._pressDepth = 0;
                            btn._bounceScale = 1;
                            btn._flash = 0;
                            this.updateSinglePillowButtonVisual(btn);
                }
            }
        });
    },

    updatePillowButtonLabels() {
        this.balanceText.setText(`BALANCE: $${Math.round(this.balance)}`);
        this.betText.setText(`BET: ${this.bet}$`);
        if (this.winAmountText) this.winAmountText.setText(this.formatMoneyValue(this.winTotal || 0));
        if (this.eggsLeftText) this.eggsLeftText.setText(`${Math.max(0, this.remainingEggCount || 0)}`);
        if (this.pauseBtn && this.pauseBtn._label) {
            this.pauseBtn._label.setText(this.manualPauseActive ? "RESUME" : "PAUSE");
        }
        this.updateRoundSetupPopupLabels();
    },

    updateSinglePillowButtonVisual(btn) {
        const selected = !!btn._isSelected;
        const disabled = !!btn._isDisabled;
        const afford = btn._canAfford !== false;
        const autoSelectable = !!btn._autoSelectable;
        const pressDepth = btn._pressDepth || 0;
        const flash = btn._flash || 0;
        const manualDown = !!btn._manualDown;
        const bounceScale = btn._bounceScale || 1;
        const pressedLike = selected || manualDown;

        const topColor = disabled
            ? this.mixColor(btn._baseColor, 0x444444, 60)
            : pressedLike
                ? this.mixColor(btn._baseColor, 0xffffff, 12)
                : this.mixColor(btn._baseColor, 0x161616, 18);
        const sideColor = disabled
            ? this.mixColor(btn._baseColor, 0x222222, 74)
            : this.mixColor(btn._baseColor, 0x070707, pressedLike ? 52 : 62);

        btn._face.y = (pressedLike ? 4 : -10) + pressDepth;
        btn._face.setScale(bounceScale);
        btn._shadow.y = (pressedLike ? 28 : 42) - Math.max(0, pressDepth * 0.6);
        btn._shadow.alpha = manualDown ? 0.08 : (pressedLike ? 0.08 : 0.22);

        btn._body.setFillStyle(this.mixColor(topColor, 0xffffff, flash * 38), 1);
        btn._body.setStrokeStyle(4, pressedLike || flash > 0.05 ? 0xffffff : this.mixColor(btn._baseColor, 0xffffff, 32));
        btn._socket.setFillStyle(sideColor, 0.98).setStrokeStyle(4, this.mixColor(btn._baseColor, 0xffffff, pressedLike ? 28 : 18));
        btn._gloss.alpha = pressedLike ? 0.12 : 0.05;
        btn._txt.setAlpha(disabled && !selected ? 0.58 : afford ? 1 : 0.72);
        btn._txt.setScale((1 + flash * 0.06) * bounceScale);
        btn.setAlpha(disabled && !selected ? 0.72 : 1);
    },

    setAutoDropMode(mode) {
        if (this.autoDropMode === mode) {
            this.updateAutoDropSwitchVisual();
            return;
        }

        this.autoDropMode = mode;
        this.autoDropCheckSlot = null;
        this.releaseAllAutoDropButtons();
        this.autoDropSelectedKeys = [];
        this.updatePillowButtonLabels();
    },

    releaseAllAutoDropButtons() {
        if (!this.pillowButtons) return;
        for (const key of Object.keys(this.pillowButtons)) {
            const btn = this.pillowButtons[key];
            if (btn && btn._isSelected) {
                this.animatePillowButtonPress(btn, false);
            }
        }
    },

    setAutoDropPillow(key) {
        if (this.autoDropMode === 0) return;
        const btn = this.pillowButtons[key];
        if (!btn) return;

        const selectedKeys = Array.isArray(this.autoDropSelectedKeys) ? [...this.autoDropSelectedKeys] : [];

        if (this.autoDropMode === 1) {
            for (const oldKey of selectedKeys) {
                if (oldKey !== key && this.pillowButtons[oldKey]) {
                    this.animatePillowButtonPress(this.pillowButtons[oldKey], false);
                }
            }
            this.autoDropSelectedKeys = [key];
            this.updatePillowButtonLabels();
            this.animatePillowButtonPress(btn, true);
            return;
        }

        if (selectedKeys.includes(key)) {
            this.autoDropSelectedKeys = selectedKeys.filter(entry => entry !== key);
            this.updatePillowButtonLabels();
            this.animatePillowButtonPress(btn, false);
            return;
        }

        selectedKeys.push(key);
        this.autoDropSelectedKeys = selectedKeys;
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

    addWin(amount = 0) {
        this.winTotal = (this.winTotal || 0) + Math.max(0, amount || 0);
        this.updatePillowButtonLabels();
    },

    addLose() {},

    changeBet(dir = 0) {
        this.betIndex = Phaser.Math.Clamp((this.betIndex || 0) + dir, 0, (this.betSteps || [1]).length - 1);
        this.bet = (this.betSteps && this.betSteps[this.betIndex]) || 1;
        this.updatePillowButtonLabels();
        this.updateRoundSetupPopupLabels();
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

    createPopupActionButton(label, onClick, options = {}) {
        const btn = this.add.container(0, 0);
        const width = options.width || 320;
        const shadow = this.add.ellipse(0, 48, Math.max(220, width - 40), 30, 0x09111f, 0.28);
        const socket = this.add.rectangle(0, 20, width - 4, 100, options.socketColor || 0x1f662f, 0.98).setStrokeStyle(4, options.strokeColor || 0x9ff0ae);
        const face = this.add.container(0, -8);
        const body = this.add.rectangle(0, 0, width, 88, options.bodyColor || 0x46c466, 1).setStrokeStyle(4, 0xffffff);
        const gloss = this.add.rectangle(0, -16, Math.max(180, width - 108), 18, 0xffffff, 0.14);
        const txt = this.add.text(0, 0, label, {
            fontFamily: "Arial",
            fontSize: `${options.fontSize || 38}px`,
            color: "#ffffff",
            fontStyle: "bold",
            stroke: options.textStroke || "#163021",
            strokeThickness: 4
        }).setOrigin(0.5);

        face.add([body, gloss, txt]);
        btn.add([shadow, socket, face]);

        const setPressed = pressed => {
            face.y = pressed ? 6 : -8;
            shadow.alpha = pressed ? 0.1 : 0.28;
            body.setFillStyle(pressed ? this.mixColor(options.bodyColor || 0x46c466, 0xffffff, 18) : (options.bodyColor || 0x46c466), 1);
        };

        body.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => setPressed(true))
            .on("pointerup", () => {
                setPressed(false);
                onClick();
            })
            .on("pointerout", () => setPressed(false));

        if (options.pulse !== false) {
            this.tweens.add({
                targets: btn,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 760,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        }

        btn._label = txt;
        return btn;
    },

    createQuestionEggVisual() {
        const c = this.add.container(0, 0);
        const body = this.add.ellipse(0, 0, 44, 58, 0x778190, 1).setStrokeStyle(3, 0xd5dce6);
        const shine = this.add.ellipse(-8, -12, 8, 14, 0xffffff, 0.22);
        const q = this.add.text(0, 2, "?", {
            fontFamily: "Arial",
            fontSize: "40px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#38424e",
            strokeThickness: 5
        }).setOrigin(0.5);
        c.add([body, shine, q]);
        return c;
    },

    createRoundSetupPopup() {
        this.roundSetupOverlay = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.52)
            .setOrigin(0, 0)
            .setDepth(9340)
            .setVisible(false)
            .setInteractive();
        this.popupLayer.add(this.roundSetupOverlay);

        this.roundSetupPopup = this.add.container(0, 0).setDepth(9350).setVisible(false);
        this.popupLayer.add(this.roundSetupPopup);

        this.roundSetupBg = this.add.rectangle(0, 0, 900, 1180, 0x141f38, 0.97).setStrokeStyle(5, 0xffe395);
        this.roundSetupGlow = this.add.ellipse(0, 0, 920, 1220, 0xffd45c, 0.10);
        this.roundSetupTitle = this.add.container(0, 0);
        this.roundSetupTitleLetters = [];
        for (const char of "WHAT THE SHELL?") {
            const letter = this.add.text(0, 0, char, {
                fontFamily: "Arial",
                fontSize: "64px",
                color: Phaser.Utils.Array.GetRandom(["#ff6b6b", "#ffb347", "#ffe66d", "#67e8a5", "#62d6ff", "#b98cff"]),
                fontStyle: "bold",
                stroke: "#142035",
                strokeThickness: 8
            }).setOrigin(0.5);
            this.roundSetupTitle.add(letter);
            this.roundSetupTitleLetters.push(letter);
        }
        this.roundSetupTitleLetters.forEach((letter, index) => {
            this.tweens.add({
                targets: letter,
                y: "+=16",
                duration: 360,
                delay: index * 55,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        });

        this.roundSetupHint = this.add.text(0, 0, "Reveal the hidden eggs before the round starts", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#d9e7ff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.roundSetupGrid = this.add.container(0, 0);
        this.roundSetupCells = [];
        for (let i = 0; i < 20; i++) {
            const cell = this.add.container(0, 0);
            const plate = this.add.rectangle(0, 0, 126, 118, 0x203052, 0.94).setStrokeStyle(3, 0x47689b);
            cell.add(plate);
            cell._plate = plate;
            this.roundSetupCells.push(cell);
            this.roundSetupGrid.add(cell);
        }

        this.roundSetupMinusBtn = this.createMiniButton("-", () => this.changeBet(-1));
        this.roundSetupPlusBtn = this.createMiniButton("+", () => this.changeBet(1));
        this.roundSetupBetText = this.add.text(0, 0, "BET: 1$", {
            fontFamily: "Arial",
            fontSize: "38px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.roundSetupCostText = this.add.text(0, 0, "COST: 250$", {
            fontFamily: "Arial",
            fontSize: "34px",
            color: "#ffe49a",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.roundSetupBalanceText = this.add.text(0, 0, "BALANCE: 1000$", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#d7e4ff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.roundSetupPlayBtn = this.createPopupActionButton("PLAY", () => this.handleRoundSetupPlay(), {
            width: 360
        });
        this.roundSetupErrorText = this.add.text(0, 0, "", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ff9fa7",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.roundSetupPopup.add([
            this.roundSetupGlow,
            this.roundSetupBg,
            this.roundSetupTitle,
            this.roundSetupHint,
            this.roundSetupGrid,
            this.roundSetupMinusBtn,
            this.roundSetupBetText,
            this.roundSetupPlusBtn,
            this.roundSetupCostText,
            this.roundSetupBalanceText,
            this.roundSetupPlayBtn,
            this.roundSetupErrorText
        ]);
    },

    layoutRoundSetupTitle(cx, y) {
        if (!this.roundSetupTitleLetters) return;
        const spacing = 42;
        const totalW = (this.roundSetupTitleLetters.length - 1) * spacing;
        this.roundSetupTitle.setPosition(cx, y);
        this.roundSetupTitleLetters.forEach((letter, index) => {
            letter.x = -totalW * 0.5 + index * spacing;
            if (letter.text === " ") letter.alpha = 0;
        });
    },

    layoutRoundSetupPopup() {
        if (!this.roundSetupPopup) return;
        const cx = this.W * 0.5;
        const cy = this.H * 0.5;
        if (this.roundSetupOverlay) {
            this.roundSetupOverlay.width = this.W;
            this.roundSetupOverlay.height = this.H;
        }
        this.roundSetupGlow.setPosition(cx, cy);
        this.roundSetupBg.setPosition(cx, cy);
        this.layoutRoundSetupTitle(cx, cy - 452);
        this.roundSetupHint.setPosition(cx, cy - 360);
        this.roundSetupGrid.setPosition(cx, cy - 42);

        const startX = -280;
        const startY = -210;
        const colGap = 140;
        const rowGap = 132;
        this.roundSetupCells.forEach((cell, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            cell.setPosition(startX + col * colGap, startY + row * rowGap);
        });

        this.roundSetupMinusBtn.setPosition(cx - 180, cy + 276);
        this.roundSetupBetText.setPosition(cx, cy + 276);
        this.roundSetupPlusBtn.setPosition(cx + 180, cy + 276);
        this.roundSetupCostText.setPosition(cx, cy + 344);
        this.roundSetupBalanceText.setPosition(cx, cy + 388);
        this.roundSetupPlayBtn.setPosition(cx, cy + 496);
        this.roundSetupErrorText.setPosition(cx, cy + 438);
    },

    populateRoundSetupPopup() {
        const eggs = Array.isArray(this.roundEggPreview) ? this.roundEggPreview : [];
        this.roundSetupHiddenState = eggs.map((_, index) => index < 10);

        this.roundSetupCells.forEach((cell, index) => {
            for (const child of cell.list.slice()) {
                if (child !== cell._plate) cell.remove(child, true);
            }

            const egg = eggs[index];
            if (!egg) return;

            if (index < 10) {
                const visual = this.createEggVisual(egg, false).container;
                visual.setScale(1.68);
                cell.add(visual);
                cell._revealed = true;
                return;
            }

            const hiddenEgg = this.createQuestionEggVisual();
            hiddenEgg.setScale(1.58);
            cell.add(hiddenEgg);
            cell._hiddenEgg = hiddenEgg;
            cell._revealed = false;
            cell._eggData = egg;
            cell._plate.setInteractive({ useHandCursor: true })
                .removeAllListeners()
                .on("pointerdown", () => this.revealRoundSetupEgg(index));
        });
    },

    revealRoundSetupEgg(index, immediate = false) {
        const cell = this.roundSetupCells && this.roundSetupCells[index];
        if (!cell || cell._revealed) return;
        cell._revealed = true;
        this.roundSetupHiddenState[index] = true;
        cell._plate.disableInteractive();

        const burst = () => {
            for (let i = 0; i < 6; i++) {
                const puff = this.add.circle(cell.x + this.roundSetupGrid.x, cell.y + this.roundSetupGrid.y, Phaser.Math.Between(10, 18), 0xffffff, 0.32).setDepth(9365);
                this.roundSetupPopup.add(puff);
                this.tweens.add({
                    targets: puff,
                    x: puff.x + Phaser.Math.Between(-26, 26),
                    y: puff.y - Phaser.Math.Between(12, 34),
                    alpha: 0,
                    scaleX: 1.4,
                    scaleY: 1.4,
                    duration: 260,
                    onComplete: () => puff.destroy()
                });
            }
            this.spawnRadialSparkBurst(cell.x + this.roundSetupGrid.x, cell.y + this.roundSetupGrid.y, {
                count: 8,
                color: 0xffef9f,
                colorAlt: 0x7cecff,
                minSpeed: 22,
                maxSpeed: 66,
                depth: 9366
            });
        };

        const finish = () => {
            if (cell._hiddenEgg) {
                cell.remove(cell._hiddenEgg, true);
                cell._hiddenEgg = null;
            }
            const visual = this.createEggVisual(cell._eggData, false).container;
            visual.setScale(1.68);
            visual.alpha = 0;
            visual.scaleX = 1.18;
            visual.scaleY = 1.18;
            cell.add(visual);
            this.tweens.add({
                targets: visual,
                alpha: 1,
                scaleX: 1.68,
                scaleY: 1.68,
                duration: 180,
                ease: "Back.Out"
            });
        };

        if (immediate) {
            finish();
            return;
        }

        burst();
        this.time.delayedCall(120, finish);
    },

    updateRoundSetupPopupLabels() {
        if (!this.roundSetupPopup) return;
        const cost = 250 * (this.bet || 1);
        const canAfford = (this.balance || 0) >= cost;
        this.roundSetupBetText.setText(`BET: ${this.bet}$`);
        this.roundSetupCostText.setText(`COST: ${cost}$`);
        this.roundSetupBalanceText.setText(`BALANCE: ${Math.round(this.balance || 0)}$`);
        this.roundSetupErrorText.setText(canAfford ? "" : "NOT ENOUGH BALANCE");
        this.roundSetupPlayBtn.setAlpha(canAfford ? 1 : 0.55);
    },

    showRoundSetupPopup() {
        if (!this.roundSetupPopup) return;
        this.populateRoundSetupPopup();
        this.layoutRoundSetupPopup();
        this.updateRoundSetupPopupLabels();
        if (this.roundSetupOverlay) this.roundSetupOverlay.setVisible(true);
        this.roundSetupPopup.setVisible(true);
        this.roundSetupPopup.setAlpha(0);
        this.roundSetupPopup.setScale(0.9);
        this.tweens.add({
            targets: this.roundSetupPopup,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 260,
            ease: "Back.Out"
        });
    },

    handleRoundSetupPlay() {
        const cost = 250 * (this.bet || 1);
        if ((this.balance || 0) < cost) {
            this.updateRoundSetupPopupLabels();
            return;
        }

        const hiddenIndexes = this.roundSetupCells
            .map((cell, index) => (!cell._revealed ? index : -1))
            .filter(index => index >= 0);

        if (hiddenIndexes.length === 0) {
            this.balance -= cost;
            if (this.roundSetupOverlay) this.roundSetupOverlay.setVisible(false);
            this.roundSetupPopup.setVisible(false);
            if (typeof this.armRoundGameplayStart === "function") this.armRoundGameplayStart();
            this.updatePillowButtonLabels();
            return;
        }

        const revealNext = (queue) => {
            if (queue.length === 0) {
                this.roundSetupErrorText.setText("GET READY...");
                this.time.delayedCall(2000, () => {
                    this.balance -= cost;
                    if (this.roundSetupOverlay) this.roundSetupOverlay.setVisible(false);
                    this.roundSetupPopup.setVisible(false);
                    if (typeof this.armRoundGameplayStart === "function") this.armRoundGameplayStart();
                    this.updatePillowButtonLabels();
                });
                return;
            }

            const nextIndex = queue.shift();
            this.revealRoundSetupEgg(nextIndex);
            this.time.delayedCall(140, () => revealNext(queue));
        };

        revealNext(hiddenIndexes.slice());
    },

    createRoundEndPopup() {
        this.roundEndPopup = this.add.container(0, 0).setDepth(9300).setVisible(false);
        this.popupLayer.add(this.roundEndPopup);

        this.roundEndPopupGlow = this.add.ellipse(0, 0, 760, 860, 0xffd45c, 0.12);
        this.roundEndPopupBg = this.add.rectangle(0, 0, 760, 860, 0x151f39, 0.96).setStrokeStyle(5, 0xffe395);
        this.roundEndPopupTitle = this.add.container(0, 0);
        this.roundEndPopupTitleLetters = [];
        for (const char of "ROUND COMPLETE") {
            const letter = this.add.text(0, 0, char, {
                fontFamily: "Arial",
                fontSize: "64px",
                color: Phaser.Utils.Array.GetRandom(["#ff6b6b", "#ffb347", "#ffe66d", "#67e8a5", "#62d6ff", "#b98cff"]),
                fontStyle: "bold",
                stroke: "#142035",
                strokeThickness: 8
            }).setOrigin(0.5);
            this.roundEndPopupTitle.add(letter);
            this.roundEndPopupTitleLetters.push(letter);
        }

        this.roundEndPopupSubtitle = this.add.text(0, 0, "YOU WIN:", {
            fontFamily: "Arial",
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.roundEndPopupValue = this.add.text(0, 0, "0$", {
            fontFamily: "Arial",
            fontSize: "154px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#101010",
            strokeThickness: 8
        }).setOrigin(0.5);
        this.roundEndPopupButton = this.createPopupActionButton("PLAY AGAIN", () => this.scene.restart({
            persistedBalance: this.balance,
            persistedTurboIndex: this.turboIndex,
            persistedBetIndex: this.betIndex
        }));

        this.roundEndPopupSparkles = [];
        for (let i = 0; i < 6; i++) {
            const spark = this.add.star(0, 0, 4, 4, 12, Phaser.Utils.Array.GetRandom([0xffef9b, 0x7cecff, 0xff8fc7, 0xb7ff8f]), 0.95);
            this.roundEndPopupSparkles.push(spark);
        }

        this.roundEndPopup.add([
            this.roundEndPopupGlow,
            this.roundEndPopupBg,
            this.roundEndPopupTitle,
            this.roundEndPopupSubtitle,
            this.roundEndPopupValue,
            this.roundEndPopupButton,
            ...this.roundEndPopupSparkles
        ]);

        this.layoutRoundEndTitle(this.W * 0.5, this.H * 0.5 - 222);

        this.roundEndPopupTitleLetters.forEach((letter, index) => {
            this.tweens.add({
                targets: letter,
                y: "+=16",
                duration: 360,
                delay: index * 55,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        });
        this.roundEndPopupSparkles.forEach((spark, index) => {
            this.tweens.add({
                targets: spark,
                scaleX: 1.8,
                scaleY: 1.8,
                alpha: 0.2,
                angle: 45,
                duration: 300 + index * 40,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        });
    },

    layoutRoundEndTitle(cx, y) {
        if (!this.roundEndPopupTitleLetters) return;
        const spacing = 42;
        const totalW = (this.roundEndPopupTitleLetters.length - 1) * spacing;
        this.roundEndPopupTitle.setPosition(cx, y);
        this.roundEndPopupTitleLetters.forEach((letter, index) => {
            letter.x = -totalW * 0.5 + index * spacing;
            if (letter.text === " ") letter.alpha = 0;
        });
    },

    showRoundEndPopup() {
        if (!this.roundEndPopup) return;
        if (!this.roundPayoutApplied) {
            this.balance += this.winTotal || 0;
            this.roundPayoutApplied = true;
            this.updatePillowButtonLabels();
        }
        if (this.popupLayer && this.roundEndPopup) this.popupLayer.bringToTop(this.roundEndPopup);
        this.roundEndPopup.setVisible(true);
        this.roundEndPopup.setAlpha(0);
        this.roundEndPopup.setScale(0.86);
        this.roundEndPopupValue.setText("0$");

        this.tweens.add({
            targets: this.roundEndPopup,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 260,
            ease: "Back.Out"
        });

        const counter = { value: 0 };
        this.tweens.add({
            targets: counter,
            value: this.winTotal || 0,
            duration: 900,
            ease: "Cubic.Out",
            onUpdate: () => {
                this.roundEndPopupValue.setText(this.formatMoneyValue(counter.value));
            }
        });
    },

    toggleManualPause() {
        if (this.roundPopupShown) return;
        if (this.manualPauseActive) {
            this.manualPauseActive = false;
            this.endGameplayPause();
            this.updatePillowButtonLabels();
            return;
        }

        this.manualPauseActive = true;
        this.beginGameplayPause([], false);
        this.updatePillowButtonLabels();
    },

    createEggInfoPopup() {
        this.infoPopup = this.add.container(0, 0).setDepth(9000);
        this.popupLayer.add(this.infoPopup);

        this.infoOverlay = this.add.rectangle(0, 0, this.BASE_W, this.BASE_H, 0x000000, 0.55)
            .setOrigin(0, 0)
            .setInteractive();

        this.infoBg = this.add.rectangle(0, 0, 780, 700, 0x13213b, 0.98)
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
            const iconWrap = this.add.container(0, 0);
            const icon = this.createEggVisual(egg, false).container;
            icon.setScale(1.08);
            iconWrap.add(icon);
            const txt = this.add.text(56, -16, `${egg.label} - ${egg.mult}x`, {
                fontFamily: "Arial",
                fontSize: "30px",
                color: Phaser.Display.Color.IntegerToColor(egg.color).rgba,
                fontStyle: "bold"
            });
            row.add([iconWrap, txt]);
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

        let y = cy - 196;
        for (const row of this.infoRows) {
            row.setPosition(cx - 248, y);
            y += 82;
        }

        if (this.debugOverlay) {
            this.debugOverlayBg.setPosition(cx, cy);
            this.debugOverlayTitle.setPosition(cx, cy - 218);
            this.debugOverlayText.setPosition(cx - 430, cy - 178);
            this.debugOverlayClose.setPosition(cx, cy + 214);
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
