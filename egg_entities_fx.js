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
        const valueText = this.add.text(0, 34, `${cost}$`, {
            fontFamily: "Arial",
            fontSize: "54px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#101010",
            strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);

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

    createEggVisual(eggType, withShadow = false) {
        const container = this.add.container(0, 0);
        const eggScale = 1.35;

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

        if (eggType.glow) {
            const glow = this.add.ellipse(0, 0, 46, 60, eggType.glow, 0.24);
            container.addAt(glow, withShadow ? 1 : 0);
        }

        if (eggType.mysteryFx) {
            const aura = this.add.ellipse(0, 0, 52, 66, 0xffd36d, 0.13);
            const patchA = this.add.ellipse(-8, -6, 14, 11, 0x4fd7ff, 0.95).setStrokeStyle(2, 0xe9feff, 0.85);
            const patchB = this.add.ellipse(7, 5, 12, 10, 0xff58b5, 0.92).setStrokeStyle(2, 0xffd2f0, 0.85);
            const patchC = this.add.ellipse(1, -15, 11, 8, 0xffcf4a, 0.94).setStrokeStyle(2, 0xfff3be, 0.8);
            const sigil = this.add.star(0, 1, 5, 3.4, 6.8, 0x6a46ff, 0.95).setStrokeStyle(2, 0xf6eeff, 0.8);
            const flashA = this.add.circle(-15, -14, 2.3, 0x7cecff, 1);
            const flashB = this.add.circle(15, -4, 2.1, 0xff7ccc, 0.95);
            const flashC = this.add.circle(-2, 17, 1.9, 0xffef89, 0.92);
            const flashD = this.add.circle(9, -18, 1.8, 0xffffff, 0.96);
            container.addAt(aura, withShadow ? 1 : 0);
            container.add([patchA, patchB, patchC, sigil, flashA, flashB, flashC, flashD]);

            this.tweens.add({
                targets: aura,
                alpha: 0.28,
                scaleX: 1.16,
                scaleY: 1.12,
                duration: 380,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
            this.tweens.add({
                targets: [patchA, patchB, patchC],
                angle: 10,
                duration: 520,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
            this.tweens.add({
                targets: sigil,
                angle: 22,
                scaleX: 1.16,
                scaleY: 1.16,
                alpha: 0.72,
                duration: 320,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });

            for (const flash of [flashA, flashB, flashC, flashD]) {
                flash._baseAlpha = flash.alpha;
                this.tweens.add({
                    targets: flash,
                    alpha: flash._baseAlpha * 0.15,
                    scaleX: 2.8,
                    scaleY: 2.8,
                    duration: 180 + Phaser.Math.Between(0, 160),
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 240)
                });
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

        if (eggType.diamondFx) {
            const aura = this.add.ellipse(0, 0, 52, 68, 0x75e6ff, 0.12);
            const sparkA = this.add.circle(-14, -10, 2.6, 0xaeeeff, 1);
            const sparkB = this.add.circle(13, 7, 2.4, 0x7ad9ff, 0.92);
            const sparkC = this.add.circle(2, -18, 2.2, 0xeaffff, 0.86);
            container.addAt(aura, withShadow ? 1 : 0);
            container.add([sparkA, sparkB, sparkC]);

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

    updatePillowValueText(item, color = "#ffffff") {
        if (item.eggMultSum <= 0) {
            item.valueText.setAlpha(0);
            return;
        }
        const displayValue = item.eggMultSum > 0 ? item.currentValue : item.spentCost;
        item.valueText.setText(this.formatMoneyValue(displayValue));
        item.valueText.setColor(item.permanentTextColor || color || "#ffffff");
        item.valueText.setAlpha(item.eggMultSum > 0 ? 1 : 0);
    },

    flashValueText(item, flashColor) {
        if (!item || !item.valueText || item.eggMultSum <= 0) return;
        const baseColor = item.permanentTextColor || "#ffffff";
        this.tweens.killTweensOf(item.valueText);
        item.valueText.setAlpha(1);
        item.valueText.setColor(flashColor);
        this.tweens.add({
            targets: item.valueText,
            alpha: 0.3,
            duration: 140,
            ease: "Sine.InOut",
            yoyo: true,
            onYoyo: () => item.valueText.setColor(baseColor),
            onComplete: () => {
                item.valueText.setColor(baseColor);
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
