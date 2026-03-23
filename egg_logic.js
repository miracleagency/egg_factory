window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.logic = {
    cloneEggTypeData(egg) {
        return egg ? { ...egg } : null;
    },

    getWeightedEggType(excludeKeys = []) {
        const exclude = new Set(excludeKeys);
        const pool = (this.eggTypes || []).filter(egg => egg && !exclude.has(egg.key));
        const total = pool.reduce((sum, egg) => sum + (egg.chance || 0), 0);
        let roll = Math.random() * Math.max(total, 0.0001);
        for (const egg of pool) {
            roll -= egg.chance || 0;
            if (roll <= 0) return this.cloneEggTypeData(egg);
        }
        return this.cloneEggTypeData(pool[0] || this.eggTypes[0]);
    },

    getRoundSetupHiddenEggType() {
        const pool = (this.eggTypes || []).filter(Boolean).map(egg => {
            let weight = egg.chance || 0;
            if (egg.key === "white") weight *= 0.42;
            else if (egg.key === "armored" || egg.key === "bomb") weight *= 1.02;
            else if (egg.key === "gold" || egg.key === "mystery") weight *= 1.34;
            else if (egg.key === "diamond") weight *= 1.18;
            return { egg, weight };
        });

        const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * Math.max(total, 0.0001);
        for (const entry of pool) {
            roll -= entry.weight;
            if (roll <= 0) return this.cloneEggTypeData(entry.egg);
        }
        return this.cloneEggTypeData((pool[0] || {}).egg || this.eggTypes[0]);
    },

    buildRoundEggPool() {
        const white = this.getEggTypeByKey("white");
        const armored = this.getEggTypeByKey("armored");
        const bomb = this.getEggTypeByKey("bomb");
        const pool = [];

        for (let i = 0; i < 5; i++) pool.push(this.cloneEggTypeData(white));
        for (let i = 0; i < 3; i++) pool.push(this.cloneEggTypeData(armored));
        for (let i = 0; i < 2; i++) pool.push(this.cloneEggTypeData(bomb));

        const hidden = [];
        for (let i = 0; i < 10; i++) {
            hidden.push(this.getRoundSetupHiddenEggType());
        }

        this.roundEggPreview = [...pool, ...hidden];
        this.roundEggPool = this.roundEggPreview.map(egg => this.cloneEggTypeData(egg));
        this.roundEggHiddenStartIndex = 10;
        this.spawnedEggBoxCount = 0;
        this.line1EntryCheckCount = 0;

        const boxRoll = Math.random();
        this.eggBoxTargetCount = boxRoll < 0.02 ? 3 : (boxRoll < 0.14 ? 2 : 1);
        const totalChecksEstimate = Math.max(14, (this.roundEggLimit || 20) + 10);
        const forcedChecks = [];
        if (this.eggBoxTargetCount === 1) {
            forcedChecks.push(Phaser.Math.Between(5, totalChecksEstimate - 2));
        } else if (this.eggBoxTargetCount === 2) {
            const first = Phaser.Math.Between(5, Math.max(7, Math.floor(totalChecksEstimate * 0.62)));
            const secondMin = Math.max(first + 5, Math.floor(totalChecksEstimate * 0.58));
            const second = Phaser.Math.Between(secondMin, totalChecksEstimate - 1);
            forcedChecks.push(first, second);
        } else {
            const first = Phaser.Math.Between(5, Math.max(7, Math.floor(totalChecksEstimate * 0.38)));
            const secondMin = Math.max(first + 5, Math.floor(totalChecksEstimate * 0.5));
            const secondMax = Math.max(secondMin, Math.floor(totalChecksEstimate * 0.76));
            const second = Phaser.Math.Between(secondMin, secondMax);
            const thirdMin = Math.max(second + 5, Math.floor(totalChecksEstimate * 0.8));
            const third = Phaser.Math.Between(thirdMin, totalChecksEstimate);
            forcedChecks.push(first, second, third);
        }
        this.eggBoxForcedEntryChecks = forcedChecks;
    },

    chooseEggType() {
        if (Array.isArray(this.roundEggPool) && this.roundEggPool.length > 0) {
            const index = Phaser.Math.Between(0, this.roundEggPool.length - 1);
            const [egg] = this.roundEggPool.splice(index, 1);
            return this.cloneEggTypeData(egg);
        }
        const r = Math.random();
        let sum = 0;
        for (const egg of this.eggTypes) {
            sum += egg.chance;
            if (r <= sum) return this.cloneEggTypeData(egg);
        }
        return this.cloneEggTypeData(this.eggTypes[0]);
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

    getLine1EntrySlotIndex() {
        return this.getLine1FirstVisibleSlotIndex() - 2;
    },

    getLine1SlotEntryType(slotIndex) {
        if (this.line1Pillows.has(slotIndex)) return "pillow";

        const targetCount = this.eggBoxTargetCount || 1;
        const spawnedCount = this.spawnedEggBoxCount || 0;
        if (spawnedCount >= targetCount) return "pillow";

        this.line1EntryCheckCount = (this.line1EntryCheckCount || 0) + 1;

        const forcedAt = (this.eggBoxForcedEntryChecks || [])[spawnedCount] || 999;
        if (this.line1EntryCheckCount >= forcedAt) return "box";

        if (this.line1EntryCheckCount < 5) return "pillow";

        const chanceByIndex = [0.035, 0.018, 0.008];
        const roll = Math.random();
        return roll < (chanceByIndex[spawnedCount] || 0.01) ? "box" : "pillow";
    },

    handleAutoDrop() {
        if (this.roundPopupShown || this.eggsSpawnedThisRound >= this.roundEggLimit) return;

        const slotIndex = this.getLine1EntrySlotIndex();
        if (slotIndex === this.autoDropCheckSlot) return;
        this.autoDropCheckSlot = slotIndex;
        if (this.getLine1SlotEntryType(slotIndex) === "box") {
            this.spawnLine1EggBox(slotIndex);
        } else {
            this.placeLine1Pillow(0x46c466, 1);
        }
    },

    placeLine1Pillow(color = 0x46c466, multiplier = 1) {
        const slotIndex = this.getLine1EntrySlotIndex();
        return this.ensureLine1PillowAtSlot(slotIndex, color, multiplier);
    },

    ensureLine1PillowAtSlot(slotIndex, color = 0x46c466, multiplier = 1) {
        const cost = this.bet;
        if (this.line1Pillows.has(slotIndex)) return !this.line1Pillows.get(slotIndex).eggsBox;

        const pillow = this.createTravelPillow(color, cost, multiplier, this.bet);
        pillow.slotIndex = slotIndex;
        pillow.stage = 1;

        this.line1Pillows.set(slotIndex, pillow);
        this.pillowLayer.add(pillow.container);

        this.updatePillowButtonLabels();
        return true;
    },

    spawnLine1EggBox(slotIndex) {
        if (this.line1Pillows.has(slotIndex)) return false;
        const box = this.createTravelEggBox();
        box.slotIndex = slotIndex;
        box.stage = 1;
        this.line1Pillows.set(slotIndex, box);
        this.pillowLayer.add(box.container);
        this.spawnedEggBoxCount = (this.spawnedEggBoxCount || 0) + 1;
        return true;
    },

    resolveEggLandingSlot(slotIndex) {
        const current = this.line1Pillows.get(slotIndex);
        if (!current || !current.eggsBox) return slotIndex;
        const candidates = [slotIndex - 1, slotIndex + 1, slotIndex - 2, slotIndex + 2, slotIndex - 3, slotIndex + 3];
        for (const candidate of candidates) {
            if (!Number.isFinite(candidate)) continue;
            const item = this.line1Pillows.get(candidate);
            if (!item || !item.eggsBox) return candidate;
        }
        return null;
    },

    computeNextEggSpawnClock(dropXGetter, fromClock, first = false) {
        const line = this.lines.line1;
        const slotTravel = line.slotWidth / line.speed;
        const dropX = dropXGetter();
        const a = (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * fromClock) / line.slotWidth;
        let dt = (a - Math.floor(a)) * slotTravel;

        const minLead = first ? 0.08 : 0.22;
        while (dt < minLead) dt += slotTravel;

        dt += (first ? Phaser.Math.Between(0, 1) : Phaser.Math.Between(3, 4)) * slotTravel;
        return fromClock + dt;
    },

    computeEggDropperNextSpawnClock(dropperKey, fromClock, first = false) {
        const baseClock = this.computeNextEggSpawnClock(
            () => dropperKey === "A" ? this.dropperAX : this.dropperBX,
            fromClock,
            first
        );
        if (dropperKey !== "A") return baseClock;
        const slotTravel = this.lines.line1.slotWidth / this.lines.line1.speed;
        return Math.max(fromClock + 0.18, baseClock - slotTravel * 0.28);
    },

    fallDuration() {
        return (this.eggLandingY - this.eggStartY) / 1050;
    },

    spawnEgg(dropX, targetClock) {
        if (this.eggsSpawnedThisRound >= this.roundEggLimit) return;
        if (this.isEggBoxUnderDropper(dropX, targetClock)) return false;
        const line = this.lines.line1;
        const rawSlotIndex = Math.round(
            (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * targetClock) / line.slotWidth
        );
        const slotIndex = this.resolveEggLandingSlot(rawSlotIndex);
        if (!Number.isFinite(slotIndex)) return false;
        this.ensureLine1PillowAtSlot(slotIndex, 0x46c466, 1);
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
        this.eggsSpawnedThisRound += 1;
        this.remainingEggCount = Math.max(0, this.roundEggLimit - this.eggsSpawnedThisRound);
        this.updatePillowButtonLabels();
        return true;
    },

    handleEggSpawns() {
        if (!this.gameplayEggSpawnsArmed) {
            if (!this.isFirstDropperLaneReady()) return;
            this.gameplayEggSpawnsArmed = true;
            this.nextEggSpawnA = this.computeEggDropperNextSpawnClock("A", this.speedClock, false);
            this.nextEggSpawnB = Infinity;
        }

        while (this.eggsSpawnedThisRound < this.roundEggLimit && this.speedClock >= this.nextEggSpawnA - this.fallDuration()) {
            this.spawnEgg(this.dropperAX, this.nextEggSpawnA);
            this.nextEggSpawnA = this.computeEggDropperNextSpawnClock("A", this.nextEggSpawnA);
        }
    },

    armRoundGameplayStart() {
        this.roundSetupActive = false;
        this.autoDropCheckSlot = null;
        this.gameplayEggSpawnsArmed = false;
        this.nextEggSpawnA = Infinity;
        this.nextEggSpawnB = Infinity;
        this.lastTime = this.time.now;
    },

    isFirstDropperLaneReady() {
        const line = this.lines.line1;
        const activationX = this.dropperAX - line.slotWidth * 0.12;
        for (const [slotIndex, item] of this.line1Pillows.entries()) {
            if (!item || item.destroyed || item.finished) continue;
            if (item.eggsBox) continue;
            const x = line.startX + line.slotWidth * 0.5 + slotIndex * line.slotWidth + line.speed * this.speedClock;
            if (x >= activationX) return true;
        }
        return false;
    },

    isEggBoxUnderDropper(dropX, targetClock = this.speedClock) {
        const line = this.lines.line1;
        const slotIndex = Math.round(
            (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * targetClock) / line.slotWidth
        );
        const item = this.line1Pillows.get(slotIndex);
        return !!(item && item.eggsBox && !item.destroyed && !item.finished);
    },

    hasActiveRoundEggs() {
        if ((this.fallingEggs || []).some(egg => egg && egg.state === "falling")) return true;
        if (Array.from(this.line1Pillows.values()).some(item => item && !item.destroyed && !item.finished && ((item.eggs && item.eggs.length > 0) || item.eggsBox))) return true;
        if ((this.travelItems || []).some(item => item && !item.destroyed && !item.finished && (((item.eggs || []).length > 0) || item.eggsBox))) return true;
        return false;
    },

    checkRoundComplete() {
        if (this.roundPopupShown) return;
        if (this.eggsSpawnedThisRound < this.roundEggLimit) return;
        if (this.hasActiveRoundEggs()) return;

        this.roundPopupShown = true;
        this.beginGameplayPause();
        if (typeof this.showRoundEndPopup === "function") {
            this.showRoundEndPopup();
        }
    },

    updateFallingEggs() {
        const duration = this.fallDuration();
        const line = this.lines.line1;

        for (const egg of this.fallingEggs) {
            if (egg.state !== "falling") continue;
            const p = Phaser.Math.Clamp((this.speedClock - egg.spawnClock) / duration, 0, 1);
            egg.container.y = Phaser.Math.Linear(this.eggStartY, this.eggLandingY, p);

            const safeSlotIndex = this.resolveEggLandingSlot(egg.slotIndexAtLanding);
            if (Number.isFinite(safeSlotIndex)) {
                egg.slotIndexAtLanding = safeSlotIndex;
                const targetX = this.getLineSlotCenterXAtClock(line, safeSlotIndex, egg.spawnClock + duration);
                const steer = p < 0.55 ? 0.08 : 0.24;
                egg.container.x = Phaser.Math.Linear(egg.container.x, targetX, steer);
            }

            if (p < 1) continue;
            const pillow = this.line1Pillows.get(egg.slotIndexAtLanding);

            if (pillow && !pillow.eggsBox) {
                egg.state = "saved";
                const eggData = { ...egg.typeData };
                if (eggData.bomb) eggData.bombLit = true;
                if (eggData.armored) eggData.armorDamage = eggData.armorDamage || 0;
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

            if (x >= this.transferRightFromX && (pillow.eggs.length > 0 || pillow.eggsBox)) {
                this.moveItemToLine2(pillow);
                toDelete.push(slotIndex);
            } else if (x >= line.endX + line.slotWidth * 1.5) {
                if (!pillow.settled && pillow.eggs.length === 0 && !pillow.eggsBox) {
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
            minSkip = 1;
            maxSkip = 2;
        } else if (def.type === "water") {
            maxSkip = 4;
        } else if (def.type === "fire") {
            minSkip = 0;
            maxSkip = 1;
        } else if (def.rarity === "gold") {
            if (def.value === 50) {
                minSkip = 10;
                maxSkip = 16;
            } else {
                minSkip = def.fastGold ? 6 : 7;
                maxSkip = def.fastGold ? 12 : 15;
            }
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

    beginGameplayPause(focusContainers = [], withOverlay = true) {
        if (this.gameplayPaused) return;
        this.gameplayPaused = true;
        this.gameplayPauseStartedAt = this.time.now;
        this.pendingValueTextRefresh = this.pendingValueTextRefresh || new Set();

        if (withOverlay) {
            this.gameplayFocusOverlay = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.4)
                .setOrigin(0, 0)
                .setDepth(9050);
            this.popupLayer.add(this.gameplayFocusOverlay);
        } else {
            this.gameplayFocusOverlay = null;
        }

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

        if (this.pendingValueTextRefresh && this.pendingValueTextRefresh.size > 0) {
            const items = Array.from(this.pendingValueTextRefresh);
            this.pendingValueTextRefresh.clear();
            for (const item of items) {
                if (!item || item.destroyed || item.finished) continue;
                if (typeof this.clearTransientPillowValueText === "function") {
                    this.clearTransientPillowValueText(item);
                }
                this.updatePillowValueText(item);
            }
        }
    },

    animateMysteryTransformItem(item, mapEgg, flashColor) {
        if (!item || item.destroyed || item.finished || !item.eggs || item.eggs.length === 0) return;
        const baseY = typeof item.y === "number" ? item.y : item.container.y;
        const nextEggs = item.eggs.map((egg, index) => mapEgg({ ...egg }, item, index)).filter(Boolean);
        this.setItemEggs(item, nextEggs);
        this.addDebugLog(`mystery step stage=${item.stage} eggs=${nextEggs.map(egg => egg.key).join(",")}`);
        this.flashValueText(item, flashColor);
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

    runMysterySequence(config) {
        const focusContainers = (config.focusItems || []).map(item => item.container)
            .concat((config.focusMachines || []).map(def => def.container));
        this.addDebugLog(`mystery start ${config.title} items=${(config.focusItems || []).length} machines=${(config.focusMachines || []).length}`);
        this.beginGameplayPause(focusContainers);
        this.spawnMysteryBonusText(config.title, config.textColor, config.accent);

        const steps = config.steps || [];
        let index = 0;
        const runNext = () => {
            if (index >= steps.length) {
                this.addDebugLog(`mystery finish ${config.title}`);
                this.time.delayedCall(config.finishDelay || 440, () => this.endGameplayPause());
                return;
            }
            const step = steps[index++];
            if (typeof step === "function") step();
            this.time.delayedCall(config.stepDelay || 120, runNext);
        };
        this.time.delayedCall(config.startDelay || 180, runNext);
    },

    runX50FocusBonus(def, item, nextValue) {
        if (!def || !item || item.destroyed || item.finished) return;
        const startValue = item.currentValue || 0;
        const prevMachineDepth = def.container.depth || 0;
        const prevItemDepth = item.container.depth || 0;

        this.beginGameplayPause([def.container, item.container]);
        def.container.setDepth(9205);
        item.container.setDepth(9205);

        const txt = this.add.text(item.container.x, item.container.y - 112, this.formatMoneyValue(startValue), {
            fontFamily: "Arial",
            fontSize: "74px",
            color: "#fff4b5",
            fontStyle: "bold",
            stroke: "#3a2200",
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(9210);
        this.popupLayer.add(txt);

        const counter = { value: startValue };
        this.tweens.add({
            targets: counter,
            value: nextValue,
            duration: 850,
            ease: "Cubic.Out",
            onUpdate: () => {
                txt.setText(this.formatMoneyValue(counter.value));
            },
            onComplete: () => {
                item.currentValue = nextValue;
                item.eggMultSum *= def.value;
                item.permanentTextColor = "#f1cb4a";
                this.updatePillowValueText(item);
                this.flashValueText(item, "#fff2a3");
                this.pulseItem(item);
                this.tweens.add({
                    targets: txt,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 150,
                    ease: "Back.Out"
                });
                this.time.delayedCall(1000, () => {
                    txt.destroy();
                    def.container.setDepth(prevMachineDepth);
                    item.container.setDepth(prevItemDepth);
                    this.endGameplayPause();
                });
            }
        });
    },

    runEggBoxBonus(item) {
        if (!item || item.finished || item.boxBonusRunning) return;
        const bonusCount = Phaser.Math.Between(3, 5);
        const eggs = [];
        for (let i = 0; i < bonusCount; i++) eggs.push(this.getRoundSetupHiddenEggType());
        item.boxBonusRunning = true;
        item.destroyed = true;

        this.beginGameplayPause([item.container]);
        item.container.setDepth(9205);

        for (let i = 0; i < 10; i++) {
            this.spawnRadialSparkBurst(item.container.x, item.container.y - 8, {
                count: 4,
                color: 0xffef9f,
                colorAlt: 0x9cd7ff,
                minSpeed: 10,
                maxSpeed: 34,
                depth: 9210
            });
        }

        this.tweens.add({
            targets: item.container,
            x: item.container.x + 8,
            duration: 70,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.spawnBombExplosionFx(item.container.x, item.container.y - 8);
                item.container.destroy();
                item.finished = true;

                const centerY = this.H * 0.48;
                const rowGap = 122;
                const startX = this.W * 0.5 - ((bonusCount - 1) * rowGap) * 0.5;
                const targetX = this.eggsHud ? this.eggsHud.x + this.midHud.x : this.W * 0.5;
                const targetY = this.midHud ? this.midHud.y + 12 : this.H * 0.5;
                const visuals = eggs.map((eggData, index) => {
                    const visual = this.createEggVisual(eggData, false).container;
                    visual.setPosition(startX + index * rowGap, centerY);
                    visual.setScale(3.6);
                    visual.setAlpha(0);
                    visual.setDepth(9212);
                    this.popupLayer.add(visual);
                    this.tweens.add({
                        targets: visual,
                        alpha: 1,
                        scaleX: 3.85,
                        scaleY: 3.85,
                        duration: 180,
                        delay: index * 90,
                        ease: "Back.Out"
                    });
                    return { visual, eggData, index };
                });

                this.time.delayedCall(1400, () => {
                    let delay = 0;
                    visuals.forEach(({ visual, eggData, index }) => {
                        this.tweens.add({
                            targets: visual,
                            scaleX: 3.95,
                            scaleY: 3.95,
                            duration: 120,
                            delay,
                            yoyo: true,
                            ease: "Sine.InOut"
                        });
                        this.time.delayedCall(delay, () => {
                            this.spawnRadialSparkBurst(visual.x, visual.y, {
                                count: 5,
                                color: 0xffef9f,
                                colorAlt: 0x9cd7ff,
                                minSpeed: 16,
                                maxSpeed: 42,
                                depth: 9213
                            });
                        });
                        this.time.delayedCall(delay + 1000, () => {
                            this.tweens.add({
                                targets: visual,
                                x: targetX,
                                y: targetY,
                                scaleX: 0.42,
                                scaleY: 0.42,
                                alpha: 0,
                                duration: 280,
                                ease: "Cubic.In",
                                onComplete: () => {
                                    visual.destroy();
                                    this.roundEggPool.push(this.cloneEggTypeData(eggData));
                                    this.roundEggLimit += 1;
                                    this.remainingEggCount += 1;
                                    this.updatePillowButtonLabels();
                                    if (index === visuals.length - 1) {
                                        item.boxBonusRunning = false;
                                        this.time.delayedCall(250, () => this.endGameplayPause());
                                    }
                                }
                            });
                        });
                        delay += 170;
                    });
                });
            }
        });
    },

    setItemEggs(item, eggs) {
        if (!item || !item.container) return;

        for (const child of item.container.list.slice()) {
            if (!child || !child._eggTypeData) continue;
            item.container.remove(child);
            this.destroyDisplayObjectSafe(child);
        }

        item.eggs = eggs;
        item.armored = eggs.some(egg => egg.armored);
        for (const egg of item.eggs) {
            if (egg.armored) egg.armorDamage = egg.armorDamage || 0;
        }

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
        const startY = def.container.y + 68;

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
        const startY = def.container.y + 64;
        const centerIndex = this.getNearestLineSlotIndex(line, startX, impactClock);
        const endX = this.getLineSlotCenterXAtClock(line, centerIndex, impactClock);
        const endY = line.y + line.h * 0.5 - 6;
        const travelDuration = Math.round((flightTime || this.getMachineFlightTime(def, line)) * 1000);

        this.spawnMachineProjectile(def, startX, startY, endX, endY, travelDuration, () => {
            const items = this.getStageItems(stage);
            const item = items.find(entry => entry.slotIndexLine === centerIndex)
                || items.find(entry => Math.abs(entry.x - endX) <= line.slotWidth * 0.28);
            if (item) this.applyMachineEffect(def, item);
            this.spawnMachineImpactFx(def, endX, endY);
        });
    },

    applyMachineEffect(def, item) {
        if (item.destroyed || item.finished) return;
        if (item.eggsBox) {
            if (def.type === "water") {
                item.wet = true;
                this.spawnWaterEggSplash(item);
                this.pulseItem(item);
                return;
            }

            if (def.type === "fire" || def.type === "crush") {
                if (def.type === "fire" && item.wet) {
                    item.wet = false;
                    this.spawnMachineImpactFx({ type: "water" }, item.container.x, item.container.y - 4);
                    this.spawnDryFx(item);
                    this.pulseItem(item);
                    return;
                }
                item.boxDamage = (item.boxDamage || 0) + 1;
                this.setEggBoxDamageVisual(item, item.boxDamage);
                if (def.type === "crush") {
                    this.spawnCrushFx(item.container.x, item.container.y - 4);
                } else {
                    this.spawnMachineImpactFx({ type: "fire" }, item.container.x, item.container.y - 4);
                }
                this.pulseItem(item);

                if (item.boxDamage >= 3) {
                    this.runEggBoxBonus(item);
                }
                return;
            }

            return;
        }

        const bombEggs = (item.eggs || []).filter(egg => egg.bomb);
        const litBombEggs = bombEggs.filter(egg => egg.bombLit !== false);
        const mysteryEggs = (item.eggs || []).filter(egg => egg.key === "mystery");
        const damageArmoredEggs = (keepOnlyArmored) => {
            const armoredEggsLocal = (item.eggs || []).filter(egg => egg.armored);
            if (armoredEggsLocal.length === 0) return false;

            const nextDamage = Math.max(...armoredEggsLocal.map(egg => egg.armorDamage || 0)) + 1;
            if (nextDamage >= 2) return false;

            const nextEggs = armoredEggsLocal.map(egg => ({
                ...egg,
                armorDamage: nextDamage
            }));

            item.eggs = nextEggs;
            item.armored = true;
            item.permanentTextColor = "#d8e3ef";

            if (keepOnlyArmored) {
                item.eggMultSum *= 0.5;
                item.currentValue = Math.max(1, item.currentValue * 0.5);
                this.updatePillowValueText(item);
            }

            this.setItemEggs(item, nextEggs);
            this.flashValueText(item, nextDamage === 1 ? "#d8e3ef" : "#ffb36b");
            return true;
        };

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
            if (def.value === 50) {
                this.runX50FocusBonus(def, item, item.currentValue * def.value);
            } else {
                item.eggMultSum *= def.value;
                item.currentValue *= def.value;
                if (def.rarity === "gold") item.permanentTextColor = "#f1cb4a";
                this.updatePillowValueText(item);
                this.flashValueText(item, def.rarity === "gold" ? "#fff2a3" : "#7dff9c");
                this.pulseItem(item);
            }
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
                this.spawnMachineImpactFx({ type: "water" }, item.container.x, item.container.y - 4);
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
                if (damageArmoredEggs(false)) {
                    this.spawnMachineImpactFx({ type: "fire" }, item.container.x, item.container.y - 6);
                    this.pulseItem(item);
                    return;
                }
            }

            if (armoredEggs.length > 0 && vulnerableEggs.length > 0) {
                if (damageArmoredEggs(true)) {
                    this.spawnMachineImpactFx({ type: "fire" }, item.container.x, item.container.y - 6);
                    this.pulseItem(item);
                    return;
                }
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
            const armoredEggs = (item.eggs || []).filter(egg => egg.armored);
            const vulnerableEggs = (item.eggs || []).filter(egg => !egg.armored);
            const maxArmorDamage = armoredEggs.length > 0
                ? Math.max(...armoredEggs.map(egg => egg.armorDamage || 0))
                : 0;

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
                this.spawnEggSplatFx(item.container.x, item.container.y - 4, item.container.y + 6);
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
                this.spawnEggSplatFx(item.container.x, item.container.y - 4, item.container.y + 6);
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

            if (armoredEggs.length > 0 && vulnerableEggs.length === 0 && maxArmorDamage < 2) {
                damageArmoredEggs(false);
                this.spawnCrushFx(item.container.x, item.container.y - 4);
                this.pulseItem(item);
                return;
            }

            if (armoredEggs.length > 0 && vulnerableEggs.length > 0 && maxArmorDamage < 2) {
                damageArmoredEggs(true);
                this.spawnCrushFx(item.container.x, item.container.y - 4);
                this.pulseItem(item);
                return;
            }

            item.destroyed = true;
            item.armored = false;
            this.clearWetFx(item);
            if (!item.settled) {
                this.addLose(item.spentCost || 0);
                item.settled = true;
            }

            this.spawnEggSplatFx(item.container.x, item.container.y - 4, item.container.y + 6);
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

    breakMachinesByTypes(types, repairDurationMs = 20000) {
        const match = new Set(types);
        const allDefs = [...this.line1Machines, ...this.line2Machines, ...this.line3Machines];
        for (const def of allDefs) {
            if (match.has(def.type)) {
                this.breakMachine(def, repairDurationMs);
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
                        this.breakMachinesByTypes(["fire", "crush"], 10000);
                        this.spawnBombExplosionFx(this.W - 24, item.y - 6);
                    }

                    item.settled = true;
                    if (!item.eggsBox) {
                        this.addWin(item.currentValue || 0);
                        this.updatePillowButtonLabels();
                        const hasGoldEgg = (item.eggs || []).some(egg => egg && (egg.goldFx || egg.key === "gold"));
                        this.pulseFinalCollector(0x63ff8d, hasGoldEgg ? 1.35 : 1);
                        this.spawnImpactFx(this.W - 16, item.y, 0x63ff8d);
                        this.showCenterWin(item.currentValue || 0);
                    }
                    item.container.destroy();
                    continue;
                }

                alive.push(item);
            }
        }

        this.travelItems = alive;
    }
};
