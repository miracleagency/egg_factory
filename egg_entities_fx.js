window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.entitiesFx = {
    formatMoneyValue(value) {
        const safeValue = Math.max(0, value || 0);
        const roundedTenth = Math.round(safeValue * 10) / 10;
        if (Math.abs(roundedTenth - Math.round(roundedTenth)) < 0.001) {
            return `${Math.round(roundedTenth)}$`;
        }
        return `${roundedTenth.toFixed(1)}$`;
    },

    createMachineBlock(def) {
        const container = this.add.container(0, 0).setDepth(200);
        let fill = 0x8694a8;
        let stroke = 0xc0cfde;

        if (def.type === "water") {
            fill = 0x59b7ff;
            stroke = 0x9fd7ff;
        } else if (def.type === "crush") {
            fill = 0x8a7363;
            stroke = 0xd0b8a2;
        } else if (def.type === "fire") {
            fill = 0xd3412c;
            stroke = 0xff9f8f;
        } else if (def.rarity === "gold") {
            fill = 0xe1c83b;
            stroke = 0xffef8e;
        }

        const body = this.add.rectangle(0, 0, 126, 72, fill, 1).setStrokeStyle(4, stroke);
        const lip = this.add.rectangle(0, 44, 84, 12, 0x3a4554, 1).setStrokeStyle(2, 0x7c8998);
        const label = this.add.text(0, -2, def.label, {
            fontFamily: "Arial",
            fontSize: "36px",
            color: def.rarity === "gold" ? "#4a2a00" : "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        const timerText = this.add.text(0, -2, "", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#ffe9a3",
            fontStyle: "bold"
        }).setOrigin(0.5).setVisible(false);
        const hammer = this.add.container(0, -42).setVisible(false);
        const hammerHandle = this.add.rectangle(-6, -6, 8, 32, 0x8f6748, 1).setStrokeStyle(2, 0xe2c6aa);
        const hammerHead = this.add.rectangle(8, -18, 24, 12, 0xc8d0db, 1).setStrokeStyle(2, 0xffffff);
        hammer.add([hammerHandle, hammerHead]);

        container.add([body, lip, label, timerText, hammer]);
        container.setScale(1.12);
        this.machineLayer.add(container);

        def.container = container;
        def.labelText = label;
        def.timerText = timerText;
        def.hammer = hammer;
        def.baseLabel = def.label;
        def.nextShot = 0;
        def.shotDesync = Phaser.Math.FloatBetween(0.04, 0.22);
        def.fireChaosJitter = def.rapid ? Phaser.Math.FloatBetween(0.62, 0.96) : Phaser.Math.FloatBetween(0.8, 1.28);
        def.fireSkipChance = def.rapid ? Phaser.Math.FloatBetween(0.04, 0.12) : Phaser.Math.FloatBetween(0.16, 0.30);

        return def;
    },

    createEggDropper() {
        const c = this.add.container(0, 0).setDepth(220);
        const body = this.add.rectangle(0, 0, 126, 72, 0x7288a4, 1).setStrokeStyle(4, 0x7ec0ff);
        const lip = this.add.rectangle(0, 44, 84, 12, 0x3a4554, 1).setStrokeStyle(2, 0x7c8998);
        const label = this.add.text(0, -2, "EGGS", {
            fontFamily: "Arial",
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        c.add([body, lip, label]);
        c.setScale(1.12);
        this.machineLayer.add(c);
        return c;
    },

    createTravelPillow(color, cost, pillowMult, betAtPlacement) {
        const container = this.add.container(0, 0);
        const shadow = this.add.ellipse(0, 16, 112, 18, 0x000000, 0.28);
        const body = this.add.rectangle(0, 0, 108, 40, color, 1).setStrokeStyle(4, 0xffffff);
        const gloss = this.add.rectangle(0, -8, 72, 14, 0xffffff, 0.12);
        const valueText = this.createPillowValueText(`${cost}$`);

        container.add([shadow, body, gloss, valueText]);

        return {
            container,
            body,
            valueText,
            baseColor: color,
            eggs: [],
            eggMultSum: 0,
            pillowMult,
            betAtPlacement,
            spentCost: cost,
            currentValue: 0,
            wet: false,
            destroyed: false,
            finished: false,
            settled: false,
            permanentTextColor: null
        };
    },

    spawnRadialSparkBurst(x, y, config = {}) {
        const count = config.count || 10;
        const color = config.color || 0xffffff;
        const colorAlt = config.colorAlt || color;
        const depth = config.depth || 5100;
        const minSpeed = config.minSpeed || 70;
        const maxSpeed = config.maxSpeed || 190;

        for (let i = 0; i < count; i++) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.FloatBetween(minSpeed, maxSpeed);
            const spark = Math.random() < 0.5
                ? this.add.star(x, y, 4, 1.6, 5.6, i % 2 === 0 ? color : colorAlt, 0.98).setDepth(depth)
                : this.add.rectangle(x, y, 5, Phaser.Math.Between(10, 22), i % 2 === 0 ? color : colorAlt, 0.95).setDepth(depth);

            spark.angle = Phaser.Math.RadToDeg(angle) + 90;
            this.fxLayer.add(spark);

            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0.45,
                scaleY: 0.45,
                duration: Phaser.Math.Between(320, 520),
                ease: "Cubic.Out",
                onComplete: () => spark.destroy()
            });
        }
    },

    createPillowValueText(textValue) {
        return this.add.text(0, 34, textValue, {
            fontFamily: "Arial",
            fontSize: "54px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#101010",
            strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);
    },

    rebuildPillowValueText(item, textValue) {
        if (!item || !item.container || item.destroyed || item.finished) return null;

        const oldText = item.valueText;
        const alpha = oldText && typeof oldText.alpha === "number" ? oldText.alpha : 0;
        const scaleX = oldText && typeof oldText.scaleX === "number" ? oldText.scaleX : 1;
        const scaleY = oldText && typeof oldText.scaleY === "number" ? oldText.scaleY : 1;

        if (oldText) {
            if (this.tweens && typeof this.tweens.killTweensOf === "function") {
                this.tweens.killTweensOf(oldText);
            }
            if (item.container.list && item.container.list.includes(oldText)) {
                item.container.remove(oldText);
            }
            if (oldText.scene && oldText.destroy) oldText.destroy();
        }

        const textObj = this.createPillowValueText(textValue);
        textObj.setAlpha(alpha);
        textObj.setScale(scaleX, scaleY);
        item.valueText = textObj;
        item.container.addAt(textObj, Math.min(3, item.container.length));
        return textObj;
    },

    rebuildTransientPillowValueText(item, textValue) {
        if (!item || !item.container || item.destroyed || item.finished) return null;

        const oldText = item.pauseValueText;
        const alpha = oldText && typeof oldText.alpha === "number" ? oldText.alpha : 0;
        const scaleX = oldText && typeof oldText.scaleX === "number" ? oldText.scaleX : 1;
        const scaleY = oldText && typeof oldText.scaleY === "number" ? oldText.scaleY : 1;

        if (oldText) {
            if (this.tweens && typeof this.tweens.killTweensOf === "function") {
                this.tweens.killTweensOf(oldText);
            }
            if (item.container.list && item.container.list.includes(oldText)) {
                item.container.remove(oldText);
            }
            if (oldText.scene && oldText.destroy) oldText.destroy();
        }

        const textObj = this.createPillowValueText(textValue);
        textObj.setAlpha(alpha);
        textObj.setScale(scaleX, scaleY);
        item.pauseValueText = textObj;
        item.container.add(textObj);
        return textObj;
    },

    clearTransientPillowValueText(item) {
        if (!item || !item.pauseValueText) return;
        if (this.tweens && typeof this.tweens.killTweensOf === "function") {
            this.tweens.killTweensOf(item.pauseValueText);
        }
        if (item.container && item.container.list && item.container.list.includes(item.pauseValueText)) {
            item.container.remove(item.pauseValueText);
        }
        if (item.pauseValueText.scene && item.pauseValueText.destroy) {
            item.pauseValueText.destroy();
        }
        item.pauseValueText = null;
    },

    createEggVisual(eggType, withShadow = false, options = {}) {
        const container = this.add.container(0, 0);
        const eggScale = 1.35;
        const disableAmbientFx = !!options.disableAmbientFx;

        if (withShadow) {
            const shadow = this.add.ellipse(0, 24, 28, 10, 0x000000, 0.15);
            container.add(shadow);
        }

        if (eggType.armored) {
            const shell = this.add.ellipse(0, 0, 34, 46, 0x8d969f, 1).setStrokeStyle(3, 0xdfe6ef);
            const band = this.add.rectangle(0, 0, 26, 34, 0x69727d, 0.95).setStrokeStyle(2, 0xc8d0db);
            const rivets = [
                this.add.circle(-11, -11, 2.8, 0xe4eaf1, 1),
                this.add.circle(11, -11, 2.8, 0xe4eaf1, 1),
                this.add.circle(-11, 11, 2.8, 0xe4eaf1, 1),
                this.add.circle(11, 11, 2.8, 0xe4eaf1, 1)
            ];
            const shine = this.add.ellipse(-7, -12, 7, 12, 0xffffff, 0.22);
            container.add([shell, band, ...rivets, shine]);
            container.setScale(eggScale);
            return { container, body: shell };
        }

        const body = this.add.ellipse(0, 0, 32, 44, eggType.color, 1).setStrokeStyle(2, eggType.stroke);
        const shine = this.add.ellipse(-6, -9, 7, 12, 0xffffff, 0.35);
        container.add([body, shine]);

        if (eggType.bomb) {
            const ember = this.add.circle(11, -14, 6.2, 0xffdd57, 0.98);
            const emberGlow = this.add.circle(11, -14, 14, 0xff5c2f, 0.26);
            const flame = this.add.ellipse(12, -19, 14, 24, 0xff8b2d, 0.92).setStrokeStyle(2, 0xfff1b0, 0.8);
            const spark = this.add.star(15, -21, 5, 2.4, 6.8, 0xfff4bd, 0.98);
            container.add([emberGlow, flame, spark, ember]);
            container._bombEmber = ember;
            container._bombEmberGlow = emberGlow;
            container._bombFlame = flame;
            container._bombSpark = spark;

            if (!disableAmbientFx) {
                this.tweens.add({
                    targets: [ember, spark],
                    scaleX: 1.55,
                    scaleY: 1.55,
                    alpha: 0.35,
                    duration: 130,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });
                this.tweens.add({
                    targets: flame,
                    y: -23,
                    scaleX: 0.76,
                    scaleY: 1.3,
                    alpha: 0.6,
                    duration: 110,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });
                this.tweens.add({
                    targets: emberGlow,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0.12,
                    duration: 180,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });
            }
        }

        if (eggType.glow) {
            const glow = this.add.ellipse(0, 0, 46, 60, eggType.glow, 0.24);
            container.addAt(glow, withShadow ? 1 : 0);
        }

        if (eggType.mysteryFx) {
            body.setFillStyle(0x572783, 1).setStrokeStyle(2, 0xf3dcff, 1);
            const gradBase = this.add.ellipse(0, 0, 29, 41, 0x6d32a1, 0.98);
            const gradTop = this.add.ellipse(0, -12, 25, 15, 0xff8e52, 0.82);
            const gradMid = this.add.ellipse(0, -2, 27, 17, 0x64d86a, 0.74);
            const gradLow = this.add.ellipse(0, 10, 26, 14, 0xffd55c, 0.68);
            const bodyShade = this.add.ellipse(4, 7, 26, 34, 0x2a1238, 0.22);
            const topGlow = this.add.ellipse(0, -11, 20, 13, 0xffffff, 0.18);
            const shineCore = this.add.ellipse(-8, -12, 8, 15, 0xffffff, 0.48);
            const shineEdge = this.add.ellipse(-3, -2, 5, 10, 0xfff2ff, 0.22);
            const sigil = this.add.star(1, 3, 6, 3.1, 6.5, 0x7f5cff, 0.96).setStrokeStyle(2, 0xffffff, 0.82);
            const sigilGlow = this.add.star(1, 3, 6, 4.2, 8.8, 0xff8c42, 0.2);
            const flashA = this.add.star(-16, -15, 4, 1.8, 4.9, 0x7cecff, 1);
            const flashB = this.add.star(16, -4, 4, 1.8, 4.6, 0xff86d2, 0.98);
            const flashC = this.add.star(-3, 17, 4, 1.5, 4.2, 0xffef89, 0.95);
            const flashD = this.add.star(10, -19, 4, 1.4, 3.9, 0xc7ff77, 0.96);
            const auraOuter = this.add.ellipse(0, 0, 58, 72, 0x8a44ff, 0.12);
            const auraInner = this.add.ellipse(0, 0, 48, 62, 0xffa04c, 0.10);
            container.addAt(auraOuter, withShadow ? 1 : 0);
            container.addAt(auraInner, withShadow ? 2 : 1);
            container.add([gradBase, gradTop, gradMid, gradLow, bodyShade, topGlow, shineCore, shineEdge, sigilGlow, sigil, flashA, flashB, flashC, flashD]);

            if (!disableAmbientFx) {
                this.tweens.add({
                    targets: [auraOuter, auraInner],
                    alpha: 0.24,
                    scaleX: 1.18,
                    scaleY: 1.14,
                    duration: 360,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });
                this.tweens.add({
                    targets: [gradTop, gradMid, gradLow],
                    y: "-=1.5",
                    alpha: 0.5,
                    duration: 440,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });
                this.tweens.add({
                    targets: [sigil, sigilGlow],
                    angle: 24,
                    scaleX: 1.18,
                    scaleY: 1.18,
                    alpha: 0.74,
                    duration: 300,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });
                this.tweens.add({
                    targets: [shineCore, shineEdge, topGlow],
                    alpha: 0.16,
                    duration: 240,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });

                for (const flash of [flashA, flashB, flashC, flashD]) {
                    flash._baseAlpha = flash.alpha;
                    this.tweens.add({
                        targets: flash,
                        alpha: flash._baseAlpha * 0.15,
                        scaleX: 3.2,
                        scaleY: 3.2,
                        angle: Phaser.Math.Between(-24, 24),
                        duration: 140 + Phaser.Math.Between(0, 140),
                        ease: "Sine.InOut",
                        yoyo: true,
                        repeat: -1,
                        delay: Phaser.Math.Between(0, 240)
                    });
                }
            }
        }

        if (eggType.goldFx) {
            const aura = this.add.ellipse(0, 0, 48, 62, 0xffdb58, 0.12);
            const sparkA = this.add.circle(-14, -13, 2.8, 0xfff29b, 1);
            const sparkB = this.add.circle(14, 5, 2.4, 0xffd54b, 0.95);
            const sparkC = this.add.circle(-3, 16, 2.1, 0xfff6bc, 0.92);
            const sparkD = this.add.circle(3, -18, 1.9, 0xfff0a0, 0.88);
            container.addAt(aura, withShadow ? 1 : 0);
            container.add([sparkA, sparkB, sparkC, sparkD]);

            if (!disableAmbientFx) {
                this.tweens.add({
                    targets: aura,
                    alpha: 0.26,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 420,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });

                for (const spark of [sparkA, sparkB, sparkC, sparkD]) {
                    spark._baseAlpha = spark.alpha;
                    this.tweens.add({
                        targets: spark,
                        alpha: spark._baseAlpha * 0.22,
                        scaleX: 2.4,
                        scaleY: 2.4,
                        duration: 220 + Phaser.Math.Between(0, 180),
                        ease: "Sine.InOut",
                        yoyo: true,
                        repeat: -1,
                        delay: Phaser.Math.Between(0, 220)
                    });
                }
            }
        }

        if (eggType.diamondFx) {
            const aura = this.add.ellipse(0, 0, 52, 68, 0x75e6ff, 0.12);
            const sparkA = this.add.circle(-14, -10, 2.6, 0xaeeeff, 1);
            const sparkB = this.add.circle(13, 7, 2.4, 0x7ad9ff, 0.92);
            const sparkC = this.add.circle(2, -18, 2.2, 0xeaffff, 0.86);
            container.addAt(aura, withShadow ? 1 : 0);
            container.add([sparkA, sparkB, sparkC]);

            if (!disableAmbientFx) {
                this.tweens.add({
                    targets: aura,
                    alpha: 0.24,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 460,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1
                });

                for (const spark of [sparkA, sparkB, sparkC]) {
                    spark._baseAlpha = spark.alpha;
                    this.tweens.add({
                        targets: spark,
                        alpha: spark._baseAlpha * 0.18,
                        scaleX: 2.6,
                        scaleY: 2.6,
                        duration: 260 + Phaser.Math.Between(0, 220),
                        ease: "Sine.InOut",
                        yoyo: true,
                        repeat: -1,
                        delay: Phaser.Math.Between(0, 260)
                    });
                }
            }
        }

        container.setScale(eggScale);
        return { container, body };
    },

    setBombVisualState(eggContainer, lit) {
        if (!eggContainer || !eggContainer._bombEmber || !eggContainer._bombEmberGlow) return;
        eggContainer._bombEmber.setVisible(lit);
        eggContainer._bombEmberGlow.setVisible(lit);
        if (eggContainer._bombFlame) eggContainer._bombFlame.setVisible(lit);
        if (eggContainer._bombSpark) eggContainer._bombSpark.setVisible(lit);
        if (lit) {
            eggContainer._bombEmber.setAlpha(0.95);
            eggContainer._bombEmberGlow.setAlpha(0.22);
            if (eggContainer._bombFlame) eggContainer._bombFlame.setAlpha(0.9);
            if (eggContainer._bombSpark) eggContainer._bombSpark.setAlpha(0.95);
        }
    },

    setMachineBrokenVisual(def, broken, secondsLeft = 0) {
        if (!def || !def.labelText || !def.timerText || !def.hammer) return;
        def.labelText.setVisible(!broken);
        def.timerText.setVisible(broken);
        def.timerText.setText(broken ? `${secondsLeft.toFixed(1)}s` : "");
        def.hammer.setVisible(broken);
        def.container.setAlpha(broken ? 0.82 : 1);
    },

    spawnMachineRepairSparks(def) {
        if (!def || !def.container) return;
        const x = def.container.x;
        const y = def.container.y - 8;

        for (let i = 0; i < 5; i++) {
            const spark = this.add.rectangle(x, y, 4, 16, 0xffc44a, 0.95).setDepth(5100);
            spark.angle = Phaser.Math.Between(-60, 60);
            this.fxLayer.add(spark);
            this.tweens.add({
                targets: spark,
                x: x + Phaser.Math.Between(-26, 26),
                y: y + Phaser.Math.Between(-12, 18),
                alpha: 0,
                scaleY: 0.3,
                duration: 180,
                onComplete: () => spark.destroy()
            });
        }
    },

    spawnBombExplosionFx(x, y) {
        const flash = this.add.circle(x, y, 28, 0xfff0c2, 0.55).setDepth(5120);
        const core = this.add.circle(x, y, 24, 0xff7a2d, 0.72).setDepth(5121);
        const ring = this.add.ellipse(x, y, 74, 52, 0xffb05a, 0.28).setDepth(5119);
        this.fxLayer.add([ring, flash, core]);

        this.tweens.add({
            targets: ring,
            scaleX: 2.2,
            scaleY: 2,
            alpha: 0,
            duration: 260,
            onComplete: () => ring.destroy()
        });
        this.tweens.add({
            targets: flash,
            scaleX: 4.2,
            scaleY: 4.2,
            alpha: 0,
            duration: 240,
            onComplete: () => flash.destroy()
        });
        this.tweens.add({
            targets: core,
            scaleX: 2.8,
            scaleY: 2.8,
            alpha: 0,
            duration: 260,
            onComplete: () => core.destroy()
        });

        for (let i = 0; i < 18; i++) {
            const ember = this.add.circle(x, y, Phaser.Math.Between(3, 7), 0xff9d3d, 0.95).setDepth(5122);
            this.fxLayer.add(ember);
            this.tweens.add({
                targets: ember,
                x: x + Phaser.Math.Between(-90, 90),
                y: y + Phaser.Math.Between(-70, 70),
                alpha: 0,
                scaleX: 0.4,
                scaleY: 0.4,
                duration: 320 + Phaser.Math.Between(0, 140),
                onComplete: () => ember.destroy()
            });
        }

        for (let i = 0; i < 10; i++) {
            const shard = this.add.rectangle(x, y, Phaser.Math.Between(4, 10), Phaser.Math.Between(10, 22), 0xffe1b6, 0.9).setDepth(5123);
            shard.angle = Phaser.Math.Between(0, 180);
            this.fxLayer.add(shard);
            this.tweens.add({
                targets: shard,
                x: x + Phaser.Math.Between(-110, 110),
                y: y + Phaser.Math.Between(-90, 90),
                alpha: 0,
                angle: shard.angle + Phaser.Math.Between(-160, 160),
                duration: 340 + Phaser.Math.Between(0, 120),
                onComplete: () => shard.destroy()
            });
        }
    },

    spawnCrushFx(x, y) {
        const shock = this.add.ellipse(x, y + 8, 88, 26, 0xe4c8aa, 0.28).setDepth(5100);
        const dust = [];

        this.fxLayer.add(shock);
        this.tweens.add({
            targets: shock,
            scaleX: 1.55,
            scaleY: 1.35,
            alpha: 0,
            duration: 180,
            onComplete: () => shock.destroy()
        });

        for (let i = 0; i < 10; i++) {
            const chunk = this.add.rectangle(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-10, 8),
                Phaser.Math.Between(5, 10),
                Phaser.Math.Between(5, 10),
                0xb5a18f,
                0.95
            ).setDepth(5101);
            chunk.angle = Phaser.Math.Between(0, 180);
            this.fxLayer.add(chunk);
            dust.push(chunk);
            this.tweens.add({
                targets: chunk,
                x: chunk.x + Phaser.Math.Between(-44, 44),
                y: chunk.y + Phaser.Math.Between(-22, 14),
                alpha: 0,
                angle: chunk.angle + Phaser.Math.Between(-80, 80),
                duration: 240 + Phaser.Math.Between(0, 90),
                onComplete: () => chunk.destroy()
            });
        }

        const flash = this.add.rectangle(x, y - 4, 54, 20, 0xfff0d9, 0.45).setDepth(5102);
        this.fxLayer.add(flash);
        this.tweens.add({
            targets: flash,
            scaleX: 1.8,
            scaleY: 0.55,
            alpha: 0,
            duration: 140,
            onComplete: () => flash.destroy()
        });
    },

    spawnMysteryBonusText(text, color = "#fff1b0", accent = 0xffd46b) {
        const x = this.W * 0.5;
        const y = this.safe.top + 120;
        const wrap = this.add.container(x, y).setDepth(9200);
        const glow = this.add.ellipse(0, 0, 520, 96, accent, 0.14);
        const plate = this.add.rectangle(0, 0, 438, 74, 0x241931, 0.94).setStrokeStyle(4, accent, 0.92);
        const label = this.add.text(0, 0, text, {
            fontFamily: "Arial",
            fontSize: "34px",
            color,
            fontStyle: "bold",
            stroke: "#0d0916",
            strokeThickness: 6
        }).setOrigin(0.5);

        wrap.add([glow, plate, label]);
        this.popupLayer.add(wrap);

        this.tweens.add({
            targets: [glow, plate],
            scaleX: 1.05,
            scaleY: 1.08,
            duration: 180,
            ease: "Back.Out"
        });
        this.tweens.add({
            targets: wrap,
            y: y - 18,
            duration: 180,
            ease: "Quad.Out"
        });
        this.tweens.add({
            targets: wrap,
            alpha: 0,
            y: y - 54,
            delay: 980,
            duration: 320,
            ease: "Quad.In",
            onComplete: () => wrap.destroy()
        });
    },

    applySafeValueTextColor(textObj, cssColor, preferTint = false) {
        if (!textObj || !textObj.scene || textObj.destroyed) return;
        const safeColor = cssColor || "#ffffff";
        let tint = 0xffffff;

        try {
            tint = Phaser.Display.Color.HexStringToColor(safeColor).color;
        } catch (_) {}

        try {
            textObj.setTint(tint);
        } catch (error) {
            if (typeof window.__eggPushDomDebug === "function") {
                window.__eggPushDomDebug(`VALUE_TEXT_COLOR_FAIL ${safeColor} preferTint=${preferTint ? 1 : 0} ${error && error.message ? error.message : error}`);
            }
        }
    },

    updatePillowValueText(item, color = "#ffffff") {
        if (!item || !item.container || item.destroyed || item.finished) return;
        if (this.gameplayPaused) {
            const displayValue = item.eggMultSum > 0 ? item.currentValue : item.spentCost;
            item._queuedValueTextColor = item.permanentTextColor || color || "#ffffff";
            this.pendingValueTextRefresh = this.pendingValueTextRefresh || new Set();
            this.pendingValueTextRefresh.add(item);
            const tempText = this.rebuildTransientPillowValueText(item, this.formatMoneyValue(displayValue));
            if (tempText) {
                this.applySafeValueTextColor(tempText, item._queuedValueTextColor, false);
                tempText.setAlpha(item.eggMultSum > 0 ? 1 : 0);
            }
            if (item.valueText && item.valueText.scene && !item.valueText.destroyed) {
                item.valueText.setAlpha(0);
            }
            return;
        }
        this.clearTransientPillowValueText(item);
        if (!item.valueText || !item.valueText.scene || item.valueText.destroyed) {
            item.valueText = this.rebuildPillowValueText(item, this.formatMoneyValue(item.currentValue || item.spentCost || 0));
        }
        if (item.eggMultSum <= 0) {
            if (item.valueText) item.valueText.setAlpha(0);
            return;
        }
        const displayValue = item.eggMultSum > 0 ? item.currentValue : item.spentCost;
        const textObj = this.rebuildPillowValueText(item, this.formatMoneyValue(displayValue));
        if (!textObj) return;
        this.applySafeValueTextColor(textObj, item._queuedValueTextColor || item.permanentTextColor || color || "#ffffff", false);
        item._queuedValueTextColor = null;
        textObj.setAlpha(item.eggMultSum > 0 ? 1 : 0);
    },

    flashValueText(item, flashColor) {
        if (!item || !item.valueText || item.eggMultSum <= 0) return;
        if (this.gameplayPaused) return;
        const baseColor = item.permanentTextColor || "#ffffff";
        const preferTint = false;
        this.tweens.killTweensOf(item.valueText);
        item.valueText.setAlpha(1);
        this.applySafeValueTextColor(item.valueText, flashColor, preferTint);
        this.tweens.add({
            targets: item.valueText,
            alpha: 0.3,
            duration: 140,
            ease: "Sine.InOut",
            yoyo: true,
            onYoyo: () => this.applySafeValueTextColor(item.valueText, baseColor, preferTint),
            onComplete: () => {
                this.applySafeValueTextColor(item.valueText, baseColor, preferTint);
                item.valueText.setAlpha(item.eggMultSum > 0 ? 1 : 0);
            }
        });
    },

    pulseItem(item) {
        item.container.setScale(1.08);
        this.tweens.add({
            targets: item.container,
            scaleX: 1,
            scaleY: 1,
            duration: 100
        });
    },

    ensureWetFx(item) {
        if (item.wetFx && item.wetFx.length) return;
        item.wetFx = [];

        const points = [
            { x: -24, y: -34, r: 6 },
            { x: -10, y: -39, r: 5 },
            { x: 10, y: -38, r: 5 },
            { x: 24, y: -34, r: 6 },
            { x: 0, y: -43, r: 5 }
        ];

        for (const p of points) {
            const d = this.add.circle(p.x, p.y, p.r, 0x66c9ff, 0.95);
            item.container.add(d);
            this.tweens.add({
                targets: d,
                y: p.y - 5,
                x: p.x + Phaser.Math.Between(-3, 3),
                alpha: 0.62,
                scaleX: 0.78,
                scaleY: 1.22,
                yoyo: true,
                repeat: -1,
                duration: 360 + Phaser.Math.Between(0, 170)
            });
            item.wetFx.push(d);
        }
    },

    clearWetFx(item) {
        if (!item.wetFx || item.wetFx.length === 0) return;
        for (const d of item.wetFx) {
            this.tweens.killTweensOf(d);
            d.destroy();
        }
        item.wetFx = [];
    },

    spawnWaterEggSplash(item) {
        const ox = item.container.x;
        const oy = item.container.y - 28;

        for (let i = 0; i < 3; i++) {
            const spray = this.add.rectangle(ox + (i - 1) * 10, oy - 38, 6, 54, 0x8de6ff, 0.48).setDepth(5098);
            spray.angle = Phaser.Math.Between(-10, 10);
            this.fxLayer.add(spray);
            this.tweens.add({
                targets: spray,
                y: oy - 8,
                alpha: 0,
                scaleY: 0.45,
                duration: 200 + i * 35,
                ease: "Quad.Out",
                onComplete: () => spray.destroy()
            });
        }

        for (let i = 0; i < 14; i++) {
            const drop = this.add.circle(ox, oy, Phaser.Math.Between(3, 6), 0x57c3ff, 1).setDepth(5100);
            this.fxLayer.add(drop);
            this.tweens.add({
                targets: drop,
                x: ox + Phaser.Math.Between(-56, 56),
                y: oy + Phaser.Math.Between(-24, 34),
                alpha: 0,
                duration: Phaser.Math.Between(260, 420),
                onComplete: () => drop.destroy()
            });
        }

        for (let i = 0; i < 4; i++) {
            const streak = this.add.rectangle(ox, oy, 4, 22, 0x8ddcff, 0.8).setDepth(5099);
            streak.angle = Phaser.Math.Between(-35, 35);
            this.fxLayer.add(streak);
            this.tweens.add({
                targets: streak,
                x: ox + Phaser.Math.Between(-42, 42),
                y: oy + Phaser.Math.Between(-12, 30),
                alpha: 0,
                scaleY: 0.3,
                duration: 260,
                onComplete: () => streak.destroy()
            });
        }
    },

    spawnDryFx(item) {
        const ox = item.container.x;
        const oy = item.container.y - 30;

        for (let i = 0; i < 9; i++) {
            const steam = this.add.circle(
                ox + Phaser.Math.Between(-14, 14),
                oy + Phaser.Math.Between(-4, 4),
                Phaser.Math.Between(5, 10),
                0xffffff,
                0.55
            ).setDepth(5100);
            this.fxLayer.add(steam);
            this.tweens.add({
                targets: steam,
                x: steam.x + Phaser.Math.Between(-24, 24),
                y: steam.y - Phaser.Math.Between(14, 26),
                alpha: 0,
                scaleX: 1.35,
                scaleY: 1.35,
                duration: 320,
                onComplete: () => steam.destroy()
            });
        }
    },

    spawnImpactFx(x, y, color) {
        const flash = this.add.circle(x, y, 18, color, 0.28).setDepth(5100);
        this.fxLayer.add(flash);
        this.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 140,
            onComplete: () => flash.destroy()
        });
    },

    spawnMachineImpactFx(def, x, y) {
        if (def && def.type === "water") {
            const mist = this.add.ellipse(x, y, 70, 34, 0xa7ecff, 0.38).setDepth(5099);
            this.fxLayer.add(mist);
            this.tweens.add({
                targets: mist,
                scaleX: 1.45,
                scaleY: 1.1,
                alpha: 0,
                duration: 240,
                onComplete: () => mist.destroy()
            });
            this.spawnRadialSparkBurst(x, y, {
                count: 10,
                color: 0xd8fbff,
                colorAlt: 0x59b7ff,
                minSpeed: 38,
                maxSpeed: 96
            });
            return;
        }

        if (def && def.type === "fire") {
            const flash = this.add.ellipse(x, y, 72, 34, 0xff6c34, 0.42).setDepth(5100);
            const core = this.add.ellipse(x + 8, y, 40, 18, 0xfff0a6, 0.78).setDepth(5101);
            flash.angle = 8;
            core.angle = 8;
            this.fxLayer.add(flash);
            this.fxLayer.add(core);
            this.tweens.add({
                targets: [flash, core],
                scaleX: 1.55,
                scaleY: 0.72,
                alpha: 0,
                duration: 180,
                onComplete: () => {
                    flash.destroy();
                    core.destroy();
                }
            });
            this.spawnRadialSparkBurst(x + 10, y, {
                count: 12,
                color: 0xfff0a6,
                colorAlt: 0xff7a38,
                minSpeed: 44,
                maxSpeed: 118
            });
            return;
        }

        if (def && def.rarity === "gold") {
            const flash = this.add.circle(x, y, 22, 0xffd85b, 0.34).setDepth(5100);
            this.fxLayer.add(flash);
            this.tweens.add({
                targets: flash,
                scaleX: 2.6,
                scaleY: 2.6,
                alpha: 0,
                duration: 220,
                onComplete: () => flash.destroy()
            });
            this.spawnRadialSparkBurst(x, y, {
                count: 16,
                color: 0xffef9f,
                colorAlt: 0xd9a321,
                minSpeed: 56,
                maxSpeed: 156
            });
            return;
        }

        if (def && def.type === "mul") {
            const flash = this.add.ellipse(x, y, 58, 24, 0x7dff9c, 0.32).setDepth(5100);
            this.fxLayer.add(flash);
            this.tweens.add({
                targets: flash,
                scaleX: 2.2,
                scaleY: 0.72,
                alpha: 0,
                duration: 150,
                onComplete: () => flash.destroy()
            });
            this.spawnRadialSparkBurst(x, y, {
                count: 8,
                color: 0xb7ff9c,
                colorAlt: 0x39ff7a,
                minSpeed: 28,
                maxSpeed: 88
            });
            return;
        }

        this.spawnImpactFx(x, y, 0xffffff);
    },

    spawnMachineProjectile(def, startX, startY, endX, endY, travelDuration, onComplete) {
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90;
        const projectile = this.add.container(startX, startY).setDepth(5000);
        let primary = null;

        if (def.type === "fire") {
            const glow = this.add.ellipse(0, 0, 30, 86, 0xff5c31, 0.20);
            const body = this.add.ellipse(0, 0, 18, 66, 0xff7c2d, 0.96).setStrokeStyle(2, 0xfff0a6, 0.72);
            const core = this.add.ellipse(0, -10, 10, 34, 0xfff0ad, 0.92);
            const tailA = this.add.ellipse(-6, 14, 12, 30, 0xff4e23, 0.72);
            const tailB = this.add.ellipse(6, 18, 10, 24, 0xffa43d, 0.64);
            projectile.add([glow, tailA, tailB, body, core]);
            primary = body;
            this.tweens.add({
                targets: [body, core, tailA, tailB],
                scaleX: 0.72,
                scaleY: 1.16,
                y: "-=8",
                duration: 110,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        } else if (def.type === "water") {
            const mist = this.add.ellipse(0, 0, 26, 58, 0x9ce8ff, 0.18);
            const streamA = this.add.rectangle(-6, 0, 5, 82, 0x8de6ff, 0.84);
            const streamB = this.add.rectangle(0, 0, 7, 88, 0xbdf6ff, 0.92);
            const streamC = this.add.rectangle(6, 0, 5, 78, 0x5ec3ff, 0.80);
            const head = this.add.circle(0, -40, 8, 0xe4fbff, 0.98);
            projectile.add([mist, streamA, streamB, streamC, head]);
            primary = streamB;
            this.tweens.add({
                targets: [streamA, streamB, streamC],
                alpha: 0.42,
                scaleY: 0.76,
                duration: 90,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        } else if (def.rarity === "gold") {
            const glow = this.add.ellipse(0, 0, 34, 96, 0xffd75c, 0.18);
            const beam = this.add.rectangle(0, 0, 18, 96, 0xffd84c, 0.96).setStrokeStyle(3, 0xfff5b8, 0.85);
            const core = this.add.rectangle(0, 0, 8, 98, 0xfff6be, 0.96);
            const head = this.add.star(0, -52, 4, 3, 9, 0xfff6be, 0.98);
            projectile.add([glow, beam, core, head]);
            primary = beam;
            this.tweens.add({
                targets: [glow, beam, core],
                alpha: 0.58,
                duration: 100,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        } else {
            const glow = this.add.ellipse(0, 0, 34, 90, 0x56ff86, 0.16);
            const beam = this.add.rectangle(0, 0, 20, 92, 0x3aff77, 0.94).setStrokeStyle(3, 0xd8ffd8, 0.78);
            const core = this.add.rectangle(0, 0, 10, 94, 0xe6fff0, 0.90);
            projectile.add([glow, beam, core]);
            primary = beam;
            this.tweens.add({
                targets: [glow, beam],
                alpha: 0.5,
                duration: 100,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        }

        projectile.angle = angle;
        this.fxLayer.add(projectile);

        this.tweens.add({
            targets: projectile,
            x: endX,
            y: endY,
            duration: travelDuration,
            ease: def.type === "fire" ? "Cubic.In" : "Sine.In",
            onComplete: () => {
                if (projectile.scene) projectile.destroy();
                if (typeof onComplete === "function") onComplete();
            }
        });

        if (primary) {
            this.tweens.add({
                targets: primary,
                scaleX: def.type === "water" ? 0.84 : 1.1,
                duration: 120,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        }
    },

    pulseFinalCollector(color = 0x63ff8d, strength = 1) {
        this.finalCollectorGlowUntil = this.time.now + 420;
        this.finalCollectorGlowColor = color;
        this.finalCollectorGlowStrength = strength;

        const line = this.lines.line3;
        const x = line.endX + 76;
        const y = line.y + line.h * 0.5 - 16;
        const glow = this.add.ellipse(x, y, 170, 220, color, 0.18 * strength).setDepth(6400);
        this.fxLayer.add(glow);
        this.tweens.add({
            targets: glow,
            scaleX: 1.35,
            scaleY: 1.12,
            alpha: 0,
            duration: 320,
            ease: "Cubic.Out",
            onComplete: () => glow.destroy()
        });

        for (let i = 0; i < 4; i++) {
            const ray = this.add.rectangle(x - 26 + i * 16, y - 12, 10, 148, color, 0.18).setDepth(6398);
            this.fxLayer.add(ray);
            this.tweens.add({
                targets: ray,
                y: y - 92,
                scaleY: 1.34,
                alpha: 0,
                duration: 240 + i * 35,
                ease: "Cubic.Out",
                onComplete: () => ray.destroy()
            });
        }
    },

    spawnEggSplatFx(x, y, targetY = y) {
        const splat = this.add.container(x, y).setDepth(5095);
        const white = this.add.ellipse(0, 0, 48, 26, 0xf7f6ef, 0.98).setStrokeStyle(2, 0xdedbd1, 0.9);
        const yolk = this.add.circle(5, -1, 7, 0xf1cc46, 1).setStrokeStyle(2, 0xd3a629, 0.95);
        const shine = this.add.circle(3, -3, 2, 0xffefad, 0.9);
        splat.add([white, yolk, shine]);
        this.fxLayer.add(splat);

        splat.scale = 0.62;
        splat.alpha = 0;

        this.tweens.add({
            targets: splat,
            y: targetY,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 140,
            ease: "Quad.Out"
        });

        this.tweens.add({
            targets: splat,
            alpha: 0,
            delay: 380,
            duration: 280,
            onComplete: () => splat.destroy()
        });
    },

    showCenterWin(amount) {
        const txt = this.add.text(this.W * 0.5, this.H * 0.45, `+${this.formatMoneyValue(amount).replace("$", "")}$`, {
            fontFamily: "Arial",
            fontSize: 192,
            color: "#7dff9c",
            fontStyle: "bold",
            stroke: "#112417",
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(8000);

        txt.alpha = 0;
        txt.scale = 0.92;

        this.tweens.add({
            targets: txt,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 130
        });

        this.tweens.add({
            targets: txt,
            alpha: 0,
            y: txt.y - 46,
            delay: 1000,
            duration: 420,
            onComplete: () => txt.destroy()
        });
    }
};
