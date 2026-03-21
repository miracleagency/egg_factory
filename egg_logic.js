window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.logic = {
    chooseEggType() {
        const r = Math.random();
        let sum = 0;
        for (const egg of this.eggTypes) {
            sum += egg.chance;
            if (r <= sum) return egg;
        }
        return this.eggTypes[0];
    },

    getLineCenterBaseX(line) {
        return line.startX + line.slotWidth * 0.5;
    },

    getLineSlotCenterXAtClock(line, slotIndex, clock = this.speedClock) {
        return this.getLineCenterBaseX(line) + slotIndex * line.slotWidth + line.speed * line.dir * clock;
    },

    getNearestLineSlotIndex(line, x, clock = this.speedClock) {
        return Math.round((x - this.getLineCenterBaseX(line) - line.speed * line.dir * clock) / line.slotWidth);
    },

    isSlotOccupied(stage, slotIndex) {
        for (const item of this.travelItems) {
            if (item.destroyed || item.finished) continue;
            if (item.stage !== stage) continue;
            if (item.slotIndexLine === slotIndex) return true;
        }
        return false;
    },

    getLine1FirstVisibleSlotIndex() {
        return Math.ceil((-this.lines.line1.speed * this.speedClock) / this.lines.line1.slotWidth);
    },

    getAutoDropChance() {
        if (this.autoDropMode === 1) return 1;
        if (this.autoDropMode === 2) return 0.58;
        return 0;
    },

    handleAutoDrop() {
        if (this.autoDropMode === 0) return;

        const slotIndex = this.getLine1FirstVisibleSlotIndex();
        if (slotIndex === this.autoDropCheckSlot) return;
        this.autoDropCheckSlot = slotIndex;

        const selectedKeys = Array.isArray(this.autoDropSelectedKeys) ? this.autoDropSelectedKeys : [];
        if (selectedKeys.length === 0) return;

        const availableButtons = selectedKeys
            .map(key => this.pillowButtons && this.pillowButtons[key])
            .filter(Boolean);
        if (availableButtons.length === 0) return;
        if (Math.random() > this.getAutoDropChance()) return;

        const btn = this.autoDropMode === 2
            ? Phaser.Utils.Array.GetRandom(availableButtons)
            : availableButtons[0];
        this.placeLine1Pillow(btn._baseColor, btn._mult);
    },

    placeLine1Pillow(color, multiplier) {
        const slotIndex = this.getLine1FirstVisibleSlotIndex();
        const cost = this.bet * multiplier;
        if (this.balance < cost) return false;
        if (this.line1Pillows.has(slotIndex)) return false;

        const pillow = this.createTravelPillow(color, cost, multiplier, this.bet);
        pillow.slotIndex = slotIndex;
        pillow.stage = 1;

        this.line1Pillows.set(slotIndex, pillow);
        this.pillowLayer.add(pillow.container);

        this.balance -= cost;
        this.updatePillowButtonLabels();
        return true;
    },

    computeNextEggSpawnClock(dropXGetter, fromClock, first = false) {
        const line = this.lines.line1;
        const slotTravel = line.slotWidth / line.speed;
        const dropX = dropXGetter();
        const a = (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * fromClock) / line.slotWidth;
        let dt = (a - Math.floor(a)) * slotTravel;

        const minLead = first ? 0.34 : 0.22;
        while (dt < minLead) dt += slotTravel;

        dt += Phaser.Math.Between(3, 5) * slotTravel;
        return fromClock + dt;
    },

    fallDuration() {
        return (this.eggLandingY - this.eggStartY) / 1050;
    },

    spawnEgg(dropX, targetClock) {
        const line = this.lines.line1;
        const slotIndex = Math.round(
            (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * targetClock) / line.slotWidth
        );
        const eggType = this.chooseEggType();
        const visual = this.createEggVisual(eggType, true);

        visual.slotIndexAtLanding = slotIndex;
        visual.spawnClock = targetClock - this.fallDuration();
        visual.state = "falling";
        visual.typeData = eggType;
        visual.container.x = dropX;
        visual.container.y = this.eggStartY;

        this.eggLayer.add(visual.container);
        this.fallingEggs.push(visual);
    },

    handleEggSpawns() {
        while (this.speedClock >= this.nextEggSpawnA - this.fallDuration()) {
            this.spawnEgg(this.dropperAX, this.nextEggSpawnA);
            this.nextEggSpawnA = this.computeNextEggSpawnClock(() => this.dropperAX, this.nextEggSpawnA);
        }

        while (this.speedClock >= this.nextEggSpawnB - this.fallDuration()) {
            this.spawnEgg(this.dropperBX, this.nextEggSpawnB);
            this.nextEggSpawnB = this.computeNextEggSpawnClock(() => this.dropperBX, this.nextEggSpawnB);
        }
    },

    updateFallingEggs() {
        const duration = this.fallDuration();

        for (const egg of this.fallingEggs) {
            if (egg.state !== "falling") continue;
            const p = Phaser.Math.Clamp((this.speedClock - egg.spawnClock) / duration, 0, 1);
            egg.container.y = Phaser.Math.Linear(this.eggStartY, this.eggLandingY, p);

            if (p < 1) continue;
            const pillow = this.line1Pillows.get(egg.slotIndexAtLanding);

            if (pillow) {
                egg.state = "saved";
                const eggData = { ...egg.typeData };
                if (eggData.bomb) eggData.bombLit = true;
                pillow.eggs.push(eggData);
                pillow.eggMultSum += eggData.mult;
                pillow.currentValue += pillow.spentCost * eggData.mult;
                if (egg.typeData.armored) {
                    pillow.armored = true;
                    pillow.permanentTextColor = "#d8e3ef";
                }
                egg.container.removeFromDisplayList();
                pillow.container.add(egg.container);

                if (pillow.eggs.length === 1) {
                    egg.container.x = 0;
                } else {
                    const prevEggContainer = pillow.container.list[pillow.container.length - 2];
                    prevEggContainer.x = -10;
                    egg.container.x = 10;
                }

                egg.container.y = -26;
                egg.container._eggTypeData = eggData;
                if (eggData.bomb) {
                    this.setBombVisualState(egg.container, true);
                }
                this.updatePillowValueText(pillow);
            } else {
                egg.state = "dead";
                this.spawnEggSplatFx(
                    egg.container.x,
                    this.eggLandingY - 8,
                    this.lines.line1.y + this.lines.line1.h * 0.5 - 6
                );
                this.tweens.add({
                    targets: egg.container,
                    alpha: 0,
                    y: egg.container.y + 16,
                    duration: 150,
                    onComplete: () => egg.container.destroy()
                });
            }
        }

        this.fallingEggs = this.fallingEggs.filter(e => e.state === "falling");
    },

    updateLine1Items() {
        const line = this.lines.line1;
        const toDelete = [];

        this.line1Pillows.forEach((pillow, slotIndex) => {
            const x = line.startX + line.slotWidth * 0.5 + slotIndex * line.slotWidth + line.speed * this.speedClock;
            const y = line.y + line.h * 0.5 - 10;
            pillow.container.x = x;
            pillow.container.y = y;

            if (x >= this.transferRightFromX && pillow.eggs.length > 0) {
                this.moveItemToLine2(pillow);
                toDelete.push(slotIndex);
            } else if (x >= line.endX + line.slotWidth * 1.5) {
                if (!pillow.settled && pillow.eggs.length === 0) {
                    this.addLose(pillow.spentCost || 0);
                    pillow.settled = true;
                }
                pillow.container.destroy();
                toDelete.push(slotIndex);
            }
        });

        for (const key of toDelete) {
            this.line1Pillows.delete(key);
        }
    },

    moveItemToLine2(pillow) {
        pillow.stage = 121;
        pillow.x = this.transferRightFromX;
        pillow.y = this.lines.line1.y + this.lines.line1.h * 0.5 - 10;
        pillow.transferTargetX = this.transferRightToX;
        pillow.transferTargetY = this.lines.line2.y + this.lines.line2.h * 0.5 - 10;
        pillow.queueId = ++this.transferQueueSeq;
        pillow.queueLane = "right";
        pillow.container.x = pillow.x;
        pillow.container.y = pillow.y;
        this.travelItems.push(pillow);
    },

    moveItemToLine3(item) {
        item.stage = 231;
        item.x = this.transferLeftFromX;
        item.y = this.lines.line2.y + this.lines.line2.h * 0.5 - 10;
        item.transferTargetX = this.transferLeftToX;
        item.transferTargetY = this.lines.line3.y + this.lines.line3.h * 0.5 - 10;
        item.queueId = ++this.transferQueueSeq;
        item.queueLane = "left";
        item.container.x = item.x;
        item.container.y = item.y;
    },

    computeNextMachineImpactClock(def, line, stage, fromClock, first = false) {
        const slotTravel = line.slotWidth / line.speed;
        const baseX = line.startX + line.slotWidth * 0.5;
        const signedSpeed = line.speed * line.dir;
        const a = (def.container.x - baseX - signedSpeed * fromClock) / line.slotWidth;
        const frac = a - Math.floor(a);
        let dt = line.dir === 1 ? frac * slotTravel : ((1 - frac) % 1) * slotTravel;

        const minLead = first ? 0.14 : 0.05;
        while (dt < minLead) dt += slotTravel;

        let minSkip = 1;
        let maxSkip = 3;
        if (def.type === "mul" && def.value === 2) {
            minSkip = 0;
            maxSkip = 2;
        } else if (def.type === "half") {
            maxSkip = 2;
        } else if (def.type === "crush") {
            minSkip = 0;
            maxSkip = 1;
        } else if (def.type === "water") {
            maxSkip = 4;
        } else if (def.type === "fire") {
            minSkip = 0;
            maxSkip = 1;
        } else if (def.rarity === "gold") {
            minSkip = def.fastGold ? 5 : 6;
            maxSkip = def.fastGold ? 11 : 13;
        }

        dt += Phaser.Math.Between(minSkip, maxSkip) * slotTravel;
        return fromClock + dt;
    },

    getMachineFlightTime(def, line) {
        const startY = def.container.y + 36;
        const endY = line.y + line.h * 0.5 - 6;
        return Math.max(0.17, (endY - startY) / 1050);
    },

    getStageItems(stage) {
        if (stage === 1) {
            const items = [];
            this.line1Pillows.forEach((pillow, slotIndex) => {
                if (pillow.destroyed || pillow.finished) return;
                pillow.slotIndexLine = slotIndex;
                pillow.stage = 1;
                items.push(pillow);
            });
            return items;
        }
        return this.travelItems.filter(item => !item.destroyed && !item.finished && item.stage === stage);
    },

    getEggTypeByKey(key) {
        return (this.eggTypes || []).find(egg => egg.key === key) || null;
    },

    getAllActiveItems() {
        const items = [];
        this.line1Pillows.forEach(item => {
            if (!item.destroyed && !item.finished) items.push(item);
        });
        for (const item of this.travelItems) {
            if (!item.destroyed && !item.finished) items.push(item);
        }
        return items;
    },

    getMysteryEligibleItems() {
        return this.getAllActiveItems().filter(item => item.eggs && item.eggs.length > 0);
    },

    getMysteryEligibleMachines() {
        return [...this.line1Machines, ...this.line2Machines, ...this.line3Machines]
            .filter(def => def && def.container && (def.type === "fire" || def.type === "crush"));
    },

    getPlayableTweens() {
        const manager = this.tweens;
        if (!manager) return [];

        let tweens = [];
        if (typeof manager.getTweens === "function") {
            tweens = manager.getTweens();
        } else {
            const buckets = [manager._active, manager._pending, manager._add];
            for (const bucket of buckets) {
                if (Array.isArray(bucket)) tweens.push(...bucket);
            }
        }

        return tweens.filter((tween, index, list) => {
            if (!tween) return false;
            if (list.indexOf(tween) !== index) return false;
            if (typeof tween.isPlaying === "function") return tween.isPlaying();
            return tween.isPlaying === true || tween.paused === false;
        });
    },

    destroyDisplayObjectSafe(obj) {
        if (!obj) return;

        if (obj.list && Array.isArray(obj.list)) {
            for (const child of obj.list.slice()) {
                this.destroyDisplayObjectSafe(child);
            }
        }

        this.detachPausedTweensForTarget(obj);

        if (this.tweens && typeof this.tweens.killTweensOf === "function") {
            this.tweens.killTweensOf(obj);
        }

        if (obj.destroy && obj.scene) {
            obj.destroy();
        }
    },

    stopDisplayObjectTweens(obj) {
        if (!obj) return;
        if (obj.list && Array.isArray(obj.list)) {
            for (const child of obj.list.slice()) {
                this.stopDisplayObjectTweens(child);
            }
        }
        this.detachPausedTweensForTarget(obj);
        if (this.tweens && typeof this.tweens.killTweensOf === "function") {
            this.tweens.killTweensOf(obj);
        }
    },

    detachPausedTweensForTarget(target) {
        if (!target || !Array.isArray(this.gameplayPausedTweens)) return;
        this.gameplayPausedTweens = this.gameplayPausedTweens.filter(tween => !this.tweenHasTarget(tween, target));
    },

    tweenHasTarget(tween, target) {
        if (!tween || !target) return false;
        const entries = Array.isArray(tween.data) ? tween.data : [];
        return entries.some(entry => entry && entry.target === target);
    },

    canResumeTweenSafely(tween) {
        if (!tween) return false;
        const entries = Array.isArray(tween.data) ? tween.data : [];
        if (entries.length === 0) return false;
        return entries.every(entry => {
            const target = entry && entry.target;
            if (!target) return false;
            return !!target.scene && !target.destroyed;
        });
    },

    beginGameplayPause(focusContainers = []) {
        if (this.gameplayPaused) return;
        this.gameplayPaused = true;
        this.gameplayPauseStartedAt = this.time.now;

        this.gameplayFocusOverlay = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.4)
            .setOrigin(0, 0)
            .setDepth(9050);
        this.popupLayer.add(this.gameplayFocusOverlay);

        this.gameplayFocusTargets = focusContainers.filter(Boolean);
    },

    endGameplayPause() {
        const elapsed = Math.max(0, this.time.now - (this.gameplayPauseStartedAt || this.time.now));

        for (const def of [...this.line1Machines, ...this.line2Machines, ...this.line3Machines]) {
            if (!def || !def.brokenUntil) continue;
            def.brokenUntil += elapsed;
            if (def.brokenStartedAt) def.brokenStartedAt += elapsed;
        }

        this.gameplayFocusTargets = [];

        if (this.gameplayFocusOverlay) {
            this.gameplayFocusOverlay.destroy();
            this.gameplayFocusOverlay = null;
        }
        this.gameplayPaused = false;
        this.gameplayPauseStartedAt = 0;
        this.lastTime = this.time.now;
    },

    animateMysteryTransformItem(item, mapEgg, flashColor) {
        if (!item || item.destroyed || item.finished || !item.eggs || item.eggs.length === 0) return;
        const baseY = typeof item.y === "number" ? item.y : item.container.y;
        const nextEggs = item.eggs.map((egg, index) => mapEgg({ ...egg }, item, index)).filter(Boolean);
        item.eggs = nextEggs;
        item.armored = nextEggs.some(egg => egg.armored);
        this.flashValueText(item, flashColor);
        this.pulseItem(item);
        this.tweens.add({
            targets: item.container,
            y: baseY - 12,
            scaleX: 1.14,
            scaleY: 1.14,
            duration: 150,
            ease: "Back.Out",
            yoyo: true,
            onComplete: () => {
                item.container.y = baseY;
                item.container.setScale(1);
            }
        });
    },

    applyMysteryItemStateVisual(item, state) {
        if (!item || !item.body) return;

        if (item.transformBadge) {
            this.stopDisplayObjectTweens(item.transformBadge);
            this.destroyDisplayObjectSafe(item.transformBadge);
            item.transformBadge = null;
        }

        if (state === "armored") {
            item.body.setFillStyle(0x97a3b0, 1).setStrokeStyle(4, 0xe4edf6);
            const badge = this.add.container(0, -2);
            const plate = this.add.rectangle(0, 0, 26, 18, 0x6e7883, 0.95).setStrokeStyle(2, 0xdce4ee, 0.9);
            const rivetA = this.add.circle(-8, 0, 2, 0xf3f7fb, 1);
            const rivetB = this.add.circle(8, 0, 2, 0xf3f7fb, 1);
            badge.add([plate, rivetA, rivetB]);
            item.container.add(badge);
            item.transformBadge = badge;
            this.spawnImpactFx(item.container.x, item.container.y - 8, 0xc8d0db);
        } else if (state === "gold") {
            item.body.setFillStyle(0xe0bd38, 1).setStrokeStyle(4, 0xffef9a);
            const badge = this.add.container(0, -2);
            const glow = this.add.ellipse(0, 0, 32, 22, 0xffdb58, 0.18);
            const crown = this.add.star(0, 0, 5, 4, 8, 0xffef9a, 0.96).setStrokeStyle(2, 0xffffff, 0.8);
            badge.add([glow, crown]);
            item.container.add(badge);
            item.transformBadge = badge;
            this.tweens.add({
                targets: [glow, crown],
                scaleX: 1.18,
                scaleY: 1.18,
                alpha: 0.68,
                duration: 220,
                yoyo: true,
                repeat: -1
            });
            this.spawnImpactFx(item.container.x, item.container.y - 8, 0xffd54b);
        } else {
            item.body.setFillStyle(item.baseColor, 1).setStrokeStyle(4, 0xffffff);
        }
    },

    runMysterySequence(config) {
        const focusContainers = (config.focusItems || []).map(item => item.container)
            .concat((config.focusMachines || []).map(def => def.container));
        this.beginGameplayPause(focusContainers);
        this.spawnMysteryBonusText(config.title, config.textColor, config.accent);

        const steps = config.steps || [];
        let index = 0;
        const runNext = () => {
            if (index >= steps.length) {
                this.time.delayedCall(config.finishDelay || 440, () => this.endGameplayPause());
                return;
            }
            const step = steps[index++];
            if (typeof step === "function") step();
            this.time.delayedCall(config.stepDelay || 120, runNext);
        };
        this.time.delayedCall(config.startDelay || 180, runNext);
    },

    setItemEggs(item, eggs) {
        if (!item || !item.container) return;

        for (const child of item.container.list.slice()) {
            if (child && child._eggTypeData) this.destroyDisplayObjectSafe(child);
        }

        item.eggs = eggs;
        item.armored = eggs.some(egg => egg.armored);

        const positions = eggs.length <= 1
            ? [0]
            : eggs.map((_, index) => (index === 0 ? -10 : 10));

        eggs.forEach((eggData, index) => {
            const visual = this.createEggVisual(eggData, false, { disableAmbientFx: this.gameplayPaused });
            visual.container.x = positions[index] || 0;
            visual.container.y = -26;
            visual.container._eggTypeData = eggData;
            if (eggData.bomb) this.setBombVisualState(visual.container, eggData.bombLit !== false);
            item.container.add(visual.container);
        });
    },

    transformAllEggs(mapper) {
        for (const item of this.getAllActiveItems()) {
            if (!item.eggs || item.eggs.length === 0) continue;
            const nextEggs = item.eggs.map((egg, index) => mapper({ ...egg }, item, index)).filter(Boolean);
            this.setItemEggs(item, nextEggs);
            this.pulseItem(item);
        }
    },

    triggerMysteryCrushBonus(triggerItem) {
        const rewardIndex = Phaser.Math.Between(0, 2);
        const armoredBase = this.getEggTypeByKey("armored");
        const goldBase = this.getEggTypeByKey("gold");
        const activeItems = this.getMysteryEligibleItems();
        const dangerMachines = this.getMysteryEligibleMachines();

        if (rewardIndex === 0 && armoredBase) {
            const steps = activeItems
                .slice()
                .sort((a, b) => a.y - b.y)
                .map(item => () => {
                    this.animateMysteryTransformItem(item, egg => ({
                        ...egg,
                        key: armoredBase.key,
                        label: armoredBase.label,
                        color: armoredBase.color,
                        stroke: armoredBase.stroke,
                        armored: true,
                        bomb: false,
                        bombLit: false,
                        goldFx: false,
                        diamondFx: false,
                        mysteryFx: false
                    }), "#d8e3ef");
                    item.armored = true;
                    item.permanentTextColor = "#d8e3ef";
                    this.updatePillowValueText(item);
                    this.applyMysteryItemStateVisual(item, "armored");
                });

            this.runMysterySequence({
                title: "IRON SHELL",
                textColor: "#eef6ff",
                accent: 0xbecddd,
                focusItems: activeItems,
                steps,
                stepDelay: 120,
                finishDelay: 420
            });
            return;
        }

        if (rewardIndex === 1 && goldBase) {
            const steps = activeItems
                .slice()
                .sort((a, b) => a.y - b.y)
                .map(item => () => {
                    this.animateMysteryTransformItem(item, egg => ({
                        ...egg,
                        key: goldBase.key,
                        label: goldBase.label,
                        color: goldBase.color,
                        stroke: goldBase.stroke,
                        mult: (egg.mult || 0) * 10,
                        armored: false,
                        bomb: false,
                        bombLit: false,
                        goldFx: true,
                        diamondFx: false,
                        mysteryFx: false
                    }), "#fff2a3");
                    item.armored = false;
                    item.eggMultSum *= 10;
                    item.currentValue *= 10;
                    item.permanentTextColor = "#f1cb4a";
                    this.updatePillowValueText(item);
                    this.applyMysteryItemStateVisual(item, "gold");
                });

            this.runMysterySequence({
                title: "GOLD RUSH x10",
                textColor: "#fff2a3",
                accent: 0xf0cb4e,
                focusItems: activeItems,
                steps,
                stepDelay: 120,
                finishDelay: 460
            });
            return;
        }

        const steps = dangerMachines
            .slice()
            .sort((a, b) => (a.container.y - b.container.y) || (a.container.x - b.container.x))
            .map(def => () => {
                this.spawnBombExplosionFx(def.container.x, def.container.y - 8);
                this.breakMachine(def, 10000);
                this.tweens.add({
                    targets: def.container,
                    scaleX: def.container.scaleX * 1.06,
                    scaleY: def.container.scaleY * 1.08,
                    duration: 140,
                    yoyo: true
                });
            });

        this.runMysterySequence({
            title: "MACHINE MELTDOWN",
            textColor: "#ffd4c8",
            accent: 0xff7d5d,
            focusMachines: dangerMachines,
            steps,
            stepDelay: 160,
            finishDelay: 520
        });
    },

    maybeFireMachine(def, line, stage) {
        if (def.brokenUntil && this.time.now < def.brokenUntil) return;

        const schedule = (fromClock, first) => {
            const flight = this.getMachineFlightTime(def, line);
            const impact = this.computeNextMachineImpactClock(def, line, stage, fromClock + flight, first);
            const desync = (def.type === "fire" && stage === 3) ? def.shotDesync : 0;
            def.nextShot = impact - flight + desync;
            def.nextImpact = impact;
            def.flightTime = flight;
        };

        if (!def.nextShot || def.nextShot < this.speedClock - 5) schedule(this.speedClock, true);
        if (this.speedClock < def.nextShot) return;

        if (def.type === "fire" && stage === 3 && Math.random() < def.fireSkipChance) {
            const delay = Phaser.Math.FloatBetween(0.06, 0.48) * def.fireChaosJitter;
            schedule(this.speedClock + delay, false);
            return;
        }

        if (def.type === "crush") {
            this.spawnCrusherAttack(def, line, stage, def.nextImpact);
        } else {
            this.spawnVerticalProjectile(def, line, stage, def.nextImpact, def.flightTime);
        }
        schedule(def.nextImpact, false);
    },

    spawnCrusherAttack(def, line, stage, impactClock) {
        const centerIndex = this.getNearestLineSlotIndex(line, def.container.x, impactClock);
        const targetX = def.container.x;
        const targetY = line.y + line.h * 0.5 - 10;
        const startY = def.container.y + 38;

        const press = this.add.container(targetX, startY).setDepth(5050);
        const top = this.add.rectangle(0, -18, 74, 16, 0x66584f, 1).setStrokeStyle(3, 0xd7c0ab);
        const shaft = this.add.rectangle(0, 0, 18, 42, 0x918175, 1).setStrokeStyle(2, 0xe3d0ba);
        const head = this.add.rectangle(0, 28, 96, 26, 0xa38f7f, 1).setStrokeStyle(4, 0xf0dcc4);
        press.add([shaft, top, head]);
        this.fxLayer.add(press);

        this.tweens.add({
            targets: press,
            y: targetY - 4,
            duration: 180,
            ease: "Quad.In",
            onComplete: () => {
                const items = this.getStageItems(stage);
                const item = items.find(entry => entry.slotIndexLine === centerIndex)
                    || items.find(entry => Math.abs(entry.x - targetX) <= line.slotWidth * 0.28);

                if (item) this.applyMachineEffect(def, item);
                this.spawnCrushFx(targetX, targetY);

                this.tweens.add({
                    targets: press,
                    y: startY,
                    alpha: 0,
                    duration: 140,
                    ease: "Quad.Out",
                    onComplete: () => press.destroy()
                });
            }
        });
    },

    spawnVerticalProjectile(def, line, stage, impactClock, flightTime) {
        const startX = def.container.x;
        const startY = def.container.y + 36;
        const centerIndex = this.getNearestLineSlotIndex(line, startX, impactClock);
        const endX = this.getLineSlotCenterXAtClock(line, centerIndex, impactClock);
        const endY = line.y + line.h * 0.5 - 6;
        const travelDuration = Math.round((flightTime || this.getMachineFlightTime(def, line)) * 1000);

        let color = 0xaab7c8;
        if (def.type === "water") color = 0x59b7ff;
        else if (def.type === "fire") color = 0xe34932;
        else if (def.rarity === "gold") color = 0xe3cf47;

        const shot = this.add.rectangle(startX, startY, 14, 14, color, 1)
            .setStrokeStyle(2, 0xffffff, 0.55)
            .setDepth(5000);
        this.fxLayer.add(shot);

        this.tweens.add({
            targets: shot,
            x: endX,
            y: endY,
            duration: travelDuration,
            angle: 180,
            ease: "Sine.In",
            onComplete: () => {
                const items = this.getStageItems(stage);
                const item = items.find(entry => entry.slotIndexLine === centerIndex)
                    || items.find(entry => Math.abs(entry.x - endX) <= line.slotWidth * 0.28);
                shot.destroy();
                if (item) this.applyMachineEffect(def, item);
                this.spawnImpactFx(endX, endY, color);
            }
        });
    },

    applyMachineEffect(def, item) {
        if (item.destroyed || item.finished) return;

        const bombEggs = (item.eggs || []).filter(egg => egg.bomb);
        const litBombEggs = bombEggs.filter(egg => egg.bombLit !== false);
        const mysteryEggs = (item.eggs || []).filter(egg => egg.key === "mystery");

        if (def.type === "water") {
            item.wet = true;
            for (const egg of bombEggs) {
                egg.bombLit = false;
            }
            for (const child of item.container.list) {
                if (child && child._eggTypeData && child._eggTypeData.bomb) {
                    child._eggTypeData.bombLit = false;
                    this.setBombVisualState(child, false);
                }
            }
            this.ensureWetFx(item);
            this.flashValueText(item, "#7fc8ff");
            this.spawnWaterEggSplash(item);
            this.pulseItem(item);
            return;
        }

        if (def.type === "half") {
            if (item.eggMultSum <= 0) return;
            item.eggMultSum *= 0.5;
            item.currentValue = Math.max(1, item.currentValue * 0.5);
            this.updatePillowValueText(item);
            this.flashValueText(item, "#ff6d6d");
            this.pulseItem(item);
            return;
        }

        if (def.type === "mul") {
            if (item.eggMultSum <= 0) return;
            item.eggMultSum *= def.value;
            item.currentValue *= def.value;
            if (def.rarity === "gold") item.permanentTextColor = "#f1cb4a";
            this.updatePillowValueText(item);
            this.flashValueText(item, def.rarity === "gold" ? "#fff2a3" : "#7dff9c");
            this.pulseItem(item);
            return;
        }

        if (def.type === "fire") {
            if (item.wet) {
                item.wet = false;
                for (const egg of bombEggs) {
                    egg.bombLit = true;
                }
                for (const child of item.container.list) {
                    if (child && child._eggTypeData && child._eggTypeData.bomb) {
                        child._eggTypeData.bombLit = true;
                        this.setBombVisualState(child, true);
                    }
                }
                this.clearWetFx(item);
                this.updatePillowValueText(item);
                this.spawnImpactFx(item.container.x, item.container.y - 4, 0x59b7ff);
                this.spawnDryFx(item);
                this.pulseItem(item);
                return;
            }

            if (litBombEggs.length > 0) {
                this.breakMachine(def);
                item.destroyed = true;
                this.clearWetFx(item);
                if (!item.settled) {
                    this.addLose(item.spentCost || 0);
                    item.settled = true;
                }
                this.spawnBombExplosionFx(item.container.x, item.container.y - 10);
                this.tweens.add({
                    targets: item.container,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => item.container.destroy()
                });
                return;
            }

            const armoredEggs = (item.eggs || []).filter(egg => egg.armored);
            const vulnerableEggs = (item.eggs || []).filter(egg => !egg.armored);

            if (armoredEggs.length > 0 && vulnerableEggs.length === 0) {
                this.flashValueText(item, "#d8e3ef");
                this.spawnImpactFx(item.container.x, item.container.y - 6, 0xc8d0db);
                this.pulseItem(item);
                return;
            }

            if (armoredEggs.length > 0 && vulnerableEggs.length > 0) {
                item.eggs = armoredEggs;
                item.armored = true;
                item.eggMultSum *= 0.5;
                item.currentValue = Math.max(1, item.currentValue * 0.5);
                item.permanentTextColor = "#d8e3ef";

                const remainingEggContainers = [];
                for (const child of item.container.list.slice()) {
                    if (!child || !child._eggTypeData) continue;
                    if (child._eggTypeData.armored) {
                        remainingEggContainers.push(child);
                        continue;
                    }
                    this.destroyDisplayObjectSafe(child);
                }

                if (remainingEggContainers.length === 1) {
                    remainingEggContainers[0].x = 0;
                } else if (remainingEggContainers.length > 1) {
                    remainingEggContainers.forEach((entry, index) => {
                        entry.x = index === 0 ? -10 : 10;
                    });
                }

                this.updatePillowValueText(item);
                this.flashValueText(item, "#ffb36b");
                this.spawnImpactFx(item.container.x, item.container.y - 6, 0xff7a45);
                this.pulseItem(item);
                return;
            }

            item.destroyed = true;
            this.clearWetFx(item);
            if (!item.settled) {
                this.addLose(item.spentCost || 0);
                item.settled = true;
            }

            const fire = this.add.circle(item.container.x, item.container.y - 8, 34, 0xff5b39, 0.35).setDepth(5100);
            this.fxLayer.add(fire);
            this.tweens.add({
                targets: item.container,
                alpha: 0,
                angle: 15,
                duration: 220,
                onComplete: () => item.container.destroy()
            });
            this.tweens.add({
                targets: fire,
                scaleX: 2.4,
                scaleY: 2.4,
                alpha: 0,
                duration: 220,
                onComplete: () => fire.destroy()
            });
        }

        if (def.type === "crush") {
            if (mysteryEggs.length > 0) {
                if (litBombEggs.length > 0) {
                    this.breakMachine(def);
                    this.spawnBombExplosionFx(item.container.x, item.container.y - 8);
                }
                this.triggerMysteryCrushBonus(item);
                item.destroyed = true;
                item.armored = false;
                this.clearWetFx(item);
                if (!item.settled) {
                    this.addLose(item.spentCost || 0);
                    item.settled = true;
                }

                this.spawnCrushFx(item.container.x, item.container.y - 4);
                this.tweens.add({
                    targets: item.container,
                    scaleY: 0.18,
                    scaleX: 1.42,
                    alpha: 0,
                    duration: 180,
                    ease: "Quad.In",
                    onComplete: () => item.container.destroy()
                });
                return;
            }

            if (litBombEggs.length > 0) {
                this.breakMachine(def);
                item.destroyed = true;
                this.clearWetFx(item);
                if (!item.settled) {
                    this.addLose(item.spentCost || 0);
                    item.settled = true;
                }
                this.spawnBombExplosionFx(item.container.x, item.container.y - 8);
                this.tweens.add({
                    targets: item.container,
                    scaleY: 0.18,
                    scaleX: 1.48,
                    alpha: 0,
                    duration: 170,
                    ease: "Quad.In",
                    onComplete: () => item.container.destroy()
                });
                return;
            }

            item.destroyed = true;
            item.armored = false;
            this.clearWetFx(item);
            if (!item.settled) {
                this.addLose(item.spentCost || 0);
                item.settled = true;
            }

            this.tweens.add({
                targets: item.container,
                scaleY: 0.18,
                scaleX: 1.28,
                alpha: 0,
                duration: 170,
                ease: "Quad.In",
                onComplete: () => item.container.destroy()
            });
            return;
        }
    },

    breakMachine(def, repairDurationMs = 20000) {
        if (!def) return;
        const baseDurationMs = repairDurationMs;
        const turbo = Math.max(0.01, this.getTurboMultiplier ? this.getTurboMultiplier() : 1);
        const slowestTurbo = Math.min(...(this.turboValues || [1]));
        const actualDurationMs = baseDurationMs * (slowestTurbo / turbo);
        const displaySeconds = baseDurationMs / 1000;
        def.brokenUntil = this.time.now + actualDurationMs;
        def.brokenStartedAt = this.time.now;
        def.brokenDurationMs = actualDurationMs;
        def.brokenDisplaySeconds = displaySeconds;
        def.nextShot = 0;
        def.nextImpact = 0;
        this.setMachineBrokenVisual(def, true, displaySeconds);
        if (def.hammerTween) {
            this.tweens.killTweensOf(def.hammer);
            def.hammerTween = null;
        }
        def.hammer.y = -42;
        def.hammer.angle = -12;
        def.hammerTween = this.tweens.add({
            targets: def.hammer,
            angle: 22,
            y: -26,
            duration: 180,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1,
            onYoyo: () => this.spawnMachineRepairSparks(def)
        });
    },

    updateBrokenMachines(machineDefs) {
        for (const def of machineDefs) {
            if (!def.brokenUntil) continue;
            const msLeft = def.brokenUntil - this.time.now;
            if (msLeft <= 0) {
                def.brokenUntil = 0;
                def.brokenStartedAt = 0;
                def.brokenDurationMs = 0;
                def.brokenDisplaySeconds = 0;
                if (def.hammerTween) {
                    this.tweens.killTweensOf(def.hammer);
                    def.hammerTween = null;
                }
                def.hammer.setVisible(false);
                def.hammer.angle = 0;
                def.hammer.y = -42;
                this.setMachineBrokenVisual(def, false, 0);
                continue;
            }
            const duration = Math.max(1, def.brokenDurationMs || 20000);
            const displaySeconds = def.brokenDisplaySeconds || (duration / 1000);
            const secondsVisual = displaySeconds * (msLeft / duration);
            this.setMachineBrokenVisual(def, true, secondsVisual);
        }
    },

    breakMachinesByTypes(types) {
        const match = new Set(types);
        const allDefs = [...this.line1Machines, ...this.line2Machines, ...this.line3Machines];
        for (const def of allDefs) {
            if (match.has(def.type)) {
                this.breakMachine(def);
            }
        }
    },

    handleMachineLogic() {
        this.updateBrokenMachines(this.line1Machines);
        this.updateBrokenMachines(this.line2Machines);
        this.updateBrokenMachines(this.line3Machines);
        for (const def of this.line1Machines) this.maybeFireMachine(def, this.lines.line1, 1);
        for (const def of this.line2Machines) this.maybeFireMachine(def, this.lines.line2, 2);
        for (const def of this.line3Machines) this.maybeFireMachine(def, this.lines.line3, 3);
    },

    isLiftBusy(lane) {
        const activeStages = lane === "right" ? [12, 122] : [23, 232];
        return this.travelItems.some(item => !item.destroyed && !item.finished && activeStages.includes(item.stage));
    },

    isFirstInLiftQueue(item, lane) {
        const waitStage = lane === "right" ? 121 : 231;
        let minId = Infinity;
        for (const t of this.travelItems) {
            if (t.destroyed || t.finished || t.stage !== waitStage) continue;
            minId = Math.min(minId, t.queueId || Infinity);
        }
        return (item.queueId || Infinity) === minId;
    },

    stepTransferItem(item, dt, speed) {
        const dx = item.transferTargetX - item.x;
        const dy = item.transferTargetY - item.y;
        const dist = Math.hypot(dx, dy);
        const step = speed * dt;

        if (dist <= step || dist < 0.5) {
            item.x = item.transferTargetX;
            item.y = item.transferTargetY;
            return true;
        }

        const k = step / dist;
        item.x += dx * k;
        item.y += dy * k;
        return false;
    },

    getLiftCaptureTolerance(line, dt) {
        return Math.max(1.2, (line.speed || 0) * dt * 1.6);
    },

    updateTravelItems(dt) {
        const alive = [];
        const transferSpeed = 520 * this.getTurboMultiplier();

        for (const item of this.travelItems) {
            if (item.destroyed || item.finished) continue;

            if (item.stage === 121) {
                if (!this.isLiftBusy("right") && this.isFirstInLiftQueue(item, "right")) {
                    item.stage = 12;
                } else {
                    const order = Math.max(0, this.travelItems.filter(t => !t.destroyed && !t.finished && t.stage === 121 && (t.queueId || 0) < (item.queueId || 0)).length);
                    item.x = this.transferRightFromX;
                    item.y = this.lines.line1.y + this.lines.line1.h * 0.5 - 10 + order * 20;
                    item.container.x = item.x;
                    item.container.y = item.y;
                    alive.push(item);
                    continue;
                }
            }

            if (item.stage === 12) {
                const arrived = this.stepTransferItem(item, dt, transferSpeed);
                item.container.x = item.x;
                item.container.y = item.y;
                if (arrived) {
                    item.stage = 122;
                    item.x = item.transferTargetX;
                    item.y = item.transferTargetY;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 122) {
                const entrySlot = this.getNearestLineSlotIndex(this.lines.line2, item.transferTargetX);
                const centerX = this.getLineSlotCenterXAtClock(this.lines.line2, entrySlot);
                const captureTolerance = this.getLiftCaptureTolerance(this.lines.line2, dt);
                item.x = item.transferTargetX;
                item.y = item.transferTargetY;
                item.container.x = item.x;
                item.container.y = item.y;
                if (Math.abs(centerX - item.transferTargetX) <= captureTolerance && !this.isSlotOccupied(2, entrySlot)) {
                    item.stage = 2;
                    item.slotIndexLine = entrySlot;
                    item.x = centerX;
                    item.y = this.lines.line2.y + this.lines.line2.h * 0.5 - 10;
                    item.holdUntilClock = this.speedClock + 0.02;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 2) {
                if (this.speedClock >= (item.holdUntilClock || 0)) {
                    item.x = this.getLineSlotCenterXAtClock(this.lines.line2, item.slotIndexLine);
                }
                item.container.x = item.x;
                item.container.y = item.y;
                if (item.x <= this.transferLeftFromX) this.moveItemToLine3(item);
                alive.push(item);
                continue;
            }

            if (item.stage === 231) {
                if (!this.isLiftBusy("left") && this.isFirstInLiftQueue(item, "left")) {
                    item.stage = 23;
                } else {
                    const order = Math.max(0, this.travelItems.filter(t => !t.destroyed && !t.finished && t.stage === 231 && (t.queueId || 0) < (item.queueId || 0)).length);
                    item.x = this.transferLeftFromX;
                    item.y = this.lines.line2.y + this.lines.line2.h * 0.5 - 10 + order * 20;
                    item.container.x = item.x;
                    item.container.y = item.y;
                    alive.push(item);
                    continue;
                }
            }

            if (item.stage === 23) {
                const arrived = this.stepTransferItem(item, dt, transferSpeed);
                item.container.x = item.x;
                item.container.y = item.y;
                if (arrived) {
                    item.stage = 232;
                    item.x = item.transferTargetX;
                    item.y = item.transferTargetY;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 232) {
                const entrySlot = this.getNearestLineSlotIndex(this.lines.line3, item.transferTargetX);
                const centerX = this.getLineSlotCenterXAtClock(this.lines.line3, entrySlot);
                const captureTolerance = this.getLiftCaptureTolerance(this.lines.line3, dt);
                item.x = item.transferTargetX;
                item.y = item.transferTargetY;
                item.container.x = item.x;
                item.container.y = item.y;
                if (Math.abs(centerX - item.transferTargetX) <= captureTolerance && !this.isSlotOccupied(3, entrySlot)) {
                    item.stage = 3;
                    item.slotIndexLine = entrySlot;
                    item.x = centerX;
                    item.y = this.lines.line3.y + this.lines.line3.h * 0.5 - 10;
                    item.holdUntilClock = this.speedClock + 0.02;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 3) {
                if (this.speedClock >= (item.holdUntilClock || 0)) {
                    item.x = this.getLineSlotCenterXAtClock(this.lines.line3, item.slotIndexLine);
                }
                item.container.x = item.x;
                item.container.y = item.y;

                if (item.x >= this.lines.line3.endX + this.lines.line3.slotWidth * 0.5) {
                    const litBombEggs = (item.eggs || []).filter(egg => egg.bomb && egg.bombLit !== false);
                    item.finished = true;
                    this.clearWetFx(item);

                    if (litBombEggs.length > 0) {
                        this.breakMachinesByTypes(["fire", "crush"]);
                        this.spawnBombExplosionFx(this.W - 24, item.y - 6);
                    }

                    this.balance += item.currentValue || 0;
                    this.addWin(item.currentValue || 0);
                    if (!item.settled && (item.currentValue || 0) < (item.spentCost || 0)) {
                        this.addLose((item.spentCost || 0) - (item.currentValue || 0));
                    }
                    item.settled = true;
                    this.updatePillowButtonLabels();
                    this.spawnImpactFx(this.W - 16, item.y, 0x63ff8d);
                    this.showCenterWin(item.currentValue || 0);
                    item.container.destroy();
                    continue;
                }

                alive.push(item);
            }
        }

        this.travelItems = alive;
    }
};
