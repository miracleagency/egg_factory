window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.logic = {
    cloneEggTypeData(egg) {
        return egg ? { ...egg } : null;
    },

    getArmoredPayloadEgg() {
        const white = this.getEggTypeByKey("white");
        const bomb = this.getEggTypeByKey("bomb");
        const mystery = this.getEggTypeByKey("mystery");
        const pool = [
            { egg: white, weight: 0.62 },
            { egg: bomb, weight: 0.22 },
            { egg: mystery, weight: 0.16 }
        ].filter(entry => entry.egg);
        const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * Math.max(total, 0.0001);
        for (const entry of pool) {
            roll -= entry.weight;
            if (roll <= 0) return this.cloneEggTypeData(entry.egg);
        }
        return this.cloneEggTypeData((pool[0] || {}).egg || white);
    },

    unwrapArmoredEggData(egg) {
        if (!egg || !egg.armored) return this.cloneEggTypeData(egg);
        if (egg.megaArmored) return this.createArmoredEggData(egg.innerEgg ? this.cloneEggTypeData(egg.innerEgg) : null);
        const payload = egg.innerEgg ? this.cloneEggTypeData(egg.innerEgg) : this.getArmoredPayloadEgg();
        if (payload) {
            payload.armored = false;
            payload.armorDamage = 0;
            payload.innerEgg = null;
            if (payload.bomb) payload.bombLit = true;
        }
        return payload;
    },

    createArmoredEggData(innerEgg = null) {
        const shell = this.getEggTypeByKey("armored");
        const payloadSource = innerEgg ? this.unwrapArmoredEggData(innerEgg) : this.getArmoredPayloadEgg();
        const payload = this.cloneEggTypeData(payloadSource);
        return {
            ...payload,
            key: shell ? shell.key : "armored",
            label: shell ? shell.label : "Armored",
            color: shell ? shell.color : 0x939ca7,
            stroke: shell ? shell.stroke : 0xdfe6ef,
            armored: true,
            armorDamage: 0,
            innerEgg: payload,
            bomb: false,
            bombLit: false,
            goldFx: false,
            diamondFx: false,
            mysteryFx: false
        };
    },

    createMegaArmoredEggData(innerEgg = null) {
        const armored = this.createArmoredEggData(innerEgg);
        return {
            ...armored,
            megaArmored: true,
            armorDamage: 0
        };
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
        this.line1EggGapRemaining = 0;
        this.line1EggRunRemaining = 0;

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
            return egg && egg.key === "armored"
                ? this.createArmoredEggData()
                : this.cloneEggTypeData(egg);
        }
        const r = Math.random();
        let sum = 0;
        for (const egg of this.eggTypes) {
            sum += egg.chance;
            if (r <= sum) {
                return egg && egg.key === "armored"
                    ? this.createArmoredEggData()
                    : this.cloneEggTypeData(egg);
            }
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
        if (this.autoDropCheckSlot == null) {
            if (this.getLine1SlotEntryType(slotIndex) === "box") {
                this.spawnLine1EggBox(slotIndex);
            } else if (this.shouldSpawnEggAtEntrySlot(slotIndex)) {
                this.spawnEggAtEntrySlot(slotIndex);
            }
            this.autoDropCheckSlot = slotIndex;
            return;
        }

        const step = slotIndex < this.autoDropCheckSlot ? -1 : 1;
        for (let currentSlot = this.autoDropCheckSlot + step; step < 0 ? currentSlot >= slotIndex : currentSlot <= slotIndex; currentSlot += step) {
            if (!this.roundPopupShown && this.getLine1SlotEntryType(currentSlot) === "box") {
                this.spawnLine1EggBox(currentSlot);
                continue;
            }
            if (!this.roundPopupShown && this.shouldSpawnEggAtEntrySlot(currentSlot)) {
                this.spawnEggAtEntrySlot(currentSlot);
            }
        }
        this.autoDropCheckSlot = slotIndex;
    },

    rollLine1EggSpawnSegment() {
        const gapRoll = Math.random();
        this.line1EggGapRemaining = gapRoll < 0.18 ? 5 : (gapRoll < 0.44 ? 4 : (gapRoll < 0.72 ? 3 : (gapRoll < 0.9 ? 2 : 1)));
        const runRoll = Math.random();
        this.line1EggRunRemaining = runRoll < 0.14 ? 3 : (runRoll < 0.56 ? 2 : 1);
    },

    shouldSpawnEggAtEntrySlot(slotIndex) {
        if (this.eggsSpawnedThisRound >= this.roundEggLimit) return false;
        if (this.line1Pillows.has(slotIndex)) return false;
        if (!this.line1EggRunRemaining && !this.line1EggGapRemaining) {
            this.rollLine1EggSpawnSegment();
        }
        if (this.line1EggGapRemaining > 0) {
            this.line1EggGapRemaining -= 1;
            return false;
        }
        if (this.line1EggRunRemaining > 0) {
            this.line1EggRunRemaining -= 1;
            return true;
        }
        return false;
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

    addEggToPillow(pillow, eggType, options = {}) {
        if (!pillow || pillow.eggsBox) return false;
        const visual = options.visual || this.createEggVisual(eggType, false).container;
        const eggData = { ...eggType };
        if (eggData.bomb) eggData.bombLit = options.bombLit ?? false;
        if (eggData.armored) eggData.armorDamage = eggData.armorDamage || 0;
        pillow.eggs.push(eggData);
        pillow.eggMultSum += eggData.mult;
        pillow.currentValue += pillow.spentCost * eggData.mult;
        if (eggData.armored) {
            pillow.armored = true;
            pillow.permanentTextColor = "#d8e3ef";
        }

        pillow.container.add(visual);
        if (pillow.eggs.length === 1) {
            visual.x = 0;
        } else {
            const prevEggContainer = pillow.container.list[pillow.container.length - 2];
            if (prevEggContainer) prevEggContainer.x = -10;
            visual.x = 10;
        }
        visual.y = -26;
        visual._eggTypeData = eggData;
        if (eggData.bomb) this.setBombVisualState(visual, eggData.bombLit !== false);
        this.updatePillowValueText(pillow);
        return true;
    },

    spawnEggAtEntrySlot(slotIndex) {
        this.ensureLine1PillowAtSlot(slotIndex, 0x46c466, 1);
        const item = this.line1Pillows.get(slotIndex);
        if (!item || item.eggsBox) return false;
        const eggType = this.chooseEggType();
        const added = this.addEggToPillow(item, eggType, { bombLit: eggType.bomb ? true : false });
        if (!added) return false;
        this.eggsSpawnedThisRound += 1;
        this.remainingEggCount = Math.max(0, this.roundEggLimit - this.eggsSpawnedThisRound);
        this.updatePillowButtonLabels();
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
        const line = this.lines.line1;
        const slotTravel = line.slotWidth / line.speed;
        const dropX = dropperKey === "A" ? this.dropperAX : this.dropperBX;
        const a = (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * fromClock) / line.slotWidth;
        let dt = (a - Math.floor(a)) * slotTravel;

        const minLead = first ? 0.08 : 0.18;
        while (dt < minLead) dt += slotTravel;

        if (dropperKey !== "A") {
            dt += (first ? Phaser.Math.Between(0, 1) : Phaser.Math.Between(3, 4)) * slotTravel;
            return fromClock + dt;
        }

        dt += (first ? Phaser.Math.Between(0, 1) : Phaser.Math.Between(1, 2)) * slotTravel;
        return fromClock + dt;
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
        return;
    },

    populateInitialLine1EntrySlot() {
        const entrySlot = this.getLine1EntrySlotIndex();
        for (const slot of [entrySlot + 1, entrySlot + 2]) {
            if (this.line1Pillows.has(slot)) continue;
            if (this.getLine1SlotEntryType(slot) === "box") {
                this.spawnLine1EggBox(slot);
            } else if (this.shouldSpawnEggAtEntrySlot(slot)) {
                this.spawnEggAtEntrySlot(slot);
            }
        }
        this.autoDropCheckSlot = entrySlot;
    },

    armRoundGameplayStart() {
        this.roundSetupActive = false;
        this.autoDropCheckSlot = null;
        this.gameplayEggSpawnsArmed = true;
        this.nextEggSpawnA = Infinity;
        this.nextEggSpawnB = Infinity;
        this.line1EggGapRemaining = 0;
        this.line1EggRunRemaining = 0;
        this.populateInitialLine1EntrySlot();
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

        for (const egg of this.fallingEggs) {
            if (egg.state !== "falling") continue;
            const p = Phaser.Math.Clamp((this.speedClock - egg.spawnClock) / duration, 0, 1);
            egg.container.y = Phaser.Math.Linear(this.eggStartY, this.eggLandingY, p);

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
        } else if (def.type === "crush" || def.type === "shield") {
            minSkip = def.slowCrush ? 2 : 1;
            maxSkip = def.slowCrush ? 2 : 1;
        } else if (def.type === "water") {
            maxSkip = 4;
        } else if (def.type === "fire") {
            minSkip = 0;
            maxSkip = 1;
        } else if (def.rarity === "gold") {
            if (def.value === 50) {
                minSkip = 7;
                maxSkip = 11;
            } else {
                minSkip = def.fastGold ? 4 : 5;
                maxSkip = def.fastGold ? 8 : 10;
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
        this.gameplayPauseDepth = (this.gameplayPauseDepth || 0) + 1;
        this.gameplayFocusTargets = (this.gameplayFocusTargets || []).concat(focusContainers.filter(Boolean));
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
    },

    liftContainersToPopupLayer(containers = []) {
        const lifted = [];
        for (const container of containers.filter(Boolean)) {
            if (!container.scene || !container.parentContainer || container._focusLiftState) continue;
            const parent = container.parentContainer;
            const index = Array.isArray(parent.list) ? parent.list.indexOf(container) : -1;
            if (index < 0) continue;
            parent.remove(container);
            this.popupLayer.add(container);
            container._focusLiftState = { parent, index };
            lifted.push(container);
        }
        return lifted;
    },

    restoreLiftedContainers(containers = []) {
        for (const container of containers.filter(Boolean)) {
            const state = container && container._focusLiftState;
            if (!state || !state.parent || !container.scene) continue;
            if (container.parentContainer === this.popupLayer) {
                this.popupLayer.remove(container);
            }
            if (typeof state.parent.addAt === "function" && state.index >= 0) {
                state.parent.addAt(container, Math.min(state.index, state.parent.length));
            } else {
                state.parent.add(container);
            }
            container._focusLiftState = null;
        }
    },

    endGameplayPause() {
        this.gameplayPauseDepth = Math.max(0, (this.gameplayPauseDepth || 1) - 1);
        if (this.gameplayPauseDepth > 0) return;
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

    runFocusedMachineAction(def, item, config = {}) {
        if (!def || !item || item.destroyed || item.finished) return false;
        if (this.gameplayPaused) return false;

        const accent = config.accent || (def.type === "water" ? "#9fe5ff" : (def.type === "fire" ? "#ffb38a" : (def.rarity === "gold" ? "#ffe8a6" : "#d4ffd7")));
        const prevMachineDepth = def.container.depth || 0;
        const prevItemDepth = item.container.depth || 0;
        const startValue = item.currentValue || 0;
        const endValue = typeof config.nextValue === "number" ? config.nextValue : startValue;

        this.beginGameplayPause([def.container, item.container]);
        def.container.setDepth(9205);
        item.container.setDepth(9205);

        const halo = this.add.ellipse(item.container.x, item.container.y - 14, 182, 124, this.getEggFocusAccent((item.eggs || [])[0]), 0.18)
            .setDepth(9208);
        this.popupLayer.add(halo);

        const txt = this.add.text(item.container.x, item.container.y - 112, this.formatMoneyValue(startValue), {
            fontFamily: "Arial",
            fontSize: "62px",
            color: accent,
            fontStyle: "bold",
            stroke: "#20110a",
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(9210);
        this.popupLayer.add(txt);

        this.tweens.add({
            targets: halo,
            scaleX: 1.16,
            scaleY: 1.08,
            alpha: 0.3,
            duration: 180,
            yoyo: true
        });

        if (config.animateValue && Math.abs(endValue - startValue) > 0.001) {
            const counter = { value: startValue };
            this.tweens.add({
                targets: counter,
                value: endValue,
                duration: config.duration || 650,
                ease: "Cubic.Out",
                onUpdate: () => txt.setText(this.formatMoneyValue(counter.value))
            });
        } else if (config.label) {
            txt.setText(config.label);
        }

        this.time.delayedCall(config.applyDelay || 180, () => {
            if (typeof config.onApply === "function") config.onApply();
        });

        this.time.delayedCall(config.totalDelay || 620, () => {
            halo.destroy();
            txt.destroy();
            if (def.container && def.container.scene) def.container.setDepth(prevMachineDepth);
            if (item.container && item.container.scene) item.container.setDepth(prevItemDepth);
            this.endGameplayPause();
        });
        return true;
    },

    applyMultiplierToItem(def, item) {
        if (!def || !item || item.eggMultSum <= 0) return;
        item.eggMultSum *= def.value;
        item.currentValue *= def.value;
        if (def.rarity === "gold") item.permanentTextColor = "#f1cb4a";
    },

    runGoldMachineLaserFocus(def, item, shotConfig) {
        if (!def || !item || item.destroyed || item.finished || this.gameplayPaused) return false;
        const prevMachineDepth = def.container.depth || 0;
        const prevItemDepth = item.container.depth || 0;
        const startValue = item.currentValue || 0;
        const nextValue = startValue * (def.value || 1);
        const prevItemX = item.container.x;
        const prevItemY = item.container.y;

        this.beginGameplayPause([def.container, item.container]);
        const lifted = this.liftContainersToPopupLayer([def.container, item.container]);
        def.container.setDepth(9205);
        item.container.setDepth(9205);
        this.updatePillowValueText(item);
        const pauseText = item.pauseValueText || item.valueText;
        if (pauseText && pauseText.scene) {
            pauseText.setAlpha(item.eggMultSum > 0 ? 1 : 0);
            pauseText.setScale(1, 1);
        }
        const machineGlow = this.add.ellipse(def.container.x, def.container.y + 8, 230, 150, 0xffd45c, 0.20).setDepth(9204);
        const itemGlow = this.add.ellipse(item.container.x, item.container.y - 6, 210, 134, 0xffef9f, 0.22).setDepth(9204);
        this.popupLayer.add([machineGlow, itemGlow]);
        this.tweens.add({
            targets: [machineGlow, itemGlow],
            alpha: 0.34,
            scaleX: 1.08,
            scaleY: 1.06,
            duration: 240,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1
        });
        this.tweens.add({
            targets: [item.container, itemGlow],
            x: shotConfig.endX,
            duration: 260,
            ease: "Cubic.Out"
        });
        this.tweens.add({
            targets: item.container,
            y: shotConfig.endY + 4,
            duration: 260,
            ease: "Cubic.Out"
        });

        const badge = this.spawnMysteryBonusText(`GOLD LASER x${def.value}`, "#fff2a3", 0xf0cb4e);
        this.time.delayedCall(950, () => {
            if (item.destroyed || item.finished) {
                def.container.setDepth(prevMachineDepth);
                item.container.setDepth(prevItemDepth);
                item.container.x = prevItemX;
                item.container.y = prevItemY;
                machineGlow.destroy();
                itemGlow.destroy();
                this.restoreLiftedContainers(lifted);
                this.endGameplayPause();
                return;
            }

            this.spawnMachineProjectile(def, shotConfig.startX, shotConfig.startY, shotConfig.endX, shotConfig.endY, shotConfig.travelDuration, () => {
                this.spawnMachineImpactFx(def, shotConfig.endX, shotConfig.endY);
                const counter = { value: startValue };
                this.applyMultiplierToItem(def, item);
                if (pauseText && pauseText.scene) {
                    this.tweens.add({
                        targets: counter,
                        value: nextValue,
                        duration: 850,
                        ease: "Cubic.Out",
                        onStart: () => {
                            pauseText.setAlpha(1);
                        },
                        onUpdate: () => {
                            pauseText.setText(this.formatMoneyValue(counter.value));
                            this.applySafeValueTextColor(pauseText, "#fff2a3", false);
                        },
                        onComplete: () => {
                            this.time.delayedCall(950, () => {
                                this.updatePillowValueText(item);
                                this.flashValueText(item, "#fff2a3");
                                this.pulseItem(item);
                                item.focusApplied = false;
                                if (def.container && def.container.scene) def.container.setDepth(prevMachineDepth);
                                if (item.container && item.container.scene) item.container.setDepth(prevItemDepth);
                                item.container.x = prevItemX;
                                item.container.y = prevItemY;
                                machineGlow.destroy();
                                itemGlow.destroy();
                                this.restoreLiftedContainers(lifted);
                                this.endGameplayPause();
                            });
                        }
                    });
                } else {
                    this.time.delayedCall(950, () => {
                        this.updatePillowValueText(item);
                        this.flashValueText(item, "#fff2a3");
                        this.pulseItem(item);
                        item.focusApplied = false;
                        if (def.container && def.container.scene) def.container.setDepth(prevMachineDepth);
                        if (item.container && item.container.scene) item.container.setDepth(prevItemDepth);
                        item.container.x = prevItemX;
                        item.container.y = prevItemY;
                        machineGlow.destroy();
                        itemGlow.destroy();
                        this.restoreLiftedContainers(lifted);
                        this.endGameplayPause();
                    });
                }
            });
        });
        return true;
    },

    runMysteryCrusherFocus(def, item, action) {
        if (!def || !item || item.destroyed || item.finished || this.gameplayPaused) return false;
        const prevMachineDepth = def.container.depth || 0;
        const prevItemDepth = item.container.depth || 0;
        const prevItemX = item.container.x;
        const prevItemY = item.container.y;
        this.beginGameplayPause([def.container, item.container]);
        const lifted = this.liftContainersToPopupLayer([def.container, item.container]);
        def.container.setDepth(9205);
        item.container.setDepth(9205);
        const machineGlow = this.add.ellipse(def.container.x, def.container.y + 10, 240, 156, 0xffc6a3, 0.18).setDepth(9204);
        const itemGlow = this.add.ellipse(item.container.x, item.container.y - 8, 196, 128, 0xd78cff, 0.22).setDepth(9204);
        this.popupLayer.add([machineGlow, itemGlow]);
        this.tweens.add({
            targets: [machineGlow, itemGlow],
            alpha: 0.32,
            scaleX: 1.08,
            scaleY: 1.06,
            duration: 240,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1
        });
        this.tweens.add({
            targets: [item.container, itemGlow],
            x: def.container.x,
            duration: 260,
            ease: "Cubic.Out"
        });
        this.time.delayedCall(950, () => {
            if (typeof action === "function") action(() => {
                this.time.delayedCall(950, () => {
                    if (def.container && def.container.scene) def.container.setDepth(prevMachineDepth);
                    if (item.container && item.container.scene) item.container.setDepth(prevItemDepth);
                    item.container.x = prevItemX;
                    item.container.y = prevItemY;
                    machineGlow.destroy();
                    itemGlow.destroy();
                    this.restoreLiftedContainers(lifted);
                    this.endGameplayPause();
                });
            });
        });
        return true;
    },

    runFinalCollectorBombFocus(item, onComplete) {
        if (!item || item.destroyed || item.finished || item.collectorBombRunning || this.gameplayPaused) return false;
        item.collectorBombRunning = true;
        const collectorX = this.lines.line3.endX + 74;
        const collectorY = this.lines.line3.y + this.lines.line3.h * 0.5 - 18;
        const itemPrevDepth = item.container.depth || 0;
        this.beginGameplayPause([item.container]);
        const lifted = this.liftContainersToPopupLayer([item.container]);
        item.container.setDepth(9205);

        const vaultGlow = this.add.ellipse(collectorX, collectorY, 240, 220, 0xffd45c, 0.18).setDepth(9206);
        const vaultCore = this.add.roundRectangle
            ? this.add.roundRectangle(collectorX, collectorY, 132, 148, 20, 0xb88925, 0.92).setStrokeStyle(4, 0xffefad, 0.9)
            : this.add.rectangle(collectorX, collectorY, 132, 148, 0xb88925, 0.92).setStrokeStyle(4, 0xffefad, 0.9);
        const itemGlow = this.add.ellipse(item.container.x, item.container.y - 8, 210, 138, 0xff9c6b, 0.24).setDepth(9207);
        this.tweens.add({
            targets: [vaultGlow, itemGlow],
            alpha: 0.34,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 240,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1
        });
        this.popupLayer.add([vaultGlow, vaultCore, itemGlow]);
        this.spawnMysteryBonusText("VAULT MELTDOWN", "#ffe1b0", 0xff8c54);

        this.time.delayedCall(950, () => {
            if (typeof onComplete === "function") onComplete();
            this.time.delayedCall(950, () => {
                vaultGlow.destroy();
                vaultCore.destroy();
                itemGlow.destroy();
                if (item.container && item.container.scene) item.container.setDepth(itemPrevDepth);
                this.restoreLiftedContainers(lifted);
                item.collectorBombRunning = false;
                this.endGameplayPause();
            });
        });
        return true;
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
        const lifted = this.liftContainersToPopupLayer(focusContainers);
        this.spawnMysteryBonusText(config.title, config.textColor, config.accent);

        const steps = config.steps || [];
        let index = 0;
        const runNext = () => {
            if (index >= steps.length) {
                this.addDebugLog(`mystery finish ${config.title}`);
                this.time.delayedCall(config.finishDelay || 440, () => {
                    this.restoreLiftedContainers(lifted);
                    this.endGameplayPause();
                });
                return;
            }
            const step = steps[index++];
            if (typeof step === "function") step();
            this.time.delayedCall(config.stepDelay || 120, runNext);
        };
        this.time.delayedCall(config.startDelay || 180, runNext);
    },

    runX50FocusBonus(def, item, nextValue) {
        return this.runGoldMachineLaserFocus(def, item, {
            startX: def.container.x,
            startY: def.container.y + 64,
            endX: item.container.x,
            endY: item.container.y - 6,
            travelDuration: 220
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
        const lifted = this.liftContainersToPopupLayer([item.container]);
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
                                        this.time.delayedCall(250, () => {
                                            this.restoreLiftedContainers(lifted);
                                            this.endGameplayPause();
                                        });
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

    applyShieldToItem(item) {
        if (!item || item.destroyed || item.finished || !item.eggs || item.eggs.length === 0) return;
        const nextEggs = item.eggs.map(egg => {
            if (egg.megaArmored) return { ...egg };
            if (egg.armored) return this.createMegaArmoredEggData(egg.innerEgg ? this.cloneEggTypeData(egg.innerEgg) : egg);
            return this.createArmoredEggData(egg);
        });
        this.setItemEggs(item, nextEggs);
        item.armored = true;
        item.permanentTextColor = "#d8e3ef";
        this.updatePillowValueText(item);
        this.flashValueText(item, "#d8e3ef");
        this.pulseItem(item);
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
                    this.animateMysteryTransformItem(item, egg => {
                        if (egg.armored) return { ...egg };
                        return {
                            ...this.createArmoredEggData(egg),
                            mult: egg.mult
                        };
                    }, "#d8e3ef");
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
                startDelay: 950,
                stepDelay: 180,
                finishDelay: 950
            });
            return;
        }

        if (rewardIndex === 1 && goldBase) {
            const steps = activeItems
                .slice()
                .sort((a, b) => a.y - b.y)
                .map(item => () => {
                    const nextEggs = (item.eggs || []).map(egg => ({ ...egg }));
                    if (nextEggs.length < 2) {
                        nextEggs.push({
                            ...this.cloneEggTypeData(goldBase),
                            mult: goldBase.mult,
                            goldFx: true
                        });
                    }
                    this.setItemEggs(item, nextEggs);
                    item.eggMultSum *= 10;
                    item.currentValue *= 10;
                    if (nextEggs.some(egg => egg.armored)) item.armored = true;
                    item.permanentTextColor = "#f1cb4a";
                    this.updatePillowValueText(item);
                    this.flashValueText(item, "#fff2a3");
                    this.pulseItem(item);
                });

            this.runMysterySequence({
                title: "GOLD TWIN RUSH x10",
                textColor: "#fff2a3",
                accent: 0xf0cb4e,
                focusItems: activeItems,
                steps,
                startDelay: 950,
                stepDelay: 180,
                finishDelay: 950
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
            startDelay: 950,
            stepDelay: 180,
            finishDelay: 950
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

        if (def.type === "crush" || def.type === "shield") {
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
        const items = this.getStageItems(stage);
        const item = items.find(entry => entry.slotIndexLine === centerIndex)
            || items.find(entry => Math.abs(entry.x - targetX) <= line.slotWidth * 0.28);

        const performCrush = (done) => {
            const press = this.add.container(targetX, startY).setDepth(5050);
            const top = this.add.rectangle(0, -18, 74, 16, 0x66584f, 1).setStrokeStyle(3, 0xd7c0ab);
            const shaft = this.add.rectangle(0, 0, 18, 42, 0x918175, 1).setStrokeStyle(2, 0xe3d0ba);
            const head = def.type === "shield"
                ? this.add.rectangle(0, 28, 104, 32, 0x7a8692, 1).setStrokeStyle(4, 0xe5ecf4)
                : this.add.rectangle(0, 28, 96, 26, 0xa38f7f, 1).setStrokeStyle(4, 0xf0dcc4);
            if (def.type === "shield") {
                head.setFillStyle(0x7a8692, 1).setStrokeStyle(4, 0xe5ecf4);
            }
            press.add([shaft, top, head]);
            this.fxLayer.add(press);

            this.tweens.add({
                targets: press,
                y: targetY - 4,
                duration: 180,
                ease: "Quad.In",
                onComplete: () => {
                    if (item && !item.destroyed && !item.finished) {
                        item.container.x = targetX;
                    }
                    if (item) this.applyMachineEffect(def, item);
                    if (def.type === "shield") {
                        this.spawnMachineImpactFx({ type: "water" }, targetX, targetY - 4);
                    } else {
                        this.spawnCrushFx(targetX, targetY);
                    }

                    this.tweens.add({
                        targets: press,
                        y: startY,
                        alpha: 0,
                        duration: 140,
                        ease: "Quad.Out",
                        onComplete: () => {
                            press.destroy();
                            if (typeof done === "function") done();
                        }
                    });
                }
            });
        };

        if (item && (item.eggs || []).some(egg => egg.key === "mystery") && !item.focusApplied && !this.gameplayPaused) {
            item.focusApplied = true;
            this.runMysteryCrusherFocus(def, item, done => performCrush(() => {
                item.focusApplied = false;
                if (typeof done === "function") done();
            }));
            return;
        }

        performCrush();
    },

    spawnVerticalProjectile(def, line, stage, impactClock, flightTime) {
        const startX = def.container.x;
        const startY = def.container.y + 64;
        const centerIndex = this.getNearestLineSlotIndex(line, startX, impactClock);
        const endX = this.getLineSlotCenterXAtClock(line, centerIndex, impactClock);
        const endY = line.y + line.h * 0.5 - 6;
        const travelDuration = Math.round((flightTime || this.getMachineFlightTime(def, line)) * 1000);

        const items = this.getStageItems(stage);
        const item = items.find(entry => entry.slotIndexLine === centerIndex)
            || items.find(entry => Math.abs(entry.x - endX) <= line.slotWidth * 0.28);

        if (def && def.rarity === "gold" && def.type === "mul" && item && !item.eggsBox && !item.focusApplied && !this.gameplayPaused) {
            item.focusApplied = true;
            this.runGoldMachineLaserFocus(def, item, {
                startX,
                startY,
                endX,
                endY,
                travelDuration
            });
            return;
        }

        this.spawnMachineProjectile(def, startX, startY, endX, endY, travelDuration, () => {
            if (item && !item.destroyed && !item.finished) {
                item.container.x = endX;
            }
            if (item) this.applyMachineEffect(def, item);
            this.spawnMachineImpactFx(def, endX, endY);
        });
    },

    applyMachineEffect(def, item) {
        if (item.destroyed || item.finished) return;
        if (def && def.id) {
            item._machineHitCooldowns = item._machineHitCooldowns || {};
            const lastHitAt = item._machineHitCooldowns[def.id] || 0;
            if (this.time.now - lastHitAt < 260) return;
            item._machineHitCooldowns[def.id] = this.time.now;
        }
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
            if (nextDamage >= 1) {
                const nextEggs = armoredEggsLocal.map(egg => this.unwrapArmoredEggData(egg)).filter(Boolean);
                item.eggs = nextEggs;
                item.armored = nextEggs.some(egg => egg.armored);
                item.permanentTextColor = null;
                if (keepOnlyArmored) {
                    item.eggMultSum *= 0.5;
                    item.currentValue = Math.max(1, item.currentValue * 0.5);
                }
                this.setItemEggs(item, nextEggs);
                this.flashValueText(item, "#fff0e0");
                this.updatePillowValueText(item);
                return true;
            }

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
            this.applyMultiplierToItem(def, item);
            this.updatePillowValueText(item);
            this.flashValueText(item, def.rarity === "gold" ? "#fff2a3" : "#7dff9c");
            this.pulseItem(item);
            return;
        }

        if (def.type === "shield") {
            this.applyShieldToItem(item);
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

            if (armoredEggs.length > 0 && vulnerableEggs.length === 0 && maxArmorDamage < 1) {
                if (damageArmoredEggs(false)) {
                    this.spawnCrushFx(item.container.x, item.container.y - 4);
                    this.pulseItem(item);
                    return;
                }
            }

            if (armoredEggs.length > 0 && vulnerableEggs.length > 0 && maxArmorDamage < 1) {
                if (damageArmoredEggs(true)) {
                    this.spawnCrushFx(item.container.x, item.container.y - 4);
                    this.pulseItem(item);
                    return;
                }
            }

            item.destroyed = true;
            item.armored = false;
            this.clearWetFx(item);
            if (!item.settled) {
                this.addLose(item.spentCost || 0);
                item.settled = true;
            }

            if ((item.eggs || []).length > 0) {
                this.spawnEggSplatFx(item.container.x, item.container.y - 4, item.container.y + 6);
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
                    if (litBombEggs.length > 0 && !item.collectorBombRunning) {
                        this.runFinalCollectorBombFocus(item, () => {
                            item.finished = true;
                            this.clearWetFx(item);
                            this.breakMachinesByTypes(["fire", "crush"], 10000);
                            this.spawnBombExplosionFx(this.W - 24, item.y - 6);
                            item.settled = true;
                            if (!item.eggsBox) {
                                this.addWin(item.currentValue || 0);
                                this.updatePillowButtonLabels();
                                const hasGoldEgg = (item.eggs || []).some(egg => egg && (egg.goldFx || egg.key === "gold"));
                                this.pulseFinalCollector(0xffb25e, hasGoldEgg ? 1.55 : 1.2);
                                this.spawnImpactFx(this.W - 16, item.y, 0xffb25e);
                                this.showCenterWin(item.currentValue || 0);
                            }
                            item.container.destroy();
                        });
                        alive.push(item);
                        continue;
                    }

                    item.finished = true;
                    this.clearWetFx(item);
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
