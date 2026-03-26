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

    createSvgMachineIcon(key, tint, size) {
        if (!this.textures || !this.textures.exists || !this.textures.exists(key)) return null;
        const icon = this.add.image(0, 0, key);
        if (typeof tint === "number") icon.setTint(tint);
        icon.setDisplaySize(size, size);
        return icon;
    },

    createNuclearSymbolGraphic(size = 24) {
        const g = this.add.graphics();
        const scale = size / 24;
        g.fillStyle(0xfcbb29, 1);
        g.fillCircle(0, 0, 11 * scale);
        g.fillStyle(0x4d4d4d, 1);
        g.fillCircle(0, 0, 2.2 * scale);

        const sector = (rotationDeg) => {
            const start = Phaser.Math.DegToRad(rotationDeg - 28);
            const end = Phaser.Math.DegToRad(rotationDeg + 28);
            g.slice(0, 0, 8.4 * scale, start, end, false);
            g.lineTo(Math.cos(Phaser.Math.DegToRad(rotationDeg)) * 4.1 * scale, Math.sin(Phaser.Math.DegToRad(rotationDeg)) * 4.1 * scale);
            g.closePath();
            g.fillPath();
        };

        sector(-90);
        sector(30);
        sector(150);
        return g;
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
        } else if (def.type === "shield") {
            fill = 0x4f5967;
            stroke = 0xf1f6fb;
        } else if (def.type === "fire") {
            fill = 0xd3412c;
            stroke = 0xff9f8f;
        } else if (def.rarity === "gold") {
            fill = 0xe1c83b;
            stroke = 0xffef8e;
        }
        let body;
        let lip;
        if (def.type === "shield") {
            body = this.add.roundRectangle
                ? this.add.roundRectangle(0, 0, 126, 72, 14, fill, 1).setStrokeStyle(4, stroke)
                : this.add.rectangle(0, 0, 126, 72, fill, 1).setStrokeStyle(4, stroke);
            lip = this.add.rectangle(0, 44, 84, 12, 0x222b35, 1).setStrokeStyle(2, 0xaab9c7);
        } else {
            body = this.add.rectangle(0, 0, 126, 72, fill, 1).setStrokeStyle(4, stroke);
            lip = this.add.rectangle(0, 44, 84, 12, 0x3a4554, 1).setStrokeStyle(2, 0x7c8998);
        }
        const label = this.add.text(0, -2, def.label, {
            fontFamily: "Arial",
            fontSize: def.type === "shield" ? "26px" : "36px",
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
        const hammerHandle = this.add.rectangle(0, -4, 8, 32, 0x8f6748, 1).setStrokeStyle(2, 0xe2c6aa);
        const hammerHead = this.add.rectangle(0, -18, 24, 12, 0xc8d0db, 1).setStrokeStyle(2, 0xffffff);
        hammer.add([hammerHandle, hammerHead]);

        const parts = [body, lip, label, timerText, hammer];
        const faceParts = [];
        if (def.type === "water") {
            const iconDisk = this.add.circle(0, -2, 32, 0x0a2240, 1).setStrokeStyle(4, 0x6edcff, 0.95);
            const ringGlow = this.add.ellipse(0, -2, 76, 56, 0x4cdfff, 0.12);
            const dropSvg = this.createSvgMachineIcon("egg_icon_water_svg", 0x7fe9ff, 56);
            if (dropSvg) {
                dropSvg.y = -2;
                faceParts.push(ringGlow, iconDisk, dropSvg);
            } else {
                const drop = this.add.graphics();
                const dropPoints = [
                    { x: 0, y: -20 },
                    { x: 11, y: -6 },
                    { x: 9, y: 10 },
                    { x: 0, y: 18 },
                    { x: -9, y: 10 },
                    { x: -11, y: -6 }
                ];
                drop.fillStyle(0x7fe9ff, 1);
                drop.lineStyle(2.5, 0xeaffff, 0.95);
                drop.fillPoints(dropPoints, true, true);
                drop.strokePoints(dropPoints, true, true);
                faceParts.push(ringGlow, iconDisk, drop);
            }
        } else if (def.type === "crush") {
            const hood = this.add.rectangle(0, -18, 96, 12, 0x51433a, 1).setStrokeStyle(2, 0xe0c6ad, 0.64);
            const jaw = this.add.rectangle(0, 14, 82, 16, 0x65564d, 1).setStrokeStyle(3, 0xf0dcc4, 0.72);
            const toothPoints = [-24, -8, 8, 24];
            const teeth = toothPoints.map(x => this.add.triangle(x, 24, -5, -2, 5, -2, 0, 10, 0xf2ddc6, 1).setStrokeStyle(1, 0x5b493e, 0.56));
            const bolts = [-42, -16, 16, 42].map(x => this.add.circle(x, -20, 2.8, 0xf0e1d1, 1).setStrokeStyle(1.3, 0x725c4d));
            parts.splice(1, 0, hood, jaw, ...teeth, ...bolts);
        } else if (def.type === "fire") {
            const iconDisk = this.add.circle(0, -2, 32, 0x0f0908, 1).setStrokeStyle(4, 0xff7b52, 0.9);
            const emberGlow = this.add.ellipse(0, -2, 78, 58, 0xff7b32, 0.12);
            const flameSvg = this.createSvgMachineIcon("egg_icon_fire_svg", 0xff5d2f, 60);
            if (flameSvg) {
                flameSvg.y = -2;
                const flameInner = this.createSvgMachineIcon("egg_icon_fire_svg", 0xffef9f, 30);
                if (flameInner) flameInner.y = 2;
                faceParts.push(emberGlow, iconDisk, flameSvg, ...(flameInner ? [flameInner] : []));
            } else {
                const flameOuter = this.add.graphics();
                const flameOuterPts = [
                    { x: 0, y: -20 },
                    { x: 10, y: -8 },
                    { x: 8, y: 2 },
                    { x: 12, y: 14 },
                    { x: 0, y: 18 },
                    { x: -12, y: 14 },
                    { x: -8, y: 2 },
                    { x: -10, y: -8 }
                ];
                flameOuter.fillStyle(0xff5d2f, 1);
                flameOuter.lineStyle(2.5, 0xffd5a8, 0.8);
                flameOuter.fillPoints(flameOuterPts, true, true);
                flameOuter.strokePoints(flameOuterPts, true, true);
                const flameInner = this.add.graphics();
                const flameInnerPts = [
                    { x: 0, y: -11 },
                    { x: 5, y: -3 },
                    { x: 4, y: 6 },
                    { x: 0, y: 11 },
                    { x: -4, y: 6 },
                    { x: -5, y: -3 }
                ];
                flameInner.fillStyle(0xffef9f, 1);
                flameInner.fillPoints(flameInnerPts, true, true);
                faceParts.push(emberGlow, iconDisk, flameOuter, flameInner);
            }
        } else if (def.rarity === "gold") {
            const frame = this.add.roundRectangle
                ? this.add.roundRectangle(0, 0, 94, def.value === 50 ? 58 : 52, 12, 0x9f7720, 0.96).setStrokeStyle(3, 0xffef9f, 0.9)
                : this.add.rectangle(0, 0, 94, def.value === 50 ? 58 : 52, 0x9f7720, 0.96).setStrokeStyle(3, 0xffef9f, 0.9);
            const halo = this.add.ellipse(0, 0, def.value === 50 ? 100 : 88, def.value === 50 ? 48 : 42, 0xffdb58, 0.16);
            const bigMult = this.add.text(0, -2, `X${def.value}`, {
                fontFamily: "Arial",
                fontSize: def.value === 50 ? "46px" : (def.value >= 20 ? "42px" : "44px"),
                color: "#4f2900",
                fontStyle: "bold",
                stroke: "#f0cb4e",
                strokeThickness: 8
            }).setOrigin(0.5);
            const flashes = def.value === 50
                ? [
                    this.add.star(-34, -18, 4, 2, 6, 0xfff1bb, 0.95),
                    this.add.star(34, -8, 4, 2, 6, 0xfff1bb, 0.92),
                    this.add.star(-28, 18, 4, 1.8, 5.5, 0xffe47b, 0.9),
                    this.add.star(28, 20, 4, 1.8, 5.5, 0xffe47b, 0.88)
                ]
                : [];
            faceParts.push(halo, frame, bigMult, ...flashes);
        } else if (def.type === "mul") {
            const coil = this.add.roundRectangle
                ? this.add.roundRectangle(0, 0, 84, 52, 12, 0x163d25, 0.96).setStrokeStyle(3, 0xafffcc, 0.88)
                : this.add.rectangle(0, 0, 84, 52, 0x163d25, 0.96).setStrokeStyle(3, 0xafffcc, 0.88);
            const glow = this.add.ellipse(0, 0, 76, 38, 0x65ff98, 0.14);
            const bigMult = this.add.text(0, 0, `X${def.value}`, {
                fontFamily: "Arial",
                fontSize: "42px",
                color: "#a9ff5a",
                fontStyle: "bold",
                stroke: "#11341d",
                strokeThickness: 6
            }).setOrigin(0.5);
            faceParts.push(glow, bigMult);
            parts.splice(1, 0, coil);
        }
        if (def.type === "shield") {
            const glow = this.add.ellipse(0, 0, 144, 88, 0x79d8ff, 0.12);
            const topCap = this.add.rectangle(0, -24, 110, 12, 0x27323c, 0.98).setStrokeStyle(2, 0xd6eaf3, 0.76);
            const bottomCap = this.add.rectangle(0, 24, 104, 12, 0x1c252d, 0.96).setStrokeStyle(2, 0x95a8b8, 0.68);
            const panel = this.add.rectangle(0, -4, 96, 30, 0x273440, 1).setStrokeStyle(2, 0xd5edf6, 0.82);
            const sidePanelL = this.add.rectangle(-44, 2, 18, 42, 0x33414d, 0.98).setStrokeStyle(2, 0xb8ccd9, 0.72);
            const sidePanelR = this.add.rectangle(44, 2, 18, 42, 0x33414d, 0.98).setStrokeStyle(2, 0xb8ccd9, 0.72);
            const ventL = this.add.rectangle(-24, 20, 18, 5, 0xcfd8e2, 0.9);
            const ventC = this.add.rectangle(0, 20, 18, 5, 0xcfd8e2, 0.9);
            const ventR = this.add.rectangle(24, 20, 18, 5, 0xcfd8e2, 0.9);
            const reactorOuter = this.add.circle(0, -8, 16, 0x102230, 1).setStrokeStyle(3, 0xaef1ff, 0.95);
            const reactorMid = this.add.circle(0, -8, 11, 0x1a5b69, 1).setStrokeStyle(2, 0xeafcff, 0.72);
            const reactorCore = this.add.circle(0, -8, 7, 0x6af3ff, 1);
            const reactorGlow = this.add.circle(0, -8, 21, 0x47eeff, 0.2);
            const reactorCrossH = this.add.rectangle(0, -8, 18, 2.8, 0xe9fbff, 0.9);
            const reactorCrossV = this.add.rectangle(0, -8, 2.8, 18, 0xe9fbff, 0.9);
            const microPlates = [
                this.add.rectangle(-32, -6, 13, 9, 0x4a5663, 0.92).setStrokeStyle(1, 0x9baebd, 0.6),
                this.add.rectangle(32, -6, 13, 9, 0x4a5663, 0.92).setStrokeStyle(1, 0x9baebd, 0.6),
                this.add.rectangle(-32, 11, 13, 7, 0x4a5663, 0.9).setStrokeStyle(1, 0x9baebd, 0.55),
                this.add.rectangle(32, 11, 13, 7, 0x4a5663, 0.9).setStrokeStyle(1, 0x9baebd, 0.55)
            ];
            const panelBars = [
                this.add.rectangle(-46, -16, 18, 4, 0xe7eef6, 0.88),
                this.add.rectangle(46, -16, 18, 4, 0xe7eef6, 0.88),
                this.add.rectangle(-46, 16, 18, 4, 0xe7eef6, 0.88),
                this.add.rectangle(46, 16, 18, 4, 0xe7eef6, 0.88)
            ];
            const rivets = [
                this.add.circle(-54, -22, 4, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(54, -22, 4, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(-54, 22, 4, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(54, 22, 4, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(-26, -30, 3.6, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(26, -30, 3.6, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(-26, 30, 3.6, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(26, 30, 3.6, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280),
                this.add.circle(-8, -32, 3, 0xe4ebf5, 1).setStrokeStyle(1.5, 0x667280),
                this.add.circle(8, -32, 3, 0xe4ebf5, 1).setStrokeStyle(1.5, 0x667280),
                this.add.circle(-8, 32, 3, 0xe4ebf5, 1).setStrokeStyle(1.5, 0x667280),
                this.add.circle(8, 32, 3, 0xe4ebf5, 1).setStrokeStyle(1.5, 0x667280)
            ];
            const shieldPlate = this.add.roundRectangle
                ? this.add.roundRectangle(0, 2, 60, 64, 16, 0x153542, 0.98).setStrokeStyle(3, 0xc2fbff, 0.95)
                : this.add.rectangle(0, 2, 60, 64, 0x153542, 0.98).setStrokeStyle(3, 0xc2fbff, 0.95);
            const shieldCoreSvg = this.createSvgMachineIcon("egg_icon_shield_svg", 0x54f3ea, 74);
            const shieldInnerSvg = this.createSvgMachineIcon("egg_icon_shield_svg", 0xb7fff9, 40);
            const shieldGlow = this.add.ellipse(0, 4, 54, 58, 0x4cece3, 0.22);
            const shieldStuds = [
                this.add.circle(-20, -12, 2.8, 0xe7fbff, 1).setStrokeStyle(1.2, 0x44717a),
                this.add.circle(20, -12, 2.8, 0xe7fbff, 1).setStrokeStyle(1.2, 0x44717a),
                this.add.circle(-20, 16, 2.8, 0xe7fbff, 1).setStrokeStyle(1.2, 0x44717a),
                this.add.circle(20, 16, 2.8, 0xe7fbff, 1).setStrokeStyle(1.2, 0x44717a)
            ];
            if (shieldCoreSvg) shieldCoreSvg.y = 2;
            if (shieldInnerSvg) shieldInnerSvg.y = 4;
            if (shieldCoreSvg) {
                faceParts.push(shieldGlow, shieldPlate, shieldCoreSvg, ...(shieldInnerSvg ? [shieldInnerSvg] : []), ...shieldStuds);
            } else {
                const shieldCore = this.add.graphics();
                const shieldPts = [
                    { x: 0, y: -22 },
                    { x: 18, y: -12 },
                    { x: 16, y: 10 },
                    { x: 0, y: 24 },
                    { x: -16, y: 10 },
                    { x: -18, y: -12 }
                ];
                shieldCore.fillStyle(0x54f3ea, 1);
                shieldCore.lineStyle(2.5, 0xe8ffff, 0.92);
                shieldCore.fillPoints(shieldPts, true, true);
                shieldCore.strokePoints(shieldPts, true, true);
                const shieldInner = this.add.graphics();
                const shieldInnerPts = [
                    { x: 0, y: -11 },
                    { x: 8, y: -5 },
                    { x: 7, y: 6 },
                    { x: 0, y: 14 },
                    { x: -7, y: 6 },
                    { x: -8, y: -5 }
                ];
                shieldInner.fillStyle(0xb7fff9, 0.92);
                shieldInner.fillPoints(shieldInnerPts, true, true);
                faceParts.push(shieldGlow, shieldPlate, shieldCore, shieldInner, ...shieldStuds);
            }
            parts.unshift(glow);
            parts.splice(1, 0,
                topCap,
                bottomCap,
                sidePanelL,
                sidePanelR,
                panel,
                reactorGlow,
                reactorOuter,
                reactorMid,
                reactorCore,
                reactorCrossH,
                reactorCrossV,
                ventL,
                ventC,
                ventR,
                ...microPlates,
                ...panelBars,
                ...rivets
            );
        }
        if (faceParts.length > 0) parts.splice(parts.length - 3, 0, ...faceParts);
        const destroyedFx = this.add.container(0, 0).setVisible(false);
        const wreckGlow = this.add.ellipse(0, 8, 122, 74, 0xff6f3d, 0.10);
        const wreckBody = this.add.rectangle(0, 2, 126, 72, 0x261d19, 0.96).setStrokeStyle(4, 0x6f4737, 0.88);
        const wreckPanel = this.add.rectangle(-2, 0, 96, 48, 0x312722, 0.92).setStrokeStyle(2, 0x59463c, 0.74);
        const wreckPlateL = this.add.rectangle(-40, 18, 26, 12, 0x4c4646, 0.88).setAngle(-22).setStrokeStyle(1.6, 0x746868, 0.6);
        const wreckPlateR = this.add.rectangle(38, 14, 30, 12, 0x4a4343, 0.86).setAngle(18).setStrokeStyle(1.6, 0x746868, 0.56);
        const gearHub = this.add.circle(-16, 2, 11, 0x1d2025, 0.96).setStrokeStyle(2, 0x707884, 0.8);
        const gearTeeth = [-90, -45, 0, 45, 90, 135, 180, 225].map(angle => {
            const rad = Phaser.Math.DegToRad(angle);
            return this.add.rectangle(-16 + Math.cos(rad) * 13, 2 + Math.sin(rad) * 13, 4, 8, 0x6b737d, 0.9).setAngle(angle);
        });
        const pistonA = this.add.rectangle(18, -2, 32, 9, 0x525963, 0.9).setAngle(-18).setStrokeStyle(1.4, 0x8c96a3, 0.6);
        const pistonB = this.add.rectangle(24, 14, 24, 8, 0x4b525c, 0.88).setAngle(26).setStrokeStyle(1.4, 0x8c96a3, 0.54);
        const crackMain = this.add.graphics();
        crackMain.lineStyle(3, 0x120f0f, 0.98);
        crackMain.beginPath();
        crackMain.moveTo(-28, -22);
        crackMain.lineTo(-10, -8);
        crackMain.lineTo(-18, 8);
        crackMain.lineTo(0, 22);
        crackMain.moveTo(0, -20);
        crackMain.lineTo(10, -4);
        crackMain.lineTo(2, 10);
        crackMain.lineTo(16, 24);
        crackMain.strokePath();
        const crackGlow = this.add.graphics();
        crackGlow.lineStyle(2, 0xff8d4a, 0.42);
        crackGlow.beginPath();
        crackGlow.moveTo(-28, -22);
        crackGlow.lineTo(-10, -8);
        crackGlow.lineTo(-18, 8);
        crackGlow.lineTo(0, 22);
        crackGlow.moveTo(0, -20);
        crackGlow.lineTo(10, -4);
        crackGlow.lineTo(2, 10);
        crackGlow.lineTo(16, 24);
        crackGlow.strokePath();
        const emberCore = this.add.ellipse(-2, 10, 44, 22, 0xff6e39, 0.26);
        const emberHot = this.add.ellipse(2, 10, 22, 10, 0xffcf68, 0.32);
        const flameA = this.add.ellipse(-22, -2, 16, 28, 0xff7d36, 0.94).setAngle(-10).setStrokeStyle(1.5, 0xffefb3, 0.7);
        const flameB = this.add.ellipse(10, -4, 14, 26, 0xff9a40, 0.9).setAngle(12).setStrokeStyle(1.5, 0xffefb3, 0.64);
        const flameCoreA = this.add.ellipse(-22, 0, 7, 15, 0xfff1ae, 0.8).setAngle(-10);
        const flameCoreB = this.add.ellipse(10, -2, 6, 13, 0xffefad, 0.76).setAngle(12);
        const smokeA = this.add.circle(22, -18, 14, 0x2b2b30, 0.40);
        const smokeB = this.add.circle(4, -30, 11, 0x38383d, 0.32);
        const smokeC = this.add.circle(30, -36, 8, 0x202026, 0.26);
        destroyedFx.add([
            wreckGlow,
            wreckBody,
            wreckPanel,
            wreckPlateL,
            wreckPlateR,
            gearHub,
            ...gearTeeth,
            pistonA,
            pistonB,
            crackGlow,
            crackMain,
            emberCore,
            emberHot,
            flameA,
            flameB,
            flameCoreA,
            flameCoreB,
            smokeA,
            smokeB,
            smokeC
        ]);
        container.add(parts);
        container.add(destroyedFx);
        container.setScale(1.12);
        this.machineLayer.add(container);

        def.container = container;
        def.labelText = label;
        def.faceParts = faceParts;
        def.timerText = timerText;
        def.hammer = hammer;
        def.baseLabel = def.label;
        def.nextShot = 0;
        def.shotDesync = Phaser.Math.FloatBetween(0.04, 0.22);
        def.fireChaosJitter = def.rapid ? Phaser.Math.FloatBetween(0.62, 0.96) : Phaser.Math.FloatBetween(0.8, 1.28);
        def.fireSkipChance = def.rapid ? Phaser.Math.FloatBetween(0.04, 0.12) : Phaser.Math.FloatBetween(0.16, 0.30);
        def.showBaseLabel = !(def.type === "water" || def.type === "fire" || def.type === "crush" || def.type === "shield" || def.type === "mul" || def.rarity === "gold");
        label.setVisible(def.showBaseLabel);
        def.destroyedFx = destroyedFx;

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
        const shadow = this.add.ellipse(0, 16, 112, 18, 0x000000, 0).setVisible(false);
        const body = this.add.rectangle(0, 0, 108, 40, color, 0).setStrokeStyle(0, 0xffffff, 0).setVisible(false);
        const gloss = this.add.rectangle(0, -8, 72, 14, 0xffffff, 0).setVisible(false);
        const valueText = this.createPillowValueText(`${cost}$`);
        const wetOverlay = this.add.container(0, 0);

        container.add([shadow, body, gloss, valueText, wetOverlay]);
        container._wetOverlay = wetOverlay;

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

    createTravelEggBox() {
        const container = this.add.container(0, 0);
        const shadow = this.add.ellipse(0, 34, 170, 32, 0x000000, 0.32);
        const rearShadow = this.add.ellipse(0, 14, 140, 20, 0x000000, 0.12);
        const backPlate = this.add.roundRectangle ? this.add.roundRectangle(0, -10, 124, 100, 18, 0x44515d, 1).setStrokeStyle(4, 0xc8d2dc) : this.add.rectangle(0, -10, 124, 100, 0x44515d, 1).setStrokeStyle(4, 0xc8d2dc);
        const body = this.add.roundRectangle ? this.add.roundRectangle(0, 0, 140, 110, 20, 0x5b6875, 1).setStrokeStyle(5, 0xe1e7ef) : this.add.rectangle(0, 0, 140, 110, 0x5b6875, 1).setStrokeStyle(5, 0xe1e7ef);
        const topLid = this.add.roundRectangle ? this.add.roundRectangle(0, -34, 124, 26, 10, 0x93a0ae, 1).setStrokeStyle(3, 0xf6fbff) : this.add.rectangle(0, -34, 124, 26, 0x93a0ae, 1).setStrokeStyle(3, 0xf6fbff);
        const midBand = this.add.rectangle(0, -4, 126, 14, 0x394552, 1).setStrokeStyle(2, 0x7f8d9b, 0.8);
        const hatch = this.add.roundRectangle ? this.add.roundRectangle(0, -18, 62, 16, 8, 0x232b34, 1).setStrokeStyle(2, 0xb5c4d1, 0.55) : this.add.rectangle(0, -18, 62, 16, 0x232b34, 1).setStrokeStyle(2, 0xb5c4d1, 0.55);
        const labelPlate = this.add.rectangle(0, 30, 92, 34, 0x2e3946, 0.92).setStrokeStyle(2, 0xb5c3d3, 0.75);
        const labelA = this.add.text(0, 14, "EGGS", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#eef4ff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        const labelB = this.add.text(0, 40, "BOX", {
            fontFamily: "Arial",
            fontSize: "22px",
            color: "#eef4ff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        const rivets = [
            [-50, -38], [50, -38], [-60, -8], [60, -8],
            [-60, 28], [60, 28], [-34, 46], [34, 46]
        ].map(([x, y]) => {
            const rivet = this.add.circle(x, y, 4.5, 0xe4ebf5, 1).setStrokeStyle(2, 0x667280);
            const shine = this.add.circle(x - 1.2, y - 1.2, 1.4, 0xffffff, 0.55);
            return [rivet, shine];
        }).flat();
        const crackA = this.add.graphics().setVisible(false);
        crackA.lineStyle(3, 0x171d25, 0.96);
        crackA.beginPath();
        crackA.moveTo(-26, -18);
        crackA.lineTo(-14, -4);
        crackA.lineTo(-22, 10);
        crackA.lineTo(-8, 24);
        crackA.strokePath();
        const crackB = this.add.graphics().setVisible(false);
        crackB.lineStyle(3, 0x141a22, 0.96);
        crackB.beginPath();
        crackB.moveTo(24, -26);
        crackB.lineTo(12, -10);
        crackB.lineTo(24, 4);
        crackB.lineTo(10, 22);
        crackB.moveTo(12, -10);
        crackB.lineTo(-4, 0);
        crackB.strokePath();
        const crackC = this.add.graphics().setVisible(false);
        crackC.lineStyle(3, 0x10151c, 1);
        crackC.beginPath();
        crackC.moveTo(-6, -30);
        crackC.lineTo(2, -10);
        crackC.lineTo(-12, 10);
        crackC.lineTo(4, 28);
        crackC.moveTo(2, -10);
        crackC.lineTo(18, 2);
        crackC.strokePath();
        const wetOverlay = this.add.container(0, 0);

        container.add([
            shadow,
            rearShadow,
            backPlate,
            body,
            topLid,
            midBand,
            hatch,
            labelPlate,
            labelA,
            labelB,
            ...rivets,
            crackA,
            crackB,
            crackC,
            wetOverlay
        ]);
        container._eggBoxCracks = [crackA, crackB, crackC];
        container._wetOverlay = wetOverlay;

        return {
            container,
            body,
            eggs: [],
            eggMultSum: 0,
            spentCost: 0,
            currentValue: 0,
            wet: false,
            destroyed: false,
            finished: false,
            settled: true,
            permanentTextColor: null,
            eggsBox: true,
            boxDamage: 0
        };
    },

    getEggFocusAccent(egg) {
        if (!egg) return 0xffffff;
        if (egg.nuclearEgg) return 0x82ff72;
        if (egg.diamondFx) return 0x84e9ff;
        if (egg.goldFx) return 0xffde6d;
        if (egg.mysteryFx) return 0xc98cff;
        if (egg.bomb) return 0xff835e;
        return egg.color || 0xffffff;
    },

    setEggBoxDamageVisual(item, damage) {
        if (!item || !item.container || !Array.isArray(item.container._eggBoxCracks)) return;
        item.boxDamage = damage || 0;
        item.container._eggBoxCracks.forEach((crack, index) => crack.setVisible(index < item.boxDamage));
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
            const nuclear = !!eggType.nuclearEgg;
            const mega = !!eggType.megaArmored || nuclear;
            const shell = this.add.ellipse(0, 0, mega ? 42 : 34, mega ? 58 : 46, mega ? 0x5c6470 : 0x8d969f, 1).setStrokeStyle(3, mega ? 0xf7fbff : 0xdfe6ef);
            const band = this.add.rectangle(0, 0, mega ? 32 : 26, mega ? 42 : 34, mega ? 0x323b46 : 0x69727d, 0.95).setStrokeStyle(2, 0xc8d0db);
            const rivetPoints = mega
                ? [[-13, -17], [0, -19], [13, -17], [-15, 0], [15, 0], [-13, 17], [0, 19], [13, 17]]
                : [[-11, -11], [11, -11], [-11, 11], [11, 11]];
            const rivets = rivetPoints.map(([x, y]) => this.add.circle(x, y, mega ? 3.2 : 2.8, 0xe4eaf1, 1));
            const shine = this.add.ellipse(-7, -12, 7, 12, 0xffffff, 0.22);
            const reactorOuter = mega ? this.add.circle(0, 0, 10, 0x17273a, 1).setStrokeStyle(2, 0xbfefff, 0.95) : null;
            const reactorCore = mega ? this.add.circle(0, 0, 5.5, 0x72e9ff, 1) : null;
            const reactorGlow = mega ? this.add.circle(0, 0, 14, 0x57dcff, 0.22) : null;
            const crackA = this.add.graphics();
            crackA.lineStyle(2, 0x25303a, 0.92);
            crackA.beginPath();
            crackA.moveTo(-4, -12);
            crackA.lineTo(0, -4);
            crackA.lineTo(-5, 5);
            crackA.lineTo(2, 12);
            crackA.moveTo(0, -4);
            crackA.lineTo(6, 2);
            crackA.moveTo(-2, 6);
            crackA.lineTo(-9, 12);
            crackA.strokePath();

            const crackB = this.add.graphics();
            crackB.lineStyle(2, 0x1f262f, 0.96);
            crackB.beginPath();
            crackB.moveTo(6, -14);
            crackB.lineTo(2, -5);
            crackB.lineTo(7, 3);
            crackB.lineTo(1, 11);
            crackB.moveTo(2, -5);
            crackB.lineTo(-4, 1);
            crackB.moveTo(7, 3);
            crackB.lineTo(11, 10);
            crackB.strokePath();

            const armorDamage = eggType.armorDamage || 0;
            crackA.setVisible(armorDamage >= 1);
            crackB.setVisible(armorDamage >= (mega ? 999 : 2));
            if (nuclear) {
                shell.setFillStyle(0x616973, 1).setStrokeStyle(3, 0xf6fbff, 1);
                band.setFillStyle(0x232f37, 0.98).setStrokeStyle(2, 0xdce3ea, 0.95);
                const logoPlate = this.add.circle(0, 2, 13, 0xf3cd2e, 1).setStrokeStyle(2, 0x1e1f20, 0.96);
                const logoGlow = this.add.circle(0, 2, 20, 0x86ff5b, 0.14);
                const logoSvg = this.createNuclearSymbolGraphic(24);
                const crackGlowA = this.add.graphics();
                const crackGlowB = this.add.graphics();
                const crackGlowC = this.add.graphics();
                const coreGlow = this.add.ellipse(0, 4, 36, 48, 0x6bff62, 0.12).setVisible(false);
                const pulseGlow = this.add.ellipse(0, 2, 54, 70, 0x65ff6f, 0.09).setVisible(false);
                const sparkAnchor = this.add.container(0, 0);

                const drawGlowCrack = (graphic, color, points) => {
                    graphic.clear();
                    graphic.lineStyle(4, color, 0.32);
                    graphic.beginPath();
                    graphic.moveTo(points[0][0], points[0][1]);
                    for (let i = 1; i < points.length; i++) graphic.lineTo(points[i][0], points[i][1]);
                    graphic.strokePath();
                    graphic.lineStyle(2.2, 0xd9ff8c, 0.88);
                    graphic.beginPath();
                    graphic.moveTo(points[0][0], points[0][1]);
                    for (let i = 1; i < points.length; i++) graphic.lineTo(points[i][0], points[i][1]);
                    graphic.strokePath();
                };

                drawGlowCrack(crackGlowA, 0x4cff67, [[-6, -14], [-1, -6], [-8, 2], [-3, 12], [3, 18]]);
                drawGlowCrack(crackGlowB, 0x4cff67, [[10, -16], [5, -8], [11, 2], [4, 12], [-2, 18]]);
                drawGlowCrack(crackGlowC, 0x7dff72, [[-16, -4], [-8, 2], [-12, 12], [-2, 20], [10, 24]]);

                logoSvg.y = 2;

                container.add([
                    shell,
                    band,
                    logoGlow,
                    logoPlate,
                    logoSvg,
                    ...rivets,
                    shine,
                    crackGlowA,
                    crackGlowB,
                    crackGlowC,
                    coreGlow,
                    pulseGlow,
                    sparkAnchor
                ]);
                container._nuclearCracks = [crackGlowA, crackGlowB, crackGlowC];
                container._nuclearCoreGlow = coreGlow;
                container._nuclearPulseGlow = pulseGlow;
                container._nuclearSparkAnchor = sparkAnchor;
                container._nuclearLogoGlow = logoGlow;
                this.setNuclearEggVisualState(container, eggType.nuclearHits || 0, disableAmbientFx);
            } else {
                container.add([shell, band, ...(mega ? [reactorGlow, reactorOuter, reactorCore] : []), ...rivets, shine, crackA, crackB]);
            }
            container._armorCrackA = crackA;
            container._armorCrackB = crackB;
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

    setNuclearEggVisualState(eggContainer, hits, disableAmbientFx = false) {
        if (!eggContainer || !Array.isArray(eggContainer._nuclearCracks)) return;
        const safeHits = Math.max(0, hits || 0);
        eggContainer._nuclearCracks.forEach((crack, index) => crack.setVisible(index < safeHits));
        if (eggContainer._nuclearCoreGlow) {
            eggContainer._nuclearCoreGlow.setVisible(safeHits >= 2);
            eggContainer._nuclearCoreGlow.setAlpha(safeHits >= 2 ? 0.26 : 0.12);
        }
        if (eggContainer._nuclearPulseGlow) {
            eggContainer._nuclearPulseGlow.setVisible(safeHits >= 2);
            eggContainer._nuclearPulseGlow.setAlpha(safeHits >= 2 ? 0.18 : 0.08);
        }
        if (eggContainer._nuclearLogoGlow) {
            eggContainer._nuclearLogoGlow.setAlpha(safeHits >= 1 ? 0.22 : 0.14);
        }
        if (eggContainer._nuclearSparkAnchor) {
            eggContainer._nuclearSparkAnchor.removeAll(true);
            if (safeHits >= 3) {
                const sparkOffsets = [[-28, -12], [26, -16], [30, 12], [-24, 22], [0, -30]];
                sparkOffsets.forEach(([x, y]) => {
                    const spark = this.add.star(x, y, 4, 1.8, 5.8, 0x8dff6a, 0.94);
                    eggContainer._nuclearSparkAnchor.add(spark);
                    if (!disableAmbientFx) {
                        this.tweens.add({
                            targets: spark,
                            alpha: 0.1,
                            scaleX: 2.3,
                            scaleY: 2.3,
                            angle: Phaser.Math.Between(-30, 30),
                            duration: 120 + Phaser.Math.Between(0, 120),
                            repeat: -1,
                            yoyo: true,
                            delay: Phaser.Math.Between(0, 140)
                        });
                    }
                });
            }
        }
        if (!disableAmbientFx && safeHits >= 2 && eggContainer.scene) {
            this.tweens.add({
                targets: [eggContainer._nuclearCoreGlow, eggContainer._nuclearPulseGlow].filter(Boolean),
                alpha: safeHits >= 3 ? 0.32 : 0.2,
                scaleX: safeHits >= 3 ? 1.2 : 1.12,
                scaleY: safeHits >= 3 ? 1.16 : 1.1,
                duration: safeHits >= 3 ? 220 : 320,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        }
    },

    setMachineBrokenVisual(def, broken, secondsLeft = 0) {
        if (!def || !def.labelText || !def.timerText || !def.hammer) return;
        if (def.permaDestroyed) {
            def.labelText.setVisible(false);
            if (Array.isArray(def.faceParts)) {
                def.faceParts.forEach(part => part && part.setVisible && part.setVisible(false));
            }
            if (def.destroyedFx) def.destroyedFx.setVisible(true);
            def.timerText.setVisible(false);
            def.hammer.setVisible(false);
            def.container.setAlpha(0.94);
            return;
        }
        def.labelText.setVisible(!broken && !!def.showBaseLabel);
        if (Array.isArray(def.faceParts)) {
            def.faceParts.forEach(part => part && part.setVisible && part.setVisible(!broken));
        }
        if (def.destroyedFx) def.destroyedFx.setVisible(false);
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

    spawnNuclearHitFx(x, y, level = 1) {
        const palette = [0x6dff62, 0xb7ff7e, 0xf4df55];
        const flash = this.add.circle(x, y, 18 + level * 4, palette[Math.min(2, level - 1)] || 0x6dff62, 0.34).setDepth(5132);
        const halo = this.add.ellipse(x, y, 64 + level * 16, 46 + level * 12, 0x6dff62, 0.12).setDepth(5131);
        this.fxLayer.add([halo, flash]);
        this.tweens.add({
            targets: halo,
            scaleX: 1.55,
            scaleY: 1.42,
            alpha: 0,
            duration: 260,
            onComplete: () => halo.destroy()
        });
        this.tweens.add({
            targets: flash,
            scaleX: 2.8,
            scaleY: 2.8,
            alpha: 0,
            duration: 220,
            onComplete: () => flash.destroy()
        });
        this.spawnRadialSparkBurst(x, y, {
            count: 5 + level * 2,
            color: 0x73ff66,
            colorAlt: 0xf2de55,
            minSpeed: 18,
            maxSpeed: 48 + level * 10,
            depth: 5133
        });
    },

    spawnNuclearExplosionFx(x, y) {
        const blinding = this.add.circle(x, y, 40, 0xfef4c5, 0.72).setDepth(9235);
        const plasma = this.add.circle(x, y, 36, 0x7eff57, 0.42).setDepth(9236);
        const blast = this.add.ellipse(x, y, 120, 82, 0xffd05e, 0.28).setDepth(9234);
        const fallout = this.add.ellipse(x, y, 180, 128, 0x76ff66, 0.12).setDepth(9233);
        this.popupLayer.add([fallout, blast, blinding, plasma]);
        [fallout, blast, blinding, plasma].forEach(node => {
            this.tweens.add({
                targets: node,
                scaleX: node === fallout ? 2.2 : 1.9,
                scaleY: node === fallout ? 2 : 1.8,
                alpha: 0,
                duration: node === fallout ? 620 : 420,
                ease: "Cubic.Out",
                onComplete: () => node.destroy()
            });
        });
        for (let i = 0; i < 34; i++) {
            const ember = this.add.circle(x, y, Phaser.Math.Between(4, 10), i % 3 === 0 ? 0xffd86b : 0x7aff6c, 0.95).setDepth(9237);
            this.popupLayer.add(ember);
            this.tweens.add({
                targets: ember,
                x: x + Phaser.Math.Between(-180, 180),
                y: y + Phaser.Math.Between(-140, 140),
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 420 + Phaser.Math.Between(0, 240),
                onComplete: () => ember.destroy()
            });
        }
    },

    spawnRocketTrailSmoke(x, y, depth = 9226) {
        const puff = this.add.circle(x, y, Phaser.Math.Between(5, 10), 0xd5d8dd, 0.34).setDepth(depth);
        this.popupLayer.add(puff);
        this.tweens.add({
            targets: puff,
            y: y - Phaser.Math.Between(10, 24),
            scaleX: Phaser.Math.FloatBetween(1.6, 2.4),
            scaleY: Phaser.Math.FloatBetween(1.6, 2.4),
            alpha: 0,
            duration: 320 + Phaser.Math.Between(0, 180),
            onComplete: () => puff.destroy()
        });
    },

    setMachinePermanentDestroyedVisual(def, destroyed) {
        if (!def || !def.container) return;
        def.permaDestroyed = !!destroyed;
        this.setMachineBrokenVisual(def, false, 0);
        if (!def.destroyedFx) return;
        if (destroyed) {
            def.destroyedFx.setVisible(true);
            const smoky = def.destroyedFx.list.filter(Boolean);
            this.tweens.add({
                targets: smoky,
                alpha: 0.86,
                duration: 240,
                yoyo: true,
                repeat: -1
            });
        }
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

    getValueTierTextColor(value) {
        const amount = Math.max(0, value || 0);
        if (amount <= 20) return "#ffffff";
        if (amount <= 50) return "#c58cff";
        if (amount <= 100) return "#f1cb4a";
        return "#7cecff";
    },

    updatePillowValueText(item, color = "#ffffff") {
        if (!item || !item.container || item.destroyed || item.finished) return;
        const displayValue = item.eggMultSum > 0 ? item.currentValue : item.spentCost;
        const tierColor = this.getValueTierTextColor(displayValue);
        if (this.gameplayPaused) {
            item._queuedValueTextColor = tierColor || color || "#ffffff";
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
        const textObj = this.rebuildPillowValueText(item, this.formatMoneyValue(displayValue));
        if (!textObj) return;
        this.applySafeValueTextColor(textObj, item._queuedValueTextColor || tierColor || color || "#ffffff", false);
        item._queuedValueTextColor = null;
        textObj.setAlpha(item.eggMultSum > 0 ? 1 : 0);
    },

    flashValueText(item, flashColor) {
        if (!item || !item.valueText || item.eggMultSum <= 0) return;
        if (this.gameplayPaused) return;
        const baseColor = this.getValueTierTextColor(item.currentValue || item.spentCost || 0);
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

    ensureEggBoxWetFx(item) {
        if (!item || !item.container) return;
        if (item.wetFx && item.wetFx.length) return;
        item.wetFx = [];
        const wetParent = item.container._wetOverlay || item.container;

        const sheenEdge = this.add.ellipse(0, -10, 110, 56, 0xdff6ff, 0.10);
        const sheen = this.add.ellipse(0, -8, 96, 48, 0x66c9ff, 0.16);
        const drips = [
            { x: -34, y: -26, r: 8, h: 14 },
            { x: -10, y: -22, r: 7, h: 12 },
            { x: 16, y: -20, r: 8, h: 13 },
            { x: 38, y: -24, r: 7, h: 12 },
            { x: -22, y: -4, r: 8, h: 13 },
            { x: 10, y: -2, r: 7, h: 12 }
        ];

        wetParent.add([sheenEdge, sheen]);
        if (typeof wetParent.bringToTop === "function") {
            wetParent.bringToTop(sheenEdge);
            wetParent.bringToTop(sheen);
        }
        this.tweens.add({
            targets: [sheenEdge, sheen],
            alpha: 0.08,
            scaleX: 1.03,
            scaleY: 1.05,
            duration: 360,
            yoyo: true,
            repeat: -1
        });
        item.wetFx.push(sheenEdge, sheen);

        for (const p of drips) {
            const drop = this.add.circle(p.x, p.y, p.r, 0x66c9ff, 0.98);
            const shine = this.add.circle(p.x - 2, p.y - 2, Math.max(2, p.r * 0.32), 0xffffff, 0.62);
            const tail = this.add.ellipse(p.x, p.y + p.r + 8, Math.max(8, p.r * 0.82), p.h, 0x8cd9ff, 0.58);
            const tailShine = this.add.ellipse(p.x - 1, p.y + p.r + 6, Math.max(2.5, p.r * 0.2), Math.max(10, p.h * 0.55), 0xffffff, 0.24);
            wetParent.add([tail, tailShine, drop, shine]);
            if (typeof wetParent.bringToTop === "function") {
                wetParent.bringToTop(tail);
                wetParent.bringToTop(tailShine);
                wetParent.bringToTop(drop);
                wetParent.bringToTop(shine);
            }
            this.tweens.add({
                targets: [tail, tailShine, drop, shine],
                y: p.y - 2,
                x: p.x + Phaser.Math.Between(-2, 2),
                alpha: 0.82,
                scaleX: 0.94,
                scaleY: 1.12,
                yoyo: true,
                repeat: -1,
                duration: 300 + Phaser.Math.Between(0, 140)
            });
            item.wetFx.push(tail, tailShine, drop, shine);
        }

        if (item.container && item.container._wetOverlay && typeof item.container.bringToTop === "function") {
            item.container.bringToTop(item.container._wetOverlay);
        }
    },

    ensureWetFx(item) {
        if (item && item.eggsBox) {
            this.ensureEggBoxWetFx(item);
            return;
        }
        if (item.wetFx && item.wetFx.length) return;
        item.wetFx = [];
        const wetParent = item.container && item.container._wetOverlay
            ? item.container._wetOverlay
            : item.container;
        const hasMegaArmor = !item.eggsBox && (item.eggs || []).some(egg => egg && egg.megaArmored);

        const points = item.eggsBox
            ? [
                { x: -34, y: -8, r: 12 },
                { x: -12, y: -2, r: 11 },
                { x: 10, y: 4, r: 12 },
                { x: 30, y: -4, r: 12 },
                { x: -20, y: 18, r: 13 },
                { x: 8, y: 20, r: 12 }
            ]
            : (hasMegaArmor
                ? [
                    { x: -28, y: -42, r: 8 },
                    { x: -12, y: -48, r: 7 },
                    { x: 12, y: -47, r: 7 },
                    { x: 28, y: -42, r: 8 },
                    { x: 0, y: -54, r: 7 },
                    { x: -2, y: -28, r: 8 }
                ]
                : [
                    { x: -24, y: -34, r: 6 },
                    { x: -10, y: -39, r: 5 },
                    { x: 10, y: -38, r: 5 },
                    { x: 24, y: -34, r: 6 },
                    { x: 0, y: -43, r: 5 }
                ]);

        for (const p of points) {
            const d = this.add.circle(p.x, p.y, p.r, 0x66c9ff, 0.95);
            const shine = this.add.circle(p.x - 1.6, p.y - 1.8, Math.max(1.6, p.r * 0.32), 0xffffff, 0.55);
            const outline = (item.eggsBox || hasMegaArmor)
                ? this.add.circle(p.x, p.y, p.r + (item.eggsBox ? 2.8 : 1.8), 0xdff6ff, item.eggsBox ? 0.32 : 0.22)
                : null;
            const streak = null;
            const streakShine = null;
            const bead = null;
            if (outline) wetParent.add(outline);
            wetParent.add(d);
            wetParent.add(shine);
            if (outline && typeof wetParent.bringToTop === "function") wetParent.bringToTop(outline);
            if (typeof wetParent.bringToTop === "function") wetParent.bringToTop(d);
            if (typeof wetParent.bringToTop === "function") wetParent.bringToTop(shine);
            this.tweens.add({
                targets: outline ? [outline, d, shine] : [d, shine],
                y: p.y - (item.eggsBox ? 3 : 5),
                x: p.x + Phaser.Math.Between(-3, 3),
                alpha: item.eggsBox ? 0.92 : 0.62,
                scaleX: item.eggsBox ? 0.92 : 0.78,
                scaleY: item.eggsBox ? 1.34 : 1.22,
                yoyo: true,
                repeat: -1,
                duration: 360 + Phaser.Math.Between(0, 170)
            });
            if (outline) item.wetFx.push(outline);
            item.wetFx.push(d);
            item.wetFx.push(shine);
        }
        if (item.container && item.container._wetOverlay && typeof item.container.bringToTop === "function") {
            item.container.bringToTop(item.container._wetOverlay);
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
            const spray = this.add.rectangle(ox + (i - 1) * 10, oy - 38, 6, 54, 0x8de6ff, 0.48).setDepth(9302);
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
            const drop = this.add.circle(ox, oy, Phaser.Math.Between(3, 6), 0x57c3ff, 1).setDepth(9304);
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
            const streak = this.add.rectangle(ox, oy, 4, 22, 0x8ddcff, 0.8).setDepth(9303);
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

    spawnMachineTrailFx(def, x, y) {
        if (!def) return;
        if (def.type === "water") {
            const droplet = this.add.circle(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(-10, 10), Phaser.Math.Between(2, 4), 0xbdf6ff, 0.8).setDepth(5001);
            this.fxLayer.add(droplet);
            this.tweens.add({
                targets: droplet,
                x: droplet.x + Phaser.Math.Between(-12, 12),
                y: droplet.y + Phaser.Math.Between(8, 20),
                alpha: 0,
                duration: 140,
                onComplete: () => droplet.destroy()
            });
            return;
        }

        if (def.type === "fire") {
            const ember = this.add.circle(x + Phaser.Math.Between(-4, 4), y + Phaser.Math.Between(-8, 8), Phaser.Math.Between(2, 4), 0xffc36f, 0.9).setDepth(5001);
            this.fxLayer.add(ember);
            this.tweens.add({
                targets: ember,
                x: ember.x + Phaser.Math.Between(-14, 14),
                y: ember.y + Phaser.Math.Between(-10, 14),
                alpha: 0,
                scaleX: 0.4,
                scaleY: 0.4,
                duration: 130,
                onComplete: () => ember.destroy()
            });
            return;
        }

        if (def.rarity === "gold") {
            const star = this.add.star(x, y, 4, 1.4, 4.6, 0xfff4bd, 0.88).setDepth(5001);
            this.fxLayer.add(star);
            this.tweens.add({
                targets: star,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                angle: Phaser.Math.Between(-28, 28),
                duration: 150,
                onComplete: () => star.destroy()
            });
            return;
        }

        const spark = this.add.circle(x, y, 2.5, 0xbaffc8, 0.74).setDepth(5001);
        this.fxLayer.add(spark);
        this.tweens.add({
            targets: spark,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 120,
            onComplete: () => spark.destroy()
        });
    },

    spawnMachineImpactFx(def, x, y) {
        if (def && def.type === "water") {
            const mist = this.add.ellipse(x, y, 70, 34, 0xa7ecff, 0.38).setDepth(5099);
            const ring = this.add.ellipse(x, y, 48, 20, 0xe0fbff, 0.28).setDepth(5100);
            const splashCore = this.add.circle(x, y, 10, 0xffffff, 0.55).setDepth(5101);
            this.fxLayer.add([mist, ring, splashCore]);
            this.tweens.add({
                targets: [mist, ring],
                scaleX: 1.45,
                scaleY: 1.1,
                alpha: 0,
                duration: 240,
                onComplete: () => {
                    mist.destroy();
                    ring.destroy();
                }
            });
            this.tweens.add({
                targets: splashCore,
                scaleX: 2.8,
                scaleY: 2.8,
                alpha: 0,
                duration: 180,
                onComplete: () => splashCore.destroy()
            });
            this.spawnRadialSparkBurst(x, y, {
                count: 14,
                color: 0xd8fbff,
                colorAlt: 0x59b7ff,
                minSpeed: 38,
                maxSpeed: 112
            });
            return;
        }

        if (def && def.type === "fire") {
            const flash = this.add.ellipse(x, y, 60, 30, 0xff6c34, 0.42).setDepth(5100);
            const core = this.add.ellipse(x, y, 26, 16, 0xfff0a6, 0.78).setDepth(5101);
            const ring = this.add.ellipse(x, y, 44, 18, 0xffb05a, 0.3).setDepth(5099);
            this.fxLayer.add([ring, flash, core]);
            this.tweens.add({
                targets: [ring, flash, core],
                scaleX: 1.35,
                scaleY: 0.85,
                alpha: 0,
                duration: 180,
                onComplete: () => {
                    ring.destroy();
                    flash.destroy();
                    core.destroy();
                }
            });
            this.spawnRadialSparkBurst(x + 10, y, {
                count: 16,
                color: 0xfff0a6,
                colorAlt: 0xff7a38,
                minSpeed: 44,
                maxSpeed: 132
            });
            return;
        }

        if (def && def.rarity === "gold") {
            const flash = this.add.circle(x, y, 22, 0xffd85b, 0.34).setDepth(5100);
            const star = this.add.star(x, y, 7, 6, 16, 0xfff4bd, 0.74).setDepth(5101);
            const ring = this.add.ellipse(x, y, 56, 22, 0xffed95, 0.24).setDepth(5099);
            this.fxLayer.add([ring, flash, star]);
            this.tweens.add({
                targets: [flash, star, ring],
                scaleX: 2.6,
                scaleY: 2.6,
                alpha: 0,
                duration: 220,
                onComplete: () => {
                    flash.destroy();
                    star.destroy();
                    ring.destroy();
                }
            });
            this.spawnRadialSparkBurst(x, y, {
                count: 22,
                color: 0xffef9f,
                colorAlt: 0xd9a321,
                minSpeed: 56,
                maxSpeed: 176
            });
            return;
        }

        if (def && def.type === "mul") {
            const flash = this.add.ellipse(x, y, 58, 24, 0x7dff9c, 0.32).setDepth(5100);
            const ring = this.add.ellipse(x, y, 38, 14, 0xcfffd9, 0.24).setDepth(5101);
            this.fxLayer.add([flash, ring]);
            this.tweens.add({
                targets: [flash, ring],
                scaleX: 2.2,
                scaleY: 0.72,
                alpha: 0,
                duration: 150,
                onComplete: () => {
                    flash.destroy();
                    ring.destroy();
                }
            });
            this.spawnRadialSparkBurst(x, y, {
                count: 10,
                color: 0xb7ff9c,
                colorAlt: 0x39ff7a,
                minSpeed: 28,
                maxSpeed: 94
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
            const glow = this.add.ellipse(0, 0, 26, 64, 0xff5c31, 0.22);
            const ring = this.add.ellipse(0, 10, 20, 34, 0xffad52, 0.16);
            const body = this.add.ellipse(0, 0, 14, 46, 0xff7c2d, 0.96).setStrokeStyle(2, 0xfff0a6, 0.72);
            const core = this.add.ellipse(0, -6, 8, 22, 0xfff0ad, 0.92);
            const tailA = this.add.ellipse(-4, 10, 10, 20, 0xff4e23, 0.72);
            const tailB = this.add.ellipse(4, 12, 8, 18, 0xffa43d, 0.64);
            const spark = this.add.star(0, -24, 4, 1.8, 5.4, 0xfff4bc, 0.95);
            projectile.add([glow, ring, tailA, tailB, body, core, spark]);
            primary = body;
            this.tweens.add({
                targets: [body, core, tailA, tailB, spark],
                scaleX: 0.72,
                scaleY: 1.16,
                y: "-=8",
                duration: 110,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        } else if (def.type === "water") {
            const mist = this.add.ellipse(0, 0, 24, 44, 0x9ce8ff, 0.18);
            const streamA = this.add.rectangle(-5, 0, 4, 54, 0x8de6ff, 0.84);
            const streamB = this.add.rectangle(0, 0, 6, 58, 0xbdf6ff, 0.92);
            const streamC = this.add.rectangle(5, 0, 4, 50, 0x5ec3ff, 0.80);
            const crown = this.add.ellipse(0, -26, 16, 12, 0xffffff, 0.5);
            const head = this.add.circle(0, -28, 6, 0xe4fbff, 0.98);
            projectile.add([mist, streamA, streamB, streamC, crown, head]);
            primary = streamB;
            this.tweens.add({
                targets: [streamA, streamB, streamC, crown],
                alpha: 0.42,
                scaleY: 0.76,
                duration: 90,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        } else if (def.rarity === "gold") {
            const glow = this.add.ellipse(0, 0, 28, 68, 0xffd75c, 0.18);
            const ring = this.add.ellipse(0, 2, 22, 56, 0xfff0ad, 0.12);
            const beam = this.add.rectangle(0, 0, 14, 62, 0xffd84c, 0.96).setStrokeStyle(3, 0xfff5b8, 0.85);
            const core = this.add.rectangle(0, 0, 6, 64, 0xfff6be, 0.96);
            const head = this.add.star(0, -34, 4, 2.5, 7, 0xfff6be, 0.98);
            const flareA = this.add.star(-6, -10, 4, 1.3, 4.4, 0xffef9f, 0.88);
            const flareB = this.add.star(6, 10, 4, 1.3, 4.4, 0xffef9f, 0.72);
            projectile.add([glow, ring, beam, core, head, flareA, flareB]);
            primary = beam;
            this.tweens.add({
                targets: [glow, ring, beam, core, flareA, flareB],
                alpha: 0.58,
                duration: 100,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        } else {
            const glow = this.add.ellipse(0, 0, 26, 60, 0x56ff86, 0.16);
            const beam = this.add.rectangle(0, 0, 16, 60, 0x3aff77, 0.94).setStrokeStyle(3, 0xd8ffd8, 0.78);
            const core = this.add.rectangle(0, 0, 8, 62, 0xe6fff0, 0.90);
            const pulseA = this.add.circle(-5, -12, 3, 0xd9ffe7, 0.86);
            const pulseB = this.add.circle(5, 10, 2.6, 0x8dffb0, 0.76);
            projectile.add([glow, beam, core, pulseA, pulseB]);
            primary = beam;
            this.tweens.add({
                targets: [glow, beam, pulseA, pulseB],
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
            onUpdate: () => {
                if (Math.random() < 0.55) {
                    this.spawnMachineTrailFx(def, projectile.x, projectile.y);
                }
            },
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
