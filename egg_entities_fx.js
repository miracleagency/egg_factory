window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.entitiesFx = {
    createMachineBlock(def) {
        const container = this.add.container(0, 0).setDepth(200);
        let fill = 0x8694a8;
        let stroke = 0xc0cfde;

        if (def.type === "water") {
            fill = 0x59b7ff;
            stroke = 0x9fd7ff;
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

        container.add([body, lip, label]);
        container.setScale(1.12);
        this.machineLayer.add(container);

        def.container = container;
        def.nextShot = 0;
        def.shotDesync = Phaser.Math.FloatBetween(0.04, 0.22);
        def.fireChaosJitter = def.rapid ? Phaser.Math.FloatBetween(0.62, 0.96) : Phaser.Math.FloatBetween(0.8, 1.28);
        def.fireSkipChance = def.rapid ? Phaser.Math.FloatBetween(0.02, 0.08) : Phaser.Math.FloatBetween(0.12, 0.26);

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
        }).setOrigin(0.5).setAlpha(0.5);

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

        if (withShadow) {
            const shadow = this.add.ellipse(0, 18, 16, 6, 0x000000, 0.15);
            container.add(shadow);
        }

        if (eggType.armored) {
            const shell = this.add.ellipse(0, 0, 24, 32, 0x8d969f, 1).setStrokeStyle(3, 0xdfe6ef);
            const band = this.add.rectangle(0, 0, 18, 24, 0x69727d, 0.95).setStrokeStyle(2, 0xc8d0db);
            const rivets = [
                this.add.circle(-8, -8, 2.2, 0xe4eaf1, 1),
                this.add.circle(8, -8, 2.2, 0xe4eaf1, 1),
                this.add.circle(-8, 8, 2.2, 0xe4eaf1, 1),
                this.add.circle(8, 8, 2.2, 0xe4eaf1, 1)
            ];
            const shine = this.add.ellipse(-5, -8, 5, 8, 0xffffff, 0.22);
            container.add([shell, band, ...rivets, shine]);
            return { container, body: shell };
        }

        const body = this.add.ellipse(0, 0, 22, 30, eggType.color, 1).setStrokeStyle(2, eggType.stroke);
        const shine = this.add.ellipse(-4, -6, 5, 8, 0xffffff, 0.35);
        container.add([body, shine]);

        if (eggType.glow) {
            const glow = this.add.ellipse(0, 0, 30, 40, eggType.glow, 0.24);
            container.addAt(glow, withShadow ? 1 : 0);
        }

        return { container, body };
    },

    updatePillowValueText(item, color = "#ffffff") {
        const displayValue = item.eggMultSum > 0 ? item.currentValue : item.spentCost;
        item.valueText.setText(`${Math.round(displayValue)}$`);
        item.valueText.setColor(item.permanentTextColor || color || "#ffffff");
        item.valueText.setAlpha(item.eggMultSum > 0 ? 1 : 0);
    },

    flashValueText(item, flashColor) {
        if (!item || !item.valueText) return;
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
        const txt = this.add.text(this.W * 0.5, this.H * 0.45, `+${Math.round(amount)}$`, {
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
