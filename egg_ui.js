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

        this.roundHudLeft = this.add.container(0, 0);
        this.roundHudCenter = this.add.container(0, 0);
        this.roundHudRight = this.add.container(0, 0);

        this.basketPanel = this.add.rectangle(0, 0, 286, 186, 0x12203b, 0.98)
            .setStrokeStyle(4, 0x304a72);
        this.basketCountText = this.add.text(0, -92, "20", {
            fontFamily: "Arial",
            fontSize: "52px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.basketCountLabel = this.add.text(0, -124, "EGGS LEFT", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#9cb6d8",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.basketVisual = this.add.container(0, 10);
        this.basketWire = this.add.graphics();
        this.basketVisual.add(this.basketWire);
        this.basketEggs = [];
        const basketEggPositions = [
            [-48, -26], [-24, -26], [0, -26], [24, -26], [48, -26],
            [-60, -4], [-30, -4], [0, -4], [30, -4], [60, -4],
            [-52, 18], [-26, 18], [0, 18], [26, 18], [52, 18],
            [-42, 40], [-14, 40], [14, 40], [42, 40], [0, 60]
        ];
        for (const [x, y] of basketEggPositions) {
            const egg = this.add.ellipse(x, y, 18, 24, 0xf1f3f7, 1).setStrokeStyle(2, 0xffffff, 0.9);
            this.basketVisual.add(egg);
            this.basketEggs.push(egg);
        }
        this.roundHudLeft.add([this.basketPanel, this.basketCountLabel, this.basketCountText, this.basketVisual]);

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
        this.roundHudCenter.add([this.winPanel, this.winLabel, this.winAmountText]);

        this.balanceBg = this.add.rectangle(0, -44, 220, 68, 0x12203b, 0.98)
            .setStrokeStyle(4, 0x304a72);
        this.balanceText = this.add.text(0, -44, "$1000", {
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

        this.betBg = this.add.rectangle(0, 44, 220, 68, 0x12203b, 0.98)
            .setStrokeStyle(4, 0x304a72);
        this.betText = this.add.text(0, 44, "BET: 1$", {
            fontFamily: "Arial",
            fontSize: "38px",
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

        infoEgg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.toggleEggInfo(true));

        this.turboCircle.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                this.turboIndex = (this.turboIndex + 1) % 3;
                this.updateTurboVisual();
            });

        this.roundHudRight.add([
            this.balanceBg, this.balanceText,
            this.turboBtn,
            this.betBg, this.betText,
            this.infoBtn
        ]);
        this.bottomUI.add([this.roundHudLeft, this.roundHudCenter, this.roundHudRight]);

        this.updateTurboVisual();
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
        const y = this.H - 198;
        const scale = Phaser.Math.Clamp(this.W / 1080, 0.82, 1.06);
        this.bottomUI.setScale(scale);
        this.bottomUI.setPosition(this.W * 0.5, y);

        this.roundHudLeft.setPosition(-302, 0);
        this.roundHudCenter.setPosition(0, 0);
        this.roundHudRight.setPosition(286, 0);

        this.turboBtn.setPosition(0, -46);
        this.infoBtn.setPosition(76, -46);

        if (this.roundEndPopup) {
            const cx = this.W * 0.5;
            const cy = this.H * 0.5;
            this.roundEndPopupBg.setPosition(cx, cy);
            this.roundEndPopupGlow.setPosition(cx, cy);
            this.roundEndPopupSubtitle.setPosition(cx, cy - 34);
            this.roundEndPopupValue.setPosition(cx, cy + 56);
            this.roundEndPopupButton.setPosition(cx, cy + 198);
            this.roundEndPopupSparkles.forEach((spark, index) => {
                const positions = [
                    [-310, -220], [300, -210], [-330, 26], [330, 52], [-242, 226], [260, 216]
                ];
                const [sx, sy] = positions[index] || [0, 0];
                spark.setPosition(cx + sx, cy + sy);
            });
            this.layoutRoundEndTitle(cx, cy - 152);
        }

        this.redrawBasketWire();
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
        this.balanceText.setText(`$${Math.round(this.balance)}`);
        this.betText.setText(`BET: ${this.bet}$`);
        if (this.winAmountText) this.winAmountText.setText(this.formatMoneyValue(this.winTotal || 0));
        if (this.basketCountText) this.basketCountText.setText(`${Math.max(0, this.remainingEggCount || 0)}`);
        this.updateEggBasketVisual();
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

    changeBet() {},

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

    redrawBasketWire() {
        if (!this.basketWire) return;
        this.basketWire.clear();
        this.basketWire.lineStyle(4, 0xdce7f4, 0.95);
        this.basketWire.strokeRoundedRect(-74, -42, 148, 112, 18);
        this.basketWire.beginPath();
        this.basketWire.moveTo(-88, -54);
        this.basketWire.lineTo(-56, -72);
        this.basketWire.lineTo(56, -72);
        this.basketWire.lineTo(88, -54);
        this.basketWire.strokePath();
        for (let i = -48; i <= 48; i += 24) {
            this.basketWire.beginPath();
            this.basketWire.moveTo(i, -40);
            this.basketWire.lineTo(i, 68);
            this.basketWire.strokePath();
        }
        for (let y = -16; y <= 48; y += 22) {
            this.basketWire.beginPath();
            this.basketWire.moveTo(-72, y);
            this.basketWire.lineTo(72, y);
            this.basketWire.strokePath();
        }
    },

    updateEggBasketVisual() {
        if (!Array.isArray(this.basketEggs)) return;
        const left = Math.max(0, Math.min(this.basketEggs.length, this.remainingEggCount || 0));
        for (let i = 0; i < this.basketEggs.length; i++) {
            this.basketEggs[i].setVisible(i < left);
        }
    },

    createPopupActionButton(label, onClick) {
        const btn = this.add.container(0, 0);
        const shadow = this.add.ellipse(0, 48, 260, 30, 0x09111f, 0.28);
        const socket = this.add.rectangle(0, 20, 320, 100, 0x1f662f, 0.98).setStrokeStyle(4, 0x9ff0ae);
        const face = this.add.container(0, -8);
        const body = this.add.rectangle(0, 0, 324, 88, 0x46c466, 1).setStrokeStyle(4, 0xffffff);
        const gloss = this.add.rectangle(0, -16, 212, 18, 0xffffff, 0.14);
        const txt = this.add.text(0, 0, label, {
            fontFamily: "Arial",
            fontSize: "38px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#163021",
            strokeThickness: 4
        }).setOrigin(0.5);

        face.add([body, gloss, txt]);
        btn.add([shadow, socket, face]);

        const setPressed = pressed => {
            face.y = pressed ? 6 : -8;
            shadow.alpha = pressed ? 0.1 : 0.28;
            body.setFillStyle(pressed ? 0x5bd67a : 0x46c466, 1);
        };

        body.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => setPressed(true))
            .on("pointerup", () => {
                setPressed(false);
                onClick();
            })
            .on("pointerout", () => setPressed(false));

        this.tweens.add({
            targets: btn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 760,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1
        });

        return btn;
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
            fontSize: "118px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#101010",
            strokeThickness: 8
        }).setOrigin(0.5);
        this.roundEndPopupButton = this.createPopupActionButton("PLAY AGAIN", () => this.scene.restart());

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

        this.layoutRoundEndTitle(this.W * 0.5, this.H * 0.5 - 152);

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
